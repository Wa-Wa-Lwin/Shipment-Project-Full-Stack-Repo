<?php

namespace App\Http\Controllers\Logistic\FedEx;

use App\Http\Controllers\Controller;
use App\Services\FedEx\FedExService;
use App\Services\FedEx\FedExShipmentBuilder;
use App\Services\FedEx\FedExShipmentRepository;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class FedExController extends Controller
{
    private FedExService $fedexService;

    private FedExShipmentBuilder $shipmentBuilder;

    private FedExShipmentRepository $repository;

    private string $apiUrl;

    private string $accountNumber;

    public function __construct(
        FedExService $fedexService,
        FedExShipmentBuilder $shipmentBuilder,
        FedExShipmentRepository $repository
    ) {
        $this->fedexService = $fedexService;
        $this->shipmentBuilder = $shipmentBuilder;
        $this->repository = $repository;
        $this->apiUrl = config('services.fedex.api_url', 'https://apis.fedex.com');
        $this->accountNumber = config('services.fedex.account_number');
    }

    /**
     * Get rate quotes from FedEx
     */
    public function getRateQuotes(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'shipper.postalCode' => 'required|string',
            'shipper.countryCode' => 'required|string|size:2',
            'shipper.city' => 'nullable|string',
            // 'shipper.stateOrProvinceCode' => 'nullable|string',
            'recipient.postalCode' => 'required|string',
            'recipient.countryCode' => 'required|string|size:2',
            'recipient.city' => 'nullable|string',
            // 'recipient.stateOrProvinceCode' => 'nullable|string',
            'recipient.residential' => 'nullable|boolean',
            'packages' => 'required|array|min:1',
            'packages.*.weight.value' => 'required|numeric|min:0.1',
            'packages.*.weight.units' => 'nullable|string|in:KG,LB',
            'packages.*.dimensions.length' => 'nullable|numeric|min:1',
            'packages.*.dimensions.width' => 'nullable|numeric|min:1',
            'packages.*.dimensions.height' => 'nullable|numeric|min:1',
            'packages.*.dimensions.units' => 'nullable|string|in:CM,IN',
            'pickupType' => 'nullable|string',
            'rateRequestType' => 'nullable|array',
            'accountNumber' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'error' => 'Validation failed',
                'messages' => $validator->errors(),
            ], 422);
        }

        $data = $validator->validated();

        try {
            // Get cached or fresh token automatically
            $accessToken = $this->fedexService->getAccessToken();

            if (! $accessToken) {
                return response()->json([
                    'success' => false,
                    'error' => 'Failed to obtain access token',
                ], 500);
            }

            // Build the request payload
            $payload = $this->buildRatePayload($data);

            // Make the API request to FedEx
            $response = Http::withHeaders([
                'Authorization' => "Bearer {$accessToken}",
                'Content-Type' => 'application/json',
                'X-locale' => 'en_US',
            ])->post("{$this->apiUrl}/rate/v1/rates/quotes", $payload);

            if ($response->successful()) {
                return response()->json([
                    'success' => true,
                    'data' => $response->json(),
                ]);
            }

            Log::error('FedEx Rate Request Failed', [
                'status' => $response->status(),
                'body' => $response->body(),
                'payload' => $payload,
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Rate request failed',
                'status' => $response->status(),
                'details' => $response->json(),
            ], 400);

        } catch (Exception $e) {
            Log::error('FedEx Rate Exception', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Quick rate quote with minimal parameters
     */
    public function getQuickRate(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'shipperPostalCode' => 'required|string',
            'shipperCountryCode' => 'required|string|size:2',
            'recipientPostalCode' => 'required|string',
            'recipientCountryCode' => 'required|string|size:2',
            'weight' => 'nullable|numeric|min:0.1',
            'weightUnit' => 'nullable|string|in:KG,LB',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'error' => 'Validation failed',
                'messages' => $validator->errors(),
            ], 422);
        }

        $data = $validator->validated();

        // Build a simple request and use getRateQuotes internally
        $quickRequest = new Request([
            'shipper' => [
                'postalCode' => $data['shipperPostalCode'],
                'countryCode' => $data['shipperCountryCode'],
            ],
            'recipient' => [
                'postalCode' => $data['recipientPostalCode'],
                'countryCode' => $data['recipientCountryCode'],
            ],
            'packages' => [[
                'weight' => [
                    'value' => $data['weight'] ?? 1.0,
                    'units' => $data['weightUnit'] ?? 'KG',
                ],
            ]],
        ]);

        return $this->getRateQuotes($quickRequest);
    }

    /**
     * Get OAuth access token
     */
    public function getToken(): JsonResponse
    {
        $token = $this->fedexService->getAccessToken();

        if ($token) {
            return response()->json([
                'success' => true,
                'access_token' => $token,
            ]);
        }

        return response()->json([
            'success' => false,
            'error' => 'Failed to obtain access token',
        ], 500);
    }

    /**
     * Clear cached token (force refresh on next request)
     */
    public function clearTokenCache(): JsonResponse
    {
        $this->fedexService->clearCachedToken();

        return response()->json([
            'success' => true,
            'message' => 'Token cache cleared successfully',
        ]);
    }

    /**
     * Build the rate request payload for FedEx API
     */
    private function buildRatePayload(array $data): array
    {
        return [
            'accountNumber' => [
                'value' => $data['accountNumber'] ?? $this->accountNumber,
            ],
            'requestedShipment' => [
                'shipper' => [
                    'address' => [
                        'postalCode' => $data['shipper']['postalCode'],
                        'countryCode' => $data['shipper']['countryCode'],
                        'city' => $data['shipper']['city'] ?? null,
                        // 'stateOrProvinceCode' => $data['shipper']['stateOrProvinceCode'] ?? null,
                    ],
                ],
                'recipient' => [
                    'address' => [
                        'postalCode' => $data['recipient']['postalCode'],
                        'countryCode' => $data['recipient']['countryCode'],
                        'city' => $data['recipient']['city'] ?? null,
                        // 'stateOrProvinceCode' => $data['recipient']['stateOrProvinceCode'] ?? null,
                        'residential' => $data['recipient']['residential'] ?? false,
                    ],
                ],
                'pickupType' => $data['pickupType'] ?? 'CONTACT_FEDEX_TO_SCHEDULE',
                'rateRequestType' => $data['rateRequestType'] ?? ['ACCOUNT', 'LIST'],
                'requestedPackageLineItems' => $this->buildPackageLineItems($data['packages'] ?? []),
            ],
        ];
    }

    /**
     * Build package line items for FedEx API
     */
    private function buildPackageLineItems(array $packages): array
    {
        if (empty($packages)) {
            return [[
                'weight' => [
                    'units' => 'KG',
                    'value' => '1',
                ],
            ]];
        }

        return array_map(function ($package) {
            $item = [
                'weight' => [
                    'units' => $package['weight']['units'] ?? 'KG',
                    'value' => (string) ($package['weight']['value'] ?? '1'),
                ],
            ];

            // Add dimensions if provided
            if (isset($package['dimensions'])) {
                $item['dimensions'] = [
                    'length' => (int) $package['dimensions']['length'],
                    'width' => (int) $package['dimensions']['width'],
                    'height' => (int) $package['dimensions']['height'],
                    'units' => $package['dimensions']['units'] ?? 'CM',
                ];
            }

            return $item;
        }, $packages);
    }

    /**
     * Validate shipment payload for FedEx Direct API
     * Standalone function that takes shipment request ID
     *
     * @param  int  $id  Shipment Request ID
     */
    public function validateShipmentPayloadFedEx(int $id): JsonResponse
    {
        try {
            // Load shipment with all required relations
            $shipment = $this->repository->findWithRelations($id);

            if (! $shipment) {
                return response()->json([
                    'valid' => false,
                    'message' => 'Shipment Request not found',
                    'shipment_request_id' => $id,
                    'errors' => ['Shipment Request not found'],
                ], 404);
            }

            // Get chosen rate
            $rate = $shipment->rates->firstWhere('chosen', '1');
            if (! $rate) {
                return response()->json([
                    'valid' => false,
                    'message' => 'No chosen rate found',
                    'shipment_request_id' => $shipment->shipmentRequestID,
                    'errors' => ['No chosen rate found: validation requires a chosen rate'],
                ], 400);
            }

            // Validate that it's a FedEx shipment
            $isFedex = stripos(strtolower($rate->shipper_account_slug ?? ''), 'fedex') !== false;
            if (! $isFedex) {
                return response()->json([
                    'valid' => false,
                    'message' => 'This is not a FedEx shipment',
                    'shipment_request_id' => $shipment->shipmentRequestID,
                    'carrier' => $rate->shipper_account_slug ?? null,
                    'errors' => ['This validation endpoint is only for FedEx shipments. Use /validate_shipment_payload for other carriers.'],
                ], 400);
            }

            // Perform basic validation
            $errors = $this->validateFedExShipmentData($shipment);

            if (! empty($errors)) {
                Log::warning('FedEx shipment payload validation failed', [
                    'shipment_request_id' => $shipment->shipmentRequestID,
                    'errors' => $errors,
                ]);

                return response()->json([
                    'valid' => false,
                    'message' => 'FedEx shipment payload validation failed',
                    'shipment_request_id' => $shipment->shipmentRequestID,
                    'errors' => $errors,
                    'error_count' => count($errors),
                ], 400);
            }

            // Build FedEx Direct API payload
            try {
                $payload = $this->shipmentBuilder->buildShipmentPayload($shipment, $rate);

                Log::info('FedEx shipment payload validation passed', [
                    'shipment_request_id' => $shipment->shipmentRequestID,
                ]);

                return response()->json([
                    'valid' => true,
                    'message' => 'FedEx shipment payload validation passed',
                    'shipment_request_id' => $shipment->shipmentRequestID,
                    'carrier' => $rate->shipper_account_slug ?? null,
                    'service_type' => $rate->service_type ?? null,
                    'api_endpoint' => $this->apiUrl.'/ship/v1/shipments',
                    'payload' => $payload,
                ], 200);

            } catch (Exception $e) {
                Log::error('Failed to build FedEx payload', [
                    'shipment_request_id' => $shipment->shipmentRequestID,
                    'error' => $e->getMessage(),
                ]);

                return response()->json([
                    'valid' => false,
                    'message' => 'Failed to build FedEx payload',
                    'shipment_request_id' => $shipment->shipmentRequestID,
                    'errors' => ['Failed to build payload: '.$e->getMessage()],
                ], 500);
            }

        } catch (Exception $e) {
            Log::error('FedEx Payload Validation Exception', [
                'shipment_request_id' => $id,
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'valid' => false,
                'message' => 'Exception occurred during validation',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Validate FedEx shipment data
     *
     * @param  mixed  $shipment
     * @return array Array of validation errors
     */
    private function validateFedExShipmentData($shipment): array
    {
        $errors = [];

        // Validate ship_from address
        if (! $shipment->shipFrom) {
            $errors[] = 'Ship from address is missing';
        } else {
            if (empty($shipment->shipFrom->company_name)) {
                $errors[] = 'Ship from company name is required';
            }
            if (empty($shipment->shipFrom->street1)) {
                $errors[] = 'Ship from street1 is required';
            }
            if (empty($shipment->shipFrom->city)) {
                $errors[] = 'Ship from city is required';
            }
            if (empty($shipment->shipFrom->postal_code)) {
                $errors[] = 'Ship from postal code is required';
            }
            if (empty($shipment->shipFrom->country)) {
                $errors[] = 'Ship from country is required';
            }
            if (empty($shipment->shipFrom->phone)) {
                $errors[] = 'Ship from phone is required';
            }
        }

        // Validate ship_to address
        if (! $shipment->shipTo) {
            $errors[] = 'Ship to address is missing';
        } else {
            if (empty($shipment->shipTo->company_name)) {
                $errors[] = 'Ship to company name is required';
            }
            if (empty($shipment->shipTo->street1)) {
                $errors[] = 'Ship to street1 is required';
            }
            if (empty($shipment->shipTo->city)) {
                $errors[] = 'Ship to city is required';
            }
            if (empty($shipment->shipTo->postal_code)) {
                $errors[] = 'Ship to postal code is required';
            }
            if (empty($shipment->shipTo->country)) {
                $errors[] = 'Ship to country is required';
            }
            if (empty($shipment->shipTo->phone)) {
                $errors[] = 'Ship to phone is required';
            }
        }

        // Validate parcels
        if (! $shipment->parcels || $shipment->parcels->isEmpty()) {
            $errors[] = 'At least one parcel is required';
        } else {
            foreach ($shipment->parcels as $index => $parcel) {
                $parcelNum = $index + 1;

                if (empty($parcel->width) || $parcel->width <= 0) {
                    $errors[] = "Parcel #{$parcelNum}: Width must be greater than 0";
                }
                if (empty($parcel->height) || $parcel->height <= 0) {
                    $errors[] = "Parcel #{$parcelNum}: Height must be greater than 0";
                }
                if (empty($parcel->depth) || $parcel->depth <= 0) {
                    $errors[] = "Parcel #{$parcelNum}: Depth must be greater than 0";
                }
                if (empty($parcel->weight_value) || $parcel->weight_value <= 0) {
                    $errors[] = "Parcel #{$parcelNum}: Weight must be greater than 0";
                }
                if (empty($parcel->dimension_unit)) {
                    $errors[] = "Parcel #{$parcelNum}: Dimension unit is required";
                }
                if (empty($parcel->weight_unit)) {
                    $errors[] = "Parcel #{$parcelNum}: Weight unit is required";
                }
            }
        }

        // Validate pickup date
        if (empty($shipment->pick_up_date)) {
            $errors[] = 'Pickup date is required';
        }

        return $errors;
    }
}
