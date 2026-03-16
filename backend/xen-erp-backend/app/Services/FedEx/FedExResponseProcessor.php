<?php

namespace App\Services\FedEx;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

class FedExResponseProcessor
{
    public function __construct(
        protected FedExShipmentRepository $repository,
        protected ?FedExAPIClient $apiClient = null,
        protected ?FedExPickupBuilder $pickupBuilder = null
    ) {
        $this->apiClient = $apiClient ?? app(FedExAPIClient::class);
        $this->pickupBuilder = $pickupBuilder ?? app(FedExPickupBuilder::class);
    }

    /**
     * Process FedEx Create Shipment API response
     *
     * @param  mixed  $shipmentRequest  ShipmentRequest model
     * @param  mixed  $response  HTTP response from FedEx API
     * @param  array  $responseBody  Parsed JSON response
     * @param  array  $payload  Original request payload
     * @return \Illuminate\Http\JsonResponse
     */
    public function processShipmentResponse($shipmentRequest, $response, $responseBody, $payload)
    {
        $statusCode = $response->status();

        // Handle error response
        if (! $response->successful() || empty($responseBody['output']['transactionShipments'])) {
            return $this->handleShipmentError($shipmentRequest, $responseBody, $payload, $statusCode);
        }

        // Extract shipment data from response
        $transactionShipment = $responseBody['output']['transactionShipments'][0];
        $pieceResponse = $transactionShipment['pieceResponses'][0] ?? null;

        // Extract label URL - check both shipmentDocuments and packageDocuments
        $labelUrl = $this->extractLabelUrl($transactionShipment, $pieceResponse);

        // Extract tracking number
        $trackingNumber = $this->extractTrackingNumber($pieceResponse, $transactionShipment);

        // Validate required data
        if (! $trackingNumber || ! $labelUrl) {
            return $this->handleMissingData($shipmentRequest, $responseBody, $payload);
        }

        // Update shipment request with success data
        $this->updateShipmentWithSuccess($shipmentRequest, $trackingNumber, $labelUrl);

        // Save API record for successful request
        $this->repository->saveShipmentRecord($shipmentRequest, $responseBody, $payload, true);

        // Handle pickup creation logic
        return $this->handlePickupCreation($shipmentRequest, $responseBody, $payload, $trackingNumber, $labelUrl);
    }

    /**
     * Extract label URL from response
     * Checks both shipmentDocuments and packageDocuments
     */
    protected function extractLabelUrl($transactionShipment, $pieceResponse): ?string
    {
        $labelUrl = null;

        // First check shipmentDocuments (transaction level)
        if (! empty($transactionShipment['shipmentDocuments'])) {
            foreach ($transactionShipment['shipmentDocuments'] as $doc) {
                if (($doc['contentType'] ?? null) === 'LABEL' || ($doc['docType'] ?? null) === 'PDF') {
                    $labelUrl = $doc['url'] ?? null;
                    break;
                }
            }
        }

        // If not found, check packageDocuments (piece level)
        if (! $labelUrl && ! empty($pieceResponse['packageDocuments'])) {
            foreach ($pieceResponse['packageDocuments'] as $doc) {
                if (($doc['contentType'] ?? null) === 'LABEL' || ($doc['docType'] ?? null) === 'PDF') {
                    $labelUrl = $doc['url'] ?? $doc['encodedLabel']; // LABEL_RESPONSE_URL_ONLY or LABEL_RESPONSE_LABEL_BASE64
                    break;
                }
            }
        }

        return $labelUrl;
    }

    /**
     * Extract tracking number from response
     */
    protected function extractTrackingNumber($pieceResponse, $transactionShipment): ?string
    {
        return $pieceResponse['trackingNumber'] ??
               $pieceResponse['masterTrackingNumber'] ??
               $transactionShipment['masterTrackingNumber'] ?? null;
    }

    /**
     * Update shipment request with successful label creation data
     */
    protected function updateShipmentWithSuccess($shipmentRequest, $trackingNumber, $labelUrl): void
    {
        $invoiceDate = Carbon::now()->toDateString();
        $invoiceDueDate = Carbon::now()->addDays(FedExConstants::INVOICE_DUE_DAYS)->toDateString();

        $shipmentRequest->label_status = 'created';
        $shipmentRequest->tracking_numbers = $trackingNumber;
        $shipmentRequest->files_label_url = $labelUrl;
        $shipmentRequest->error_msg = '-';

        // Set invoice details if not already set
        if (empty($shipmentRequest->invoice_no)) {
            $shipmentRequest->invoice_no = FedExConstants::INVOICE_PREFIX_FEDEX.$trackingNumber;
        }
        $shipmentRequest->invoice_date = $invoiceDate;
        $shipmentRequest->invoice_due_date = $invoiceDueDate;

        $shipmentRequest->save();

        // Best-effort warehouse notification when FedEx label is created
        try {
            app(\App\Http\Controllers\Logistic\EmailTemplateController::class)->warehouseNotification($shipmentRequest->shipmentRequestID);
        } catch (\Exception $e) {
            Log::warning('Failed to send warehouse notification after FedEx label creation', [
                'shipment_request_id' => $shipmentRequest->shipmentRequestID,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Handle pickup creation based on pickup date
     */
    protected function handlePickupCreation($shipmentRequest, $responseBody, $payload, $trackingNumber, $labelUrl)
    {
        $pickupDate = Carbon::parse($shipmentRequest->pick_up_date);
        $today = Carbon::today();
        $tomorrow = Carbon::tomorrow();

        // Skip pickup for future dates (not today or tomorrow)
        $shouldSkipPickup = ! $pickupDate->isSameDay($today) && ! $pickupDate->isSameDay($tomorrow);

        if ($shouldSkipPickup) {
            return response()->json([
                'message' => 'Label created successfully via FedEx Direct API. FedEx pickup will be automatically scheduled by the system.',
                'response' => $responseBody,
                'payload' => $payload,
                'tracking_number' => $trackingNumber,
                'label_url' => $labelUrl,
                'pickup_info' => 'FedEx pickup for '.$pickupDate->toDateString().' will be scheduled automatically',
            ], 200);
        }

        // Create pickup immediately for today/tomorrow
        return $this->createPickup($shipmentRequest, $responseBody, $payload, $trackingNumber, $labelUrl);
    }

    /**
     * Create pickup for today/tomorrow shipments
     */
    protected function createPickup($shipmentRequest, $shipmentResponse, $shipmentPayload, $trackingNumber, $labelUrl)
    {
        $chosenRate = $shipmentRequest->rates->firstWhere('chosen', '1');

        if (! $chosenRate) {
            return response()->json([
                'message' => 'Label created via FedEx Direct API but no rate found for pickup.',
                'response' => $shipmentResponse,
                'payload' => $shipmentPayload,
                'tracking_number' => $trackingNumber,
                'label_url' => $labelUrl,
            ], 200);
        }

        try {
            $pickupPayload = $this->pickupBuilder->buildPickupPayload($shipmentRequest, $chosenRate);
            $pickupResponse = $this->apiClient->createPickup($pickupPayload);
            $pickupBody = $pickupResponse->json();

            // Process pickup response
            if ($pickupResponse->successful() && ! empty($pickupBody['output'])) {
                $pickupConfirmationCode = $pickupBody['output']['pickupConfirmationCode'] ?? null;

                if ($pickupConfirmationCode) {
                    $shipmentRequest->pick_up_created_id = $pickupConfirmationCode;
                    $shipmentRequest->pickup_confirmation_numbers = $pickupConfirmationCode;
                    $shipmentRequest->pick_up_created_status = 'created_success';
                    $shipmentRequest->pick_up_error_msg = null;
                    $shipmentRequest->save();

                    return response()->json([
                        'message' => 'Label created successfully via FedEx Direct API and pickup created successfully.',
                        'response' => $shipmentResponse,
                        'payload' => $shipmentPayload,
                        'tracking_number' => $trackingNumber,
                        'label_url' => $labelUrl,
                        'pickup_confirmation_code' => $pickupConfirmationCode,
                        'pickup_response' => $pickupBody,
                    ], 200);
                }
            }

            // Pickup failed
            $shipmentRequest->pick_up_created_status = 'created_failed';
            $shipmentRequest->pick_up_error_msg = 'Pickup creation failed';
            $shipmentRequest->save();

            return response()->json([
                'message' => 'Label created via FedEx Direct API but pickup creation failed.',
                'response' => $shipmentResponse,
                'payload' => $shipmentPayload,
                'tracking_number' => $trackingNumber,
                'label_url' => $labelUrl,
                'pickup_error' => $pickupBody,
            ], 200);

        } catch (\Exception $e) {
            Log::error('Pickup creation exception', ['error' => $e->getMessage()]);

            return response()->json([
                'message' => 'Label created via FedEx Direct API but pickup creation failed.',
                'response' => $shipmentResponse,
                'payload' => $shipmentPayload,
                'tracking_number' => $trackingNumber,
                'label_url' => $labelUrl,
                'pickup_error' => $e->getMessage(),
            ], 200);
        }
    }

    /**
     * Handle shipment error response
     */
    protected function handleShipmentError($shipmentRequest, $responseBody, $payload, $statusCode)
    {
        $shipmentRequest->label_status = 'failed';

        $errorMessages = [];
        if (! empty($responseBody['errors'])) {
            foreach ($responseBody['errors'] as $error) {
                $errorMessages[] = ($error['code'] ?? 'ERROR').': '.($error['message'] ?? 'Unknown error');
            }
        } elseif (! empty($responseBody['output']['alerts'])) {
            foreach ($responseBody['output']['alerts'] as $alert) {
                if (($alert['alertType'] ?? null) === 'ERROR') {
                    $errorMessages[] = ($alert['code'] ?? 'ERROR').': '.($alert['message'] ?? 'Unknown error');
                }
            }
        } else {
            $errorMessages[] = 'Label Creation Failed via FedEx Direct API';
        }

        $shipmentRequest->error_msg = implode(' | ', $errorMessages);
        $shipmentRequest->save();

        // Save API record for failed request
        $this->repository->saveShipmentRecord($shipmentRequest, $responseBody, $payload, false);

        return response()->json([
            'message' => 'Label creation failed.',
            'response' => $responseBody,
            'payload' => $payload,
        ], $statusCode);
    }

    /**
     * Handle missing required data in response
     */
    protected function handleMissingData($shipmentRequest, $responseBody, $payload)
    {
        $shipmentRequest->label_status = 'failed';
        $shipmentRequest->error_msg = 'Missing tracking number or label URL in FedEx response';
        $shipmentRequest->save();

        // Save API record for failed request
        $this->repository->saveShipmentRecord($shipmentRequest, $responseBody, $payload, false);

        return response()->json([
            'message' => 'Label creation incomplete - missing data.',
            'response' => $responseBody,
            'payload' => $payload,
        ], 400);
    }
}
