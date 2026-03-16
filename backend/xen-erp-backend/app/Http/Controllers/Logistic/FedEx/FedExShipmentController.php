<?php

namespace App\Http\Controllers\Logistic\FedEx;

use App\Http\Controllers\Controller;
use App\Services\FedEx\FedExAPIClient;
use App\Services\FedEx\FedExResponseProcessor;
use App\Services\FedEx\FedExShipmentBuilder;
use App\Services\FedEx\FedExShipmentRepository;
use Illuminate\Support\Facades\Log;

class FedExShipmentController extends Controller
{
    public function __construct(
        protected FedExShipmentBuilder $builder,
        protected FedExAPIClient $client,
        protected FedExResponseProcessor $processor,
        protected FedExShipmentRepository $repo
    ) {}

    /**
     * Create shipping label via FedEx Direct API
     *
     * @param  int  $id  Shipment Request ID
     * @return \Illuminate\Http\JsonResponse
     */
    public function createLabelViaFedex(int $id)
    {
        // Load shipment with all required relations
        $shipment = $this->repo->findWithRelations($id);

        if (! $shipment) {
            return response()->json(['message' => 'Shipment Request not found'], 404);
        }

        $rate = $shipment->rates->firstWhere('chosen', '1');
        if (! $rate) {
            $shipment->error_msg = 'No chosen rate found: create label';
            $shipment->save();

            return response()->json(['message' => 'No chosen rate found: create label'], 400);
        }

        try {
            // Build shipment payload
            $payload = $this->builder->buildShipmentPayload($shipment, $rate);

            // Make API call to FedEx
            $response = $this->client->createShipment($payload);
            $responseBody = $response->json();

            // Process the response
            return $this->processor->processShipmentResponse($shipment, $response, $responseBody, $payload);

        } catch (\Throwable $e) {
            $shipment->label_status = 'failed';
            $shipment->error_msg = 'Exception: '.$e->getMessage();
            $shipment->save();

            Log::error('FedEx Label Creation Error', ['id' => $id, 'error' => $e->getMessage()]);

            return response()->json([
                'meta' => [
                    'code' => 5000,
                    'message' => 'Exception occurred: '.$e->getMessage(),
                    'details' => [],
                    'retryable' => false,
                ],
                'data' => null,
            ], 500);
        }
    }

    /**
     * Create pickup via FedEx Direct API
     * Used for manual pickup creation when automatic pickup fails
     *
     * @param  int  $id  Shipment Request ID
     * @return \Illuminate\Http\JsonResponse
     */
    public function createPickupViaFedex(int $id)
    {
        // Load shipment with required relations
        $shipment = $this->repo->findWithRelations($id);

        if (! $shipment) {
            return response()->json(['message' => 'Shipment Request not found'], 404);
        }

        $rate = $shipment->rates->firstWhere('chosen', '1');
        if (! $rate) {
            $shipment->pick_up_error_msg = 'No chosen rate found: create pickup';
            $shipment->save();

            return response()->json(['message' => 'No chosen rate found: create pickup'], 400);
        }

        try {
            // Build pickup payload
            $pickupPayload = app(\App\Services\FedEx\FedExPickupBuilder::class)
                ->buildPickupPayload($shipment, $rate);

            // Make API call to FedEx
            $response = $this->client->createPickup($pickupPayload);
            $responseBody = $response->json();

            // Process pickup response
            if ($response->successful() && ! empty($responseBody['output'])) {
                $pickupConfirmationCode = $responseBody['output']['pickupConfirmationCode'] ?? null;

                if ($pickupConfirmationCode) {
                    $shipment->pick_up_created_id = $pickupConfirmationCode;
                    $shipment->pickup_confirmation_numbers = $pickupConfirmationCode;
                    $shipment->pick_up_created_status = 'created_success';
                    $shipment->pick_up_error_msg = null;
                    $shipment->save();

                    return response()->json([
                        'message' => 'Pickup created successfully via FedEx Direct API.',
                        'pickup_confirmation_code' => $pickupConfirmationCode,
                        'response' => $responseBody,
                    ], 200);
                }
            }

            // Handle error
            $shipment->pick_up_created_status = 'created_failed';
            $errorMessages = [];
            if (! empty($responseBody['errors'])) {
                foreach ($responseBody['errors'] as $error) {
                    $errorMessages[] = ($error['code'] ?? 'ERROR').': '.($error['message'] ?? 'Unknown error');
                }
            } else {
                $errorMessages[] = 'Pickup Creation Failed via FedEx Direct API';
            }
            $shipment->pick_up_error_msg = implode(' | ', $errorMessages);
            $shipment->save();

            return response()->json([
                'message' => 'Pickup creation failed.',
                'response' => $responseBody,
            ], $response->status());

        } catch (\Throwable $e) {
            $shipment->pick_up_created_status = 'created_failed';
            $shipment->pick_up_error_msg = 'Exception: '.$e->getMessage();
            $shipment->save();

            Log::error('FedEx Pickup Creation Error', ['id' => $id, 'error' => $e->getMessage()]);

            return response()->json([
                'message' => 'Exception occurred: '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get all FedEx API shipments
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getAll()
    {
        try {
            $fedexApiShipments = $this->repo->getAllFedExApiShipments();

            return response()->json([
                'message' => 'All FedEx API shipments retrieved successfully',
                'data' => $fedexApiShipments,
            ], 200);

        } catch (\Throwable $e) {
            Log::error('FedEx Get All API Shipments Error', ['error' => $e->getMessage()]);

            return response()->json([
                'message' => 'Exception occurred: '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get one FedEx API shipment by ID
     *
     * @param  int  $id  FedEx API Shipment ID (fedExApiShipmentID)
     * @return \Illuminate\Http\JsonResponse
     */
    public function getOne(int $id)
    {
        try {
            // Load FedEx API shipment with shipment request relation
            $fedexApiShipment = $this->repo->findFedExApiShipment($id);

            if (! $fedexApiShipment) {
                return response()->json(['message' => 'FedEx API Shipment not found'], 404);
            }

            return response()->json([
                'message' => 'FedEx API shipment retrieved successfully',
                'data' => $fedexApiShipment,
            ], 200);

        } catch (\Throwable $e) {
            Log::error('FedEx Get One API Shipment Error', ['id' => $id, 'error' => $e->getMessage()]);

            return response()->json([
                'message' => 'Exception occurred: '.$e->getMessage(),
            ], 500);
        }
    }
}
