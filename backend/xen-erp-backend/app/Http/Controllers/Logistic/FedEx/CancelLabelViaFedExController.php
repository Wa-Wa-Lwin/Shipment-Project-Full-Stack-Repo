<?php

namespace App\Http\Controllers\Logistic\FedEx;

use App\Models\Logistic\FedExAPICreateShipment;
use App\Models\Logistic\ShipmentRequest;
use App\Services\FedEx\FedExConstants;
use App\Services\FedEx\FedExService;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CancelLabelViaFedExController
{
    protected FedExService $fedexService;

    protected string $fedexApiUrl;

    public function __construct(FedExService $fedexService)
    {
        $this->fedexService = $fedexService;
        $this->fedexApiUrl = config('services.fedex.api_url', 'https://apis.fedex.com');
    }

    /**
     * Cancel shipment via ShipmentRequest ID
     */
    public function cancelShipmentViaFedex_with_shipment_request_id(int $id): JsonResponse
    {
        $shipment = ShipmentRequest::find($id);

        if (! $shipment) {
            return response()->json([
                'message' => 'Shipment Request not found.',
                'shipment_request_id' => $id,
            ], 404);
        }

        $trackingNumber = $this->extractTrackingNumber($shipment->tracking_numbers);
        throw_if(empty($trackingNumber), Exception::class, 'Cannot cancel shipment - no tracking number found.');

        return $this->cancelFedexShipment($trackingNumber, $shipment);
    }

    /**
     * Cancel shipment via FedExAPICreateShipment ID
     */
    public function cancelShipmentViaFedex_with_FedexApiId(int $fedExApiShipmentID): JsonResponse
    {
        $fedexShipment = FedExAPICreateShipment::find($fedExApiShipmentID);

        if (! $fedexShipment) {
            return response()->json([
                'message' => 'FedEx API Shipment not found.',
                'fedex_api_shipment_id' => $fedExApiShipmentID,
            ], 404);
        }
        $trackingNumber = $this->extractTrackingNumber($fedexShipment->trackingNumber ?? $fedexShipment->masterTrackingNumber);
        throw_if(empty($trackingNumber), Exception::class, 'Cannot cancel shipment - no tracking number found.');

        return $this->cancelFedexShipment($trackingNumber, $fedexShipment);
    }

    /**
     * Shared logic for both cancel routes
     */
    protected function cancelFedexShipment(string $trackingNumber, $model): JsonResponse
    {
        try {
            $accessToken = $this->fedexService->getAccessToken();
            if (! $accessToken) {
                return response()->json(['message' => 'Failed to obtain FedEx access token'], 500);
            }

            $accountNumber = $model->accountNumber ?? config('services.fedex.account_number');
            $payload = $this->buildCancelPayload($accountNumber, $trackingNumber);

            $response = $this->sendCancelRequest($accessToken, $payload);
            $responseBody = $response->json();

            Log::info('FedEx Cancel Shipment API Response', [
                'model_type' => class_basename($model),
                'model_id' => $model->getKey(),
                'tracking_number' => $trackingNumber,
                'status_code' => $response->status(),
                'response' => $responseBody,
            ]);

            if (! $response->successful()) {
                return $this->handleErrorResponse($model, $response, $responseBody, $payload);
            }

            // Update model
            $this->markShipmentCancelled($model);

            return response()->json([
                'message' => 'Shipment cancelled successfully via FedEx Direct API.',
                'tracking_number' => $trackingNumber,
                'status_code' => $response->status(),
                'payload' => $payload,
                'response' => $responseBody,
            ], 200);
        } catch (Exception $e) {
            Log::error('FedEx Cancel Shipment Exception', [
                'model_type' => class_basename($model),
                'model_id' => $model->getKey(),
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Exception occurred: '.$e->getMessage(),
                'code' => 500,
            ], 500);
        }
    }

    /**
     * Build FedEx Cancel Shipment API payload
     */
    protected function buildCancelPayload(string $accountNumber, string $trackingNumber): array
    {
        return [
            'accountNumber' => ['value' => $accountNumber],
            'trackingNumber' => $trackingNumber,
            'deletionControl' => FedExConstants::FEDEX_DELETE_ALL_PACKAGES,
        ];
    }

    /**
     * Send cancel request to FedEx API
     */
    protected function sendCancelRequest(string $accessToken, array $payload)
    {
        return Http::withHeaders([
            'Authorization' => "Bearer {$accessToken}",
            'Content-Type' => 'application/json',
            'X-locale' => 'en_US',
        ])->put("{$this->fedexApiUrl}/ship/v1/shipments/cancel", $payload);
    }

    /**
     * Handle error response from FedEx API
     */
    protected function handleErrorResponse($model, $response, $body, $payload): JsonResponse
    {
        $errors = collect($body['errors'] ?? [])
            ->map(fn ($e) => ($e['code'] ?? 'ERROR').': '.($e['message'] ?? 'Unknown error'))
            ->implode(' | ');

        Log::warning('FedEx Shipment Cancellation Failed', [
            'model_type' => class_basename($model),
            'model_id' => $model->getKey(),
            'error' => $errors,
        ]);

        return response()->json([
            'message' => 'Shipment cancellation failed.',
            'status_code' => $response->status(),
            'error' => $errors ?: 'Unknown FedEx error',
            'payload' => $payload,
            'response' => $body,
        ], $response->status());
    }

    /**
     * Mark shipment as cancelled in the database
     */
    protected function markShipmentCancelled($model): void
    {
        if ($model instanceof ShipmentRequest) {
            $model->update([
                'label_status' => FedExConstants::LABEL_STATUS_CANCELLED,
                'error_msg' => 'Shipment cancelled via FedEx Direct API',
            ]);
        } elseif ($model instanceof FedExAPICreateShipment) {
            $model->update(['created_status' => FedExConstants::LABEL_STATUS_CANCELLED]);

            // Also update related ShipmentRequest if it exists
            if ($model->shipment_request_id) {
                ShipmentRequest::where('shipmentRequestID', $model->shipment_request_id)
                    ->update([
                        'label_status' => FedExConstants::LABEL_STATUS_CANCELLED,
                        'error_msg' => 'Shipment cancelled via FedEx Direct API',
                    ]);
            }
        }
    }

    /**
     * Extract first tracking number from comma-separated string
     */
    protected function extractTrackingNumber(?string $trackingNumbers): ?string
    {
        if (empty($trackingNumbers)) {
            return null;
        }

        if (strpos($trackingNumbers, ',') !== false) {
            $numbers = explode(',', $trackingNumbers);

            return trim($numbers[0]);
        }

        return trim($trackingNumbers);
    }
}
