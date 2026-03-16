<?php

namespace App\Http\Controllers\Logistic;

use App\Http\Controllers\Logistic\FedEx\FedExController;
use App\Http\Controllers\Logistic\FedEx\FedExShipmentController;
use App\Models\Logistic\ShipmentRequest;
use App\Services\FedEx\FedExService;
use App\Services\FedEx\FedExShipmentBuilder;
use GuzzleHttp\Client;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

class CreateLabelController
{
    protected $emailTemplateController;

    protected $fedexService;

    protected $fedexController;

    protected $fedexShipmentController;

    protected $fedexShipmentBuilder;

    protected $createPickupController;

    protected $createLabel_Not_Calculate_Rates_Controller;

    protected $pdfExportController;

    public function __construct(
        ?FedExService $fedexService = null,
        ?FedExController $fedexController = null,
        ?FedExShipmentController $fedexShipmentController = null,
        ?FedExShipmentBuilder $fedexShipmentBuilder = null,
        ?CreatePickupController $createPickupController = null,
        ?CreateLabel_Not_Calculate_Rates_Controller $createLabel_Not_Calculate_Rates_Controller = null,
        ?PdfExportController $pdfExportController = null,
    ) {
        $this->emailTemplateController = new EmailTemplateController;
        $this->fedexService = $fedexService ?? app(FedExService::class);
        $this->fedexController = $fedexController ?? app(FedExController::class);
        $this->fedexShipmentController = $fedexShipmentController ?? app(FedExShipmentController::class);
        $this->fedexShipmentBuilder = $fedexShipmentBuilder ?? app(FedExShipmentBuilder::class);
        $this->createPickupController = $createPickupController ?? app(CreatePickupController::class);
        $this->createLabel_Not_Calculate_Rates_Controller = $createLabel_Not_Calculate_Rates_Controller ?? app(CreateLabel_Not_Calculate_Rates_Controller::class);
        $this->pdfExportController = $pdfExportController ?? app(PdfExportController::class);
    }

    /**
     * Determines the appropriate FedEx box type based on parcel dimensions and weight
     * Returns 'custom' for non-FedEx carriers or 'fedex_box' as fallback for FedEx
     *
     * Automatically converts units:
     * - Dimensions: cm → inches (÷ 2.54)
     * - Weight: kg → lbs (× 2.20462)
     *
     * @param  object  $parcel  The parcel with dimensions and weight
     * @param  string  $serviceType  The shipping service type
     * @param  string  $shipperAccountSlug  The shipper account slug (e.g., 'fedex')
     * @return string The box type identifier
     */
    protected function determineFedexBoxType($parcel, $serviceType, $shipperAccountSlug)
    {
        // Only apply special logic for FedEx services
        $isFedex = strtolower($shipperAccountSlug ?? '') === 'fedex';

        // For non-FedEx carriers, use 'custom'
        if (! $isFedex) {
            return 'custom';
        }

        // Check if this is a FedEx Freight service that doesn't accept 'custom'
        $isFedexFreight = stripos($serviceType, 'freight') !== false;

        // Convert dimensions and weight to standard units for comparison
        $dimensionUnit = strtolower($parcel->dimension_unit ?? 'in');
        $weightUnit = strtolower($parcel->weight_unit ?? 'lb');

        // Convert dimensions to inches
        $width = (float) $parcel->width;
        $height = (float) $parcel->height;
        $depth = (float) $parcel->depth;

        if ($dimensionUnit === 'cm') {
            $width = $width / 2.54;  // cm to inches
            $height = $height / 2.54;
            $depth = $depth / 2.54;
        }

        // Convert weight to lbs
        $weight = (float) $parcel->weight_value;
        if ($weightUnit === 'kg') {
            $weight = $weight * 2.20462;  // kg to lbs
        }

        // FedEx box specifications (all dimensions in inches, weight in lbs)
        $fedexBoxes = [
            'fedex_envelope' => ['w' => 9.252, 'h' => 13.18, 'd' => 0.5, 'max_weight' => 1.1],
            'fedex_pak' => ['w' => 11.75, 'h' => 14.75, 'd' => 1, 'max_weight' => 5.5],
            'fedex_small_box' => ['w' => 12.25, 'h' => 10.9, 'd' => 1.5, 'max_weight' => 20],
            'fedex_medium_box' => ['w' => 13.25, 'h' => 11.5, 'd' => 2.38, 'max_weight' => 20],
            'fedex_large_box' => ['w' => 17.88, 'h' => 12.38, 'd' => 3, 'max_weight' => 20],
            'fedex_extra_large_box' => ['w' => 15.25, 'h' => 14.13, 'd' => 6, 'max_weight' => 20],
            'fedex_tube' => ['w' => 6, 'h' => 6, 'd' => 38, 'max_weight' => 20],
            'fedex_10kg_box' => ['w' => 15.81, 'h' => 12.94, 'd' => 10.19, 'max_weight' => 22],
            'fedex_25kg_box' => ['w' => 21.56, 'h' => 16.56, 'd' => 13.19, 'max_weight' => 55],
        ];

        // Sort dimensions to handle any orientation
        $parcelDims = [$width, $height, $depth];
        sort($parcelDims);

        // Try to find the best matching FedEx box
        $bestMatch = null;
        $bestScore = PHP_FLOAT_MAX;

        foreach ($fedexBoxes as $boxType => $specs) {
            // Skip if weight exceeds box capacity
            if ($weight > $specs['max_weight']) {
                continue;
            }

            // Sort box dimensions
            $boxDims = [$specs['w'], $specs['h'], $specs['d']];
            sort($boxDims);

            // Check if parcel fits in this box (all dimensions must be <= box dimensions)
            if (
                $parcelDims[0] <= $boxDims[0] &&
                $parcelDims[1] <= $boxDims[1] &&
                $parcelDims[2] <= $boxDims[2]
            ) {

                // Calculate "waste" (difference in volume)
                $parcelVolume = $parcelDims[0] * $parcelDims[1] * $parcelDims[2];
                $boxVolume = $boxDims[0] * $boxDims[1] * $boxDims[2];
                $waste = $boxVolume - $parcelVolume;

                // Prefer boxes with less waste (tighter fit)
                if ($waste < $bestScore) {
                    $bestScore = $waste;
                    $bestMatch = $boxType;
                }
            }
        }

        // For FedEx, prefer 'custom' for most shipments to allow custom dimensions
        // Only use predefined boxes if they're an exact or very close match
        // This is safer for international routes where box availability varies

        // For FedEx Freight services that don't accept 'custom', use fedex_box
        if ($isFedexFreight) {
            return 'fedex_box';
        }

        // For all other FedEx services, use 'custom' to allow flexible dimensions
        // Note: Predefined FedEx boxes (envelope, pak, 10kg, 25kg, etc.) have fixed
        // dimensions and may not be available on all international routes
        return 'custom';
    }

    /**
     * Retrieve shipment request with all related data
     *
     * @param  int  $id
     * @return ShipmentRequest|null
     */
    private function getShipmentRequest($id)
    {
        return ShipmentRequest::with(
            'shipmentRequestHistories',
            'parcels',
            'parcels.items',
            'shipTo',
            'shipFrom',
            'rates',
            'invoiceDatas'
        )->find($id);
    }

    /**
     * Get and validate the chosen rate for the shipment
     *
     * @param  ShipmentRequest  $shipmentRequest
     * @return object|null
     */
    private function getChosenRate($shipmentRequest)
    {
        return $shipmentRequest->rates->firstWhere('chosen', '1');
    }

    /**
     * Prepare parcels array for the API payload
     *
     * @param  ShipmentRequest  $shipmentRequest
     * @param  string  $serviceType
     * @param  string  $shipperAccountSlug
     * @return array
     */
    private function prepareParcels($shipmentRequest, $serviceType, $shipperAccountSlug)
    {
        return $shipmentRequest->parcels->map(function ($parcel) use ($serviceType, $shipperAccountSlug) {
            $boxType = $this->determineFedexBoxType($parcel, $serviceType, $shipperAccountSlug);

            return [
                'box_type' => $boxType,
                'dimension' => [
                    'width' => (float) $parcel->width,
                    'height' => (float) $parcel->height,
                    'depth' => (float) $parcel->depth,
                    'unit' => $parcel->dimension_unit,
                ],
                'weight' => [
                    'unit' => $parcel->weight_unit,
                    'value' => (float) $parcel->weight_value,
                ],
                'description' => $parcel->description,
                'items' => $parcel->items->map(function ($item) {
                    return [
                        'description' => substr($item->description, 0, 35), // $item->description,
                        'quantity' => (float) $item->quantity,
                        'price' => [
                            'currency' => $item->price_currency,
                            'amount' => (float) $item->price_amount,
                        ],
                        'item_id' => $item->item_id,
                        'origin_country' => $item->origin_country,
                        'weight' => [
                            'unit' => $item->weight_unit,
                            'value' => (float) $item->weight_value,
                        ],
                        'sku' => substr($item->sku, 0, 45), // 'sku' => $item->sku,
                        'hs_code' => $item->hs_code,
                        'return_reason' => $item->return_reason,
                    ];
                })->toArray(),
            ];
        })->toArray();
    }

    /**
     * Load and prepare custom invoice from URL or file path
     * If no custom invoice exists, generates one using PdfExportController
     *
     * IMPORTANT: Always generates a custom invoice for AfterShip label creation.
     * If the shipment has an existing custom invoice (use_customize_invoice=true
     * and valid customize_invoice_url), that will be used. Otherwise, a new PDF
     * invoice will be generated based on the shipment data.
     *
     * @param  ShipmentRequest  $shipmentRequest
     * @return string|null Base64 encoded PDF content
     */
    private function loadCustomInvoice($shipmentRequest)
    {
        // First, check if shipment has an existing custom invoice that should be used
        if ($shipmentRequest->use_customize_invoice && ! empty($shipmentRequest->customize_invoice_url)) {
            $customInvoicePath = $shipmentRequest->customize_invoice_url;

            try {
                // Check if it's a URL or a local file path
                $isUrl = filter_var($customInvoicePath, FILTER_VALIDATE_URL) !== false;

                if (! $isUrl) {
                    // Convert relative path to absolute path
                    if (! str_starts_with($customInvoicePath, '/')) {
                        if (! str_starts_with($customInvoicePath, 'public/')) {
                            $absolutePath = public_path($customInvoicePath);
                        } else {
                            $absolutePath = base_path($customInvoicePath);
                        }
                    } else {
                        $absolutePath = $customInvoicePath;
                    }

                    if (file_exists($absolutePath)) {
                        $pdfContent = file_get_contents($absolutePath);

                        if ($pdfContent !== false && substr($pdfContent, 0, 4) === '%PDF') {
                            Log::info('Using existing custom invoice from local file', [
                                'shipment_request_id' => $shipmentRequest->shipmentRequestID,
                                'invoice_path' => $customInvoicePath,
                                'resolved_path' => $absolutePath,
                                'pdf_size' => strlen($pdfContent).' bytes',
                            ]);

                            return base64_encode($pdfContent);
                        }
                    }
                } else {
                    // It's a URL, fetch it
                    $pdfContent = @file_get_contents($customInvoicePath);

                    if ($pdfContent !== false && substr($pdfContent, 0, 4) === '%PDF') {
                        Log::info('Using existing custom invoice from URL', [
                            'shipment_request_id' => $shipmentRequest->shipmentRequestID,
                            'invoice_url' => $customInvoicePath,
                            'pdf_size' => strlen($pdfContent).' bytes',
                        ]);

                        return base64_encode($pdfContent);
                    }
                }

                Log::warning('Existing custom invoice could not be loaded, will generate new one', [
                    'shipment_request_id' => $shipmentRequest->shipmentRequestID,
                    'invoice_path' => $customInvoicePath,
                ]);
            } catch (\Exception $e) {
                Log::warning('Error loading existing custom invoice, will generate new one', [
                    'shipment_request_id' => $shipmentRequest->shipmentRequestID,
                    'invoice_path' => $customInvoicePath,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        // No existing custom invoice or failed to load - generate a new one
        Log::info('Generating custom invoice PDF for AfterShip label creation', [
            'shipment_request_id' => $shipmentRequest->shipmentRequestID,
            'has_existing_invoice' => $shipmentRequest->use_customize_invoice ? 'yes (failed to load)' : 'no',
        ]);

        // Generate PDF using PdfExportController
        $result = $this->pdfExportController->generateAndSaveCommercialInvoice($shipmentRequest->shipmentRequestID);

        if ($result['success'] && ! empty($result['base64'])) {
            // Update shipment request with the generated invoice path
            $shipmentRequest->customize_invoice_url = $result['path'];
            $shipmentRequest->use_customize_invoice = true;
            $shipmentRequest->save();

            Log::info('Custom invoice PDF generated and saved successfully', [
                'shipment_request_id' => $shipmentRequest->shipmentRequestID,
                'generated_path' => $result['path'],
                'pdf_size' => strlen(base64_decode($result['base64'])).' bytes',
            ]);

            return $result['base64'];
        }

        Log::error('Failed to generate custom invoice PDF', [
            'shipment_request_id' => $shipmentRequest->shipmentRequestID,
            'error' => $result['error'] ?? 'Unknown error',
        ]);

        return null;
    }

    /**
     * Build the complete payload for label creation API
     *
     * @param  ShipmentRequest  $shipmentRequest
     * @param  object  $chosenRate
     * @param  array  $parcels
     * @param  string|null  $customInvoiceBase64
     * @return object
     */
    private function buildLabelPayload($shipmentRequest, $chosenRate, $parcels, $customInvoiceBase64)
    {
        $invoiceNumber = $shipmentRequest->invoice_no;
        $invoiceDate = Carbon::now()->toDateString();
        $shipperAccountId = $shipmentRequest->billing === 'shipper'
            ? $chosenRate->shipper_account_id
            : $shipmentRequest->recipient_shipper_account_number;

        $payload = [
            'billing' => [
                'paid_by' => $shipmentRequest->billing,
            ],
            'customs' => [
                'purpose' => strtolower($shipmentRequest->customs_purpose ?? ''),
                'terms_of_trade' => strtolower($shipmentRequest->customs_terms_of_trade ?? ''),
            ],
            'return_shipment' => $shipmentRequest->return_shipment ? true : false,
            'service_type' => $chosenRate->service_type,
            'paper_size' => $shipmentRequest->paper_size ? $shipmentRequest->paper_size : 'default',
            'shipper_account' => [
                'id' => $shipperAccountId,
            ],
            'shipment' => [
                'ship_from' => [
                    'contact_name' => $shipmentRequest->shipFrom->contact_name,
                    'company_name' => $shipmentRequest->shipFrom->company_name,
                    'street1' => $shipmentRequest->shipFrom->street1,
                    'street2' => $shipmentRequest->shipFrom->street2,
                    'street3' => ! empty($shipmentRequest->shipFrom->street3) ? $shipmentRequest->shipFrom->street3 : '--',
                    'city' => $shipmentRequest->shipFrom->city,
                    'state' => substr($shipmentRequest->shipFrom->state, 0, 20), // $shipmentRequest->shipFrom->state,
                    'postal_code' => $shipmentRequest->shipFrom->postal_code,
                    'country' => $shipmentRequest->shipFrom->country,
                    'phone' => $shipmentRequest->shipFrom->phone,
                    'email' => $shipmentRequest->shipFrom->email,
                ],
                'ship_to' => [
                    'contact_name' => $shipmentRequest->shipTo->contact_name ?? null,
                    'company_name' => $shipmentRequest->shipTo->company_name,
                    'street1' => $shipmentRequest->shipTo->street1,
                    'street2' => $shipmentRequest->shipTo->street2,
                    'street3' => ! empty($shipmentRequest->shipTo->street3) ? $shipmentRequest->shipTo->street3 : '--',
                    'city' => $shipmentRequest->shipTo->city,
                    'state' => substr($shipmentRequest->shipTo->state, 0, 20), // $shipmentRequest->shipTo->state,
                    'postal_code' => $shipmentRequest->shipTo->postal_code,
                    'country' => $shipmentRequest->shipTo->country,
                    'phone' => $shipmentRequest->shipTo->phone,
                    'email' => $shipmentRequest->shipTo->email,
                ],
                'parcels' => $parcels,
            ],
            'file_type' => 'pdf',
            'ship_date' => $shipmentRequest->pick_up_date,
            'print_options' => [
                'qr_code' => [
                    'enabled' => false,
                ],
            ],
        ];

        // Add invoice or custom invoice file based on availability
        // Determine carrier type
        $shipperAccountSlug = strtolower($chosenRate->shipper_account_slug ?? '');
        $isDHL = stripos($shipperAccountSlug, 'dhl') !== false;
        $isFedEx = stripos($shipperAccountSlug, 'fedex') !== false;
        $isUPS = stripos($shipperAccountSlug, 'ups') !== false;

        // Check if carrier supports custom invoice (DHL Express, FedEx, UPS)
        $supportsCustomInvoice = $isDHL || $isFedEx || $isUPS;

        if (! empty($customInvoiceBase64) && $supportsCustomInvoice) {
            // Use custom invoice file for supported carriers
            $payload['files'] = [
                'commercial_invoice' => [
                    'content' => $customInvoiceBase64,
                ],
            ];
            $payload['invoice'] = [
                'number' => $invoiceNumber,
                'date' => $invoiceDate,
            ];

            Log::info('Using custom invoice for shipment', [
                'shipment_request_id' => $shipmentRequest->shipmentRequestID,
                'carrier' => $chosenRate->shipper_account_slug,
                'invoice_number' => $invoiceNumber,
                'service_type' => $chosenRate->service_type,
            ]);
        } else {
            // Use standard invoice
            $payload['invoice'] = [
                'number' => $invoiceNumber,
                'date' => $invoiceDate,
            ];

            if (! empty($customInvoiceBase64) && ! $supportsCustomInvoice) {
                Log::warning('Custom invoice provided but carrier does not support custom invoices via AfterShip API', [
                    'shipment_request_id' => $shipmentRequest->shipmentRequestID,
                    'carrier' => $chosenRate->shipper_account_slug,
                    'invoice_url' => $shipmentRequest->customize_invoice_url,
                ]);
            }
        }

        $var_scope_type = $shipmentRequest ? strtolower($shipmentRequest->shipment_scope_type) : null;

        // Remove customs for domestic shipments
        if (str_starts_with($var_scope_type, 'domestic')) {
            unset($payload['customs']);
        }

        // Add service_options for DHL Express Worldwide (includes pickup in payload)
        if (strtolower($chosenRate->service_type ?? '') === 'dhl_express_worldwide') {
            $payload['service_options'] = [
                [
                    'type' => 'pickup',
                    'start_time' => '09:00:00',
                    'end_time' => '17:00:00',
                    'pickup_instructions' => 'Please pickup at front gate.',
                ],
            ];

            Log::info('Added service_options for DHL Express Worldwide', [
                'shipment_request_id' => $shipmentRequest->shipmentRequestID,
                'service_type' => $chosenRate->service_type,
            ]);
        }

        return json_decode(json_encode($payload));
    }

    /**
     * Send label creation request to the API
     *
     * @param  object  $payload
     * @return array ['statusCode' => int, 'body' => array, 'rawBody' => string]
     */
    private function sendLabelRequest($payload)
    {
        $client = new Client;
        $api_key = 'asat_4042bd0e19e64f6e896709a712be7dcd';
        $create_label_production_url = 'https://api.aftership.com/postmen/v3/labels';

        $response = $client->request('POST', $create_label_production_url, [
            'verify' => false,
            'headers' => [
                'Host' => 'api.aftership.com',
                'as-api-key' => $api_key,
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
            ],
            'json' => $payload,
            'http_errors' => false,
        ]);

        $statusCode = $response->getStatusCode();
        $bodyContents = $response->getBody()->getContents();
        $responseBody = json_decode($bodyContents, true);

        return [
            'statusCode' => $statusCode,
            'body' => $responseBody,
            'rawBody' => $bodyContents,
        ];
    }

    /**
     * Poll label status until it's ready or timeout
     * Returns the latest response body and status code from GET /labels/{id}
     *
     * @return array ['statusCode' => int, 'body' => array, 'rawBody' => string]
     */
    private function pollLabelUntilReady(string $labelId, int $timeoutSeconds = 60, int $intervalSeconds = 3)
    {
        $client = new Client;
        $api_key = 'asat_4042bd0e19e64f6e896709a712be7dcd';
        $url = "https://api.aftership.com/postmen/v3/labels/{$labelId}";

        $start = time();
        $lastResponse = null;

        while ((time() - $start) < $timeoutSeconds) {
            try {
                $resp = $client->request('GET', $url, [
                    'verify' => false,
                    'headers' => [
                        'Host' => 'api.aftership.com',
                        'as-api-key' => $api_key,
                        'Content-Type' => 'application/json',
                        'Accept' => 'application/json',
                    ],
                    'http_errors' => false,
                ]);

                $statusCode = $resp->getStatusCode();
                $raw = $resp->getBody()->getContents();
                $body = json_decode($raw, true);

                $lastResponse = ['statusCode' => $statusCode, 'body' => $body, 'rawBody' => $raw];

                // If successful and has full files/tracking, return immediately
                if ($this->isLabelCreationSuccessful($body)) {
                    return $lastResponse;
                }

                // If status indicates still processing (202) or meta says accepted, wait and retry
                if ($statusCode === 202 || strpos(strtolower($body['meta']['message'] ?? ''), 'accepted for processing') !== false) {
                    sleep($intervalSeconds);

                    continue;
                }

                // If received an error (4xx/5xx) and not processing, break and return
                if ($statusCode >= 400) {
                    return $lastResponse;
                }

                // Otherwise wait and retry
                sleep($intervalSeconds);
            } catch (\Exception $e) {
                // Log and retry until timeout
                Log::warning('Polling label status failed, will retry', ['label_id' => $labelId, 'error' => $e->getMessage()]);
                sleep($intervalSeconds);

                continue;
            }
        }

        // Timeout reached, return last response (could be null)
        return $lastResponse ?? ['statusCode' => 504, 'body' => [], 'rawBody' => ''];
    }

    /**
     * Save label response data to shipment request
     *
     * @param  ShipmentRequest  $shipmentRequest
     * @param  array  $responseBody
     * @return void
     */
    private function saveLabelResponseData($shipmentRequest, $responseBody)
    {
        if (! empty($responseBody['data']['id'])) {
            $shipmentRequest->label_id = $responseBody['data']['id'];
        }

        if (! empty($responseBody['data']['files']['label']['url'])) {
            $shipmentRequest->files_label_url = $responseBody['data']['files']['label']['url'];
        }

        if (! empty($responseBody['data']['files']['invoice']['url'])) {
            $shipmentRequest->files_invoice_url = $responseBody['data']['files']['invoice']['url'];
        }

        if (! empty($responseBody['data']['files']['packing_slip']['url'])) {
            $shipmentRequest->files_packing_slip = $responseBody['data']['files']['packing_slip']['url'];
        }

        if (! empty($responseBody['data']['tracking_numbers'])) {
            $trackingNumbers = $responseBody['data']['tracking_numbers'];
            if (is_array($trackingNumbers)) {
                $shipmentRequest->tracking_numbers = count($trackingNumbers) > 1
                    ? implode(',', $trackingNumbers)
                    : $trackingNumbers[0];
            } else {
                $shipmentRequest->tracking_numbers = $trackingNumbers;
            }
        }
    }

    /**
     * Check if label creation was successful
     *
     * @param  array  $responseBody
     * @return bool
     */
    private function isLabelCreationSuccessful($responseBody)
    {
        return (! empty($responseBody['data']['id'])) &&
            (! empty($responseBody['data']['files']['label']['url'])) &&
            (! empty($responseBody['data']['files']['invoice']['url'])) &&
            (! empty($responseBody['data']['files']['packing_slip']['url'])) &&
            (! empty($responseBody['data']['tracking_numbers']));
    }

    /**
     * Extract error messages from API response
     *
     * @param  array  $responseBody
     * @return string
     */
    private function extractErrorMessages($responseBody)
    {
        $error_messages = [];

        if (! empty($responseBody['meta']['message'])) {
            $error_messages[] = $responseBody['meta']['message'];
        }

        if (! empty($responseBody['meta']['details'])) {
            $details = $responseBody['meta']['details'];
            foreach ($details as $detail) {
                if (! empty($detail['info'])) {
                    $error_messages[] = $detail['info'];
                }
            }
        }

        if (! empty($responseBody['message'])) {
            $error_messages[] = $responseBody['message'];
        }

        if (empty($error_messages)) {
            $error_messages[] = 'Label Creation Failed(Contact to Aftership).';
        }

        return implode(' | ', $error_messages);
    }

    /**
     * Check if pickup should be skipped for FedEx future dates
     *
     * @param  string  $shipperAccountSlug
     * @param  string  $pickupDate
     * @return bool
     */
    private function shouldSkipPickup($shipperAccountSlug, $pickupDate)
    {
        $isFedex = strtolower($shipperAccountSlug ?? '') === 'fedex';
        $pickupDateCarbon = Carbon::parse($pickupDate);
        $today = Carbon::today();
        $tomorrow = Carbon::tomorrow();

        return $isFedex && ! $pickupDateCarbon->isSameDay($today) && ! $pickupDateCarbon->isSameDay($tomorrow);
    }

    /**
     * Check if shipment should use FedEx Direct API instead of AfterShip
     *
     * @param  ShipmentRequest  $shipmentRequest
     * @param  object  $chosenRate
     */
    private function shouldUseFedExDirectAPI($shipmentRequest, $chosenRate): bool
    {
        // Check if carrier is FedEx
        $shipperAccountSlug = strtolower($chosenRate->shipper_account_slug ?? '');
        $isFedex = stripos($shipperAccountSlug, 'fedex') !== false;

        if (! $isFedex) {
            return false;
        }

        // Check if it's a domestic shipment (both addresses in same country)
        $shipFromCountry = strtoupper($shipmentRequest->shipFrom->country ?? '');
        $shipToCountry = strtoupper($shipmentRequest->shipTo->country ?? '');
        $isDomestic = ! empty($shipFromCountry) && ! empty($shipToCountry) && $shipFromCountry === $shipToCountry;

        // Log the decision
        Log::info('Checking if should use FedEx Direct API', [
            'shipment_request_id' => $shipmentRequest->shipmentRequestID,
            'carrier' => $chosenRate->shipper_account_slug,
            'is_fedex' => $isFedex,
            'ship_from_country' => $shipFromCountry,
            'ship_to_country' => $shipToCountry,
            'is_domestic' => $isDomestic,
            'use_fedex_direct_api' => $isFedex && $isDomestic,
        ]);

        return $isFedex && $isDomestic;
    }

    /**
     * Standalone validation function that takes shipment request ID
     * Can be called independently to validate shipment before creating label
     *
     * @param  int  $id  Shipment Request ID
     * @return \Illuminate\Http\JsonResponse
     */
    public function validateShipmentPayload($id)
    {
        // Load shipment request with all relations
        $shipmentRequest = $this->getShipmentRequest($id);

        if (empty($shipmentRequest)) {
            return response()->json([
                'valid' => false,
                'message' => 'Shipment Request not found',
                'shipment_request_id' => $id,
                'errors' => ['Shipment Request not found'],
            ], 404);
        }

        // Get chosen rate
        $chosenRate = $this->getChosenRate($shipmentRequest);

        if (! $chosenRate) {
            return response()->json([
                'valid' => false,
                'message' => 'No chosen rate found',
                'shipment_request_id' => $shipmentRequest->shipmentRequestID,
                'errors' => ['No chosen rate found: validation requires a chosen rate'],
            ], 400);
        }

        // Check if should use FedEx Direct API validation
        $willUseFedexDirectApi = $this->shouldUseFedExDirectAPI($shipmentRequest, $chosenRate);

        if ($willUseFedexDirectApi) {
            // Delegate to FedEx-specific validation
            Log::info('Routing validation to FedEx-specific endpoint', [
                'shipment_request_id' => $shipmentRequest->shipmentRequestID,
                'carrier' => $chosenRate->shipper_account_slug,
            ]);

            return $this->fedexController->validateShipmentPayloadFedEx($id);
        }

        // Perform general validation for non-FedEx or international FedEx
        $validation = $this->validateShipmentPayloadInternal($shipmentRequest, $chosenRate);

        if ($validation['valid']) {
            // For AfterShip API - build AfterShip payload
            $parcels = $this->prepareParcels($shipmentRequest, $chosenRate->service_type, $chosenRate->shipper_account_slug);
            $customInvoiceBase64 = $this->loadCustomInvoice($shipmentRequest);
            $payload = $this->buildLabelPayload($shipmentRequest, $chosenRate, $parcels, $customInvoiceBase64);

            return response()->json([
                'valid' => true,
                'message' => 'Shipment payload validation passed',
                'shipment_request_id' => $shipmentRequest->shipmentRequestID,
                'carrier' => $chosenRate->shipper_account_slug ?? null,
                'service_type' => $chosenRate->service_type ?? null,
                'api_type' => 'AfterShip API',
                'payload' => $payload,
            ], 200);
        } else {
            return response()->json([
                'valid' => false,
                'message' => 'Shipment payload validation failed',
                'shipment_request_id' => $shipmentRequest->shipmentRequestID,
                'errors' => $validation['errors'],
                'error_count' => count($validation['errors']),
            ], 400);
        }
    }

    /**
     * Internal validation method used by both standalone and createLabel functions
     *
     * @param  ShipmentRequest  $shipmentRequest
     * @param  object  $chosenRate
     * @return array ['valid' => bool, 'errors' => array]
     */
    private function validateShipmentPayloadInternal($shipmentRequest, $chosenRate): array
    {
        $errors = [];

        // Validate shipment request
        if (! $shipmentRequest) {
            $errors[] = 'Shipment request is null or empty';

            return ['valid' => false, 'errors' => $errors];
        }

        // Validate chosen rate
        if (! $chosenRate) {
            $errors[] = 'No chosen rate found';

            return ['valid' => false, 'errors' => $errors];
        }

        // Validate ship_from address
        if (! $shipmentRequest->shipFrom) {
            $errors[] = 'Ship from address is missing';
        } else {
            if (empty($shipmentRequest->shipFrom->company_name)) {
                $errors[] = 'Ship from company name is required';
            }
            if (empty($shipmentRequest->shipFrom->street1)) {
                $errors[] = 'Ship from street1 is required';
            }
            if (empty($shipmentRequest->shipFrom->city)) {
                $errors[] = 'Ship from city is required';
            }
            if (empty($shipmentRequest->shipFrom->postal_code)) {
                $errors[] = 'Ship from postal code is required';
            }
            if (empty($shipmentRequest->shipFrom->country)) {
                $errors[] = 'Ship from country is required';
            }
            if (empty($shipmentRequest->shipFrom->phone)) {
                $errors[] = 'Ship from phone is required';
            }
            if (empty($shipmentRequest->shipFrom->email)) {
                $errors[] = 'Ship from email is required';
            }
        }

        // Validate ship_to address
        if (! $shipmentRequest->shipTo) {
            $errors[] = 'Ship to address is missing';
        } else {
            if (empty($shipmentRequest->shipTo->company_name)) {
                $errors[] = 'Ship to company name is required';
            }
            if (empty($shipmentRequest->shipTo->street1)) {
                $errors[] = 'Ship to street1 is required';
            }
            if (empty($shipmentRequest->shipTo->city)) {
                $errors[] = 'Ship to city is required';
            }
            if (empty($shipmentRequest->shipTo->postal_code)) {
                $errors[] = 'Ship to postal code is required';
            }
            if (empty($shipmentRequest->shipTo->country)) {
                $errors[] = 'Ship to country is required';
            }
            if (empty($shipmentRequest->shipTo->phone)) {
                $errors[] = 'Ship to phone is required';
            }
            if (empty($shipmentRequest->shipTo->email)) {
                $errors[] = 'Ship to email is required';
            }
        }

        // Validate parcels
        if (! $shipmentRequest->parcels || $shipmentRequest->parcels->isEmpty()) {
            $errors[] = 'At least one parcel is required';
        } else {
            /** @var \App\Models\Logistic\Parcel $parcel */
            foreach ($shipmentRequest->parcels as $index => $parcel) {
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

                // Validate parcel items
                if (! $parcel->items || $parcel->items->isEmpty()) {
                    $errors[] = "Parcel #{$parcelNum}: At least one item is required";
                } else {
                    /** @var \App\Models\Logistic\ParcelItem $item */
                    foreach ($parcel->items as $itemIndex => $item) {
                        $itemNum = $itemIndex + 1;

                        if (empty($item->description)) {
                            $errors[] = "Parcel #{$parcelNum}, Item #{$itemNum}: Description is required";
                        }
                        if (empty($item->quantity) || $item->quantity <= 0) {
                            $errors[] = "Parcel #{$parcelNum}, Item #{$itemNum}: Quantity must be greater than 0";
                        }
                        if (! isset($item->price_amount) || $item->price_amount < 0) {
                            $errors[] = "Parcel #{$parcelNum}, Item #{$itemNum}: Price amount is required";
                        }
                        if (empty($item->price_currency)) {
                            $errors[] = "Parcel #{$parcelNum}, Item #{$itemNum}: Price currency is required";
                        }
                    }
                }
            }
        }

        // Validate rate information
        if (empty($chosenRate->service_type)) {
            $errors[] = 'Service type is required';
        }
        if (empty($chosenRate->shipper_account_id)) {
            $errors[] = 'Shipper account ID is required';
        }
        if (empty($chosenRate->shipper_account_slug)) {
            $errors[] = 'Shipper account slug is required';
        }

        // Validate billing - default to "shipper" if blank
        if (empty($shipmentRequest->billing)) {
            $shipmentRequest->billing = 'shipper';
            $shipmentRequest->save();

            Log::info('Billing was blank, automatically set to default "shipper"', [
                'shipment_request_id' => $shipmentRequest->shipmentRequestID,
            ]);
        }

        // Validate pickup date
        if (empty($shipmentRequest->pick_up_date)) {
            $errors[] = 'Pickup date is required';
        }

        // Validate customs for international shipments
        if (str_starts_with(strtolower($shipmentRequest->shipment_scope_type ?? ''), 'international')) {
            if (empty($shipmentRequest->customs_purpose)) {
                $errors[] = 'Customs purpose is required for international shipments';
            }
            if (empty($shipmentRequest->customs_terms_of_trade)) {
                $errors[] = 'Customs terms of trade is required for international shipments';
            }
        }

        // Log validation results
        if (! empty($errors)) {
            Log::warning('Shipment payload validation failed', [
                'shipment_request_id' => $shipmentRequest->shipmentRequestID,
                'errors' => $errors,
            ]);
        } else {
            Log::info('Shipment payload validation passed', [
                'shipment_request_id' => $shipmentRequest->shipmentRequestID,
            ]);
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors,
        ];
    }

    /**
     * Main method to create a shipping label
     * Orchestrates the entire label creation process
     *
     * @param  int  $id  Shipment request ID
     * @return \Illuminate\Http\JsonResponse
     */
    public function createLabel($id)
    {
        // Step 1: Retrieve shipment request
        $shipmentRequest = $this->getShipmentRequest($id);
        if (empty($shipmentRequest)) {
            return response()->json(['message' => 'Shipment Request not found'], 404);
        }

        // Short-circuit: if shipping_options is not 'calculate_rates', delegate to separate controller
        if (strtolower($shipmentRequest->shipping_options ?? '') !== 'calculate_rates') {
            $shortcutController = $this->createLabel_Not_Calculate_Rates_Controller;

            return $shortcutController->handle($shipmentRequest);
        }

        // Step 2: Validate chosen rate
        $chosenRate = $this->getChosenRate($shipmentRequest);
        if (! $chosenRate) {
            $shipmentRequest->error_msg = 'No chosen rate found: create label';
            $shipmentRequest->save();

            return response()->json(['message' => 'No chosen rate found: create label'], 400);
        }

        // Step 2.1: Validate shipment payload before creating label
        $validation = $this->validateShipmentPayloadInternal($shipmentRequest, $chosenRate);
        if (! $validation['valid']) {
            $errorMessage = 'Payload validation failed: '.implode(' | ', $validation['errors']);
            $shipmentRequest->error_msg = $errorMessage;
            $shipmentRequest->label_status = 'failed';
            $shipmentRequest->save();

            return response()->json([
                'message' => 'Shipment payload validation failed',
                'validation_errors' => $validation['errors'],
                'shipment_request_id' => $shipmentRequest->shipmentRequestID,
            ], 400);
        }

        // Step 2.5: Check if should use FedEx Direct API for domestic shipments
        if ($this->shouldUseFedExDirectAPI($shipmentRequest, $chosenRate)) {
            Log::info('Routing to FedEx Direct API for domestic shipment', [
                'shipment_request_id' => $shipmentRequest->shipmentRequestID,
                'carrier' => $chosenRate->shipper_account_slug,
            ]);

            return $this->fedexShipmentController->createLabelViaFedex($id);
        }

        // Step 3: Prepare data for API request
        $parcels = $this->prepareParcels($shipmentRequest, $chosenRate->service_type, $chosenRate->shipper_account_slug);
        $customInvoiceBase64 = $this->loadCustomInvoice($shipmentRequest);
        $payload = $this->buildLabelPayload($shipmentRequest, $chosenRate, $parcels, $customInvoiceBase64);

        if (empty($payload)) {
            return response()->json(['error' => 'payload is required'], 400);
        }

        // Step 4: Send label creation request
        try {
            $response = $this->sendLabelRequest($payload);
            $statusCode = $response['statusCode'];
            $responseBody = $response['body'];
            $rawBody = $response['rawBody'];

            // Step 5: Process response and save data
            $this->saveLabelResponseData($shipmentRequest, $responseBody);

            // If API accepted request for async processing, wait/poll until complete
            $metaMessage = strtolower($responseBody['meta']['message'] ?? '');
            $isAcceptedAsync = ($statusCode === 202) || (strpos($metaMessage, 'accepted for processing') !== false) || (strpos($metaMessage, 'processing') !== false);

            if ($isAcceptedAsync && ! empty($responseBody['data']['id'])) {
                // mark as processing and do not mark failed yet
                $shipmentRequest->label_status = 'processing';
                $shipmentRequest->error_msg = '-';
                $shipmentRequest->save();

                // Poll until ready (timeout configurable)
                $labelId = $responseBody['data']['id'];
                $pollResult = $this->pollLabelUntilReady($labelId, 120, 5); // wait up to 2 minutes, poll every 5s

                // If poll returned a body, use that for final decision
                $polledBody = $pollResult['body'] ?? [];
                $polledStatus = $pollResult['statusCode'] ?? $statusCode;

                // Save any updated fields from polled result
                if (! empty($polledBody)) {
                    $this->saveLabelResponseData($shipmentRequest, $polledBody);
                }

                // If now successful
                if ($this->isLabelCreationSuccessful($polledBody)) {
                    return $this->handleSuccessfulLabelCreation(
                        $shipmentRequest,
                        $chosenRate,
                        $polledBody,
                        $payload,
                        $pollResult['rawBody'] ?? null,
                        $customInvoiceBase64,
                        $polledStatus
                    );
                }

                // If polling timed out or final state is still not successful, handle failure but with clearer message
                $shipmentRequest->label_status = 'failed';
                $shipmentRequest->error_msg = $this->extractErrorMessages($polledBody) ?: ($polledBody['meta']['message'] ?? 'Label processing did not complete in time');
                $shipmentRequest->save();

                return response()->json([
                    'message' => 'Label creation did not complete within the wait period',
                    'polled_response' => $polledBody,
                    'payload' => $payload,
                ], $polledStatus >= 400 ? $polledStatus : 202);
            }

            // Step 6: Check if label creation was successful (synchronous)
            if ($this->isLabelCreationSuccessful($responseBody)) {
                return $this->handleSuccessfulLabelCreation(
                    $shipmentRequest,
                    $chosenRate,
                    $responseBody,
                    $payload,
                    $rawBody,
                    $customInvoiceBase64,
                    $statusCode
                );
            }

            // Otherwise handle failure
            return $this->handleFailedLabelCreation(
                $shipmentRequest,
                $responseBody,
                $payload,
                $statusCode
            );
        } catch (\Exception $e) {
            return response()->json([
                'meta' => [
                    'code' => 5000,
                    'message' => 'Exception occurred: '.$e->getMessage(),
                    'details' => [],
                    'payload' => $payload ?? null,
                    'retryable' => false,
                ],
                'data' => null,
            ], 500);
        }
    }

    /**
     * Handle successful label creation and pickup scheduling
     *
     * @param  ShipmentRequest  $shipmentRequest
     * @param  object  $chosenRate
     * @param  array  $responseBody
     * @param  object  $payload
     * @param  string  $rawBody
     * @param  string|null  $customInvoiceBase64
     * @param  int  $statusCode
     * @return \Illuminate\Http\JsonResponse
     */
    private function handleSuccessfulLabelCreation($shipmentRequest, $chosenRate, $responseBody, $payload, $rawBody, $customInvoiceBase64, $statusCode)
    {
        // Update shipment request with success status
        $shipmentRequest->label_status = 'created';
        $shipmentRequest->error_msg = '-';
        $shipmentRequest->save();

        // Notify warehouse that label was created (best-effort, do not block the main flow)
        try {
            if ($this->emailTemplateController) {

                // Capture return (do NOT ignore)
                $result = $this->emailTemplateController->warehouseNotification(
                    $shipmentRequest->shipmentRequestID
                );

                // Log the return value (informational only)
                Log::info('Warehouse notification processed (non-blocking)', [
                    'shipment_request_id' => $shipmentRequest->shipmentRequestID,
                    'result' => $result,   // <-- the returned value
                ]);
            }
        } catch (\Exception $e) {
            Log::warning('Failed to send warehouse notification after label creation', [
                'shipment_request_id' => $shipmentRequest->shipmentRequestID,
                'error' => $e->getMessage(),
            ]);
        }

        // Check if custom invoice was used
        $customInvoiceUsed = ! empty($customInvoiceBase64);

        // Check if service type is DHL Express Worldwide (pickup included in payload)
        $isDHLExpressWorldwide = strtolower($chosenRate->service_type ?? '') === 'dhl_express_worldwide';
        if ($isDHLExpressWorldwide) {
            $message = 'Label created successfully. Pickup details included in DHL Express Worldwide service options.';
            if ($customInvoiceUsed) {
                $message .= ' Custom invoice was used.';
            }

            return response()->json([
                'message' => $message,
                '$create_label_response_body' => $responseBody,
                'meta create_label' => $responseBody['meta'] ?? null,
                'data create_label' => $responseBody['data'] ?? null,
                'payload create_label' => $payload,
                'debug_raw create_label' => $rawBody,
                'pickup_info' => 'Pickup details included in service_options (09:00 - 17:00)',
                'custom_invoice_used' => $customInvoiceUsed,
            ], $statusCode);
        }

        // Check if we should skip pickup for FedEx future dates
        if ($this->shouldSkipPickup($chosenRate->shipper_account_slug, $shipmentRequest->pick_up_date)) {
            $message = 'Label created successfully. FedEx pickup will be automatically scheduled by the system.';
            if ($customInvoiceUsed) {
                $message .= ' Custom invoice was used.';
            }

            $pickupDate = Carbon::parse($shipmentRequest->pick_up_date);

            return response()->json([
                'message' => $message,
                '$create_label_response_body' => $responseBody,
                'meta create_label' => $responseBody['meta'] ?? null,
                'data create_label' => $responseBody['data'] ?? null,
                'payload create_label' => $payload,
                'debug_raw create_label' => $rawBody,
                'pickup_info' => 'FedEx pickup for '.$pickupDate->toDateString().' will be scheduled automatically at 10:00 AM on '.$pickupDate->copy()->subDay()->toDateString(),
                'custom_invoice_used' => $customInvoiceUsed,
            ], $statusCode);
        }

        // Create pickup immediately for non-FedEx or for FedEx with today/tomorrow pickup dates
        $create_pick_up = $this->createPickupController->createPickup($shipmentRequest->shipmentRequestID);
        if (! $create_pick_up) {
            $message = 'Label created but pickup creation failed.';
            if ($customInvoiceUsed) {
                $message .= ' Custom invoice was used.';
            }

            return response()->json([
                'message' => $message,
                '$create_label_response_body' => $responseBody,
                'meta' => $responseBody['meta'] ?? null,
                'data' => $responseBody['data'] ?? null,
                'payload' => $payload,
                'debug_raw' => $rawBody,
                'custom_invoice_used' => $customInvoiceUsed,
            ], $statusCode);
        }

        // Update packing slip if available
        if (! empty($responseBody['data']['rate']['packing_slip']['url'])) {
            $shipmentRequest->files_packing_slip = $responseBody['data']['files']['packing_slip']['url'];
        }

        $create_pick_up_response = json_decode($create_pick_up->getContent(), true);
        $message = 'Label created successfully and pickup created successfully.';
        if ($customInvoiceUsed) {
            $message .= ' Custom invoice was used.';
        }

        return response()->json([
            'message' => $message,
            '$create_label_response_body' => $responseBody,
            'meta create_label' => $responseBody['meta'] ?? null,
            'data create_label' => $responseBody['data'] ?? null,
            'payload create_label' => $payload,
            'debug_raw create_label' => $rawBody,
            'response create_pickup' => $create_pick_up_response,
            'custom_invoice_used' => $customInvoiceUsed,
        ], $statusCode);
    }

    /**
     * Handle failed label creation
     *
     * @param  ShipmentRequest  $shipmentRequest
     * @param  array  $responseBody
     * @param  object  $payload
     * @param  int  $statusCode
     * @return \Illuminate\Http\JsonResponse
     */
    private function handleFailedLabelCreation($shipmentRequest, $responseBody, $payload, $statusCode)
    {
        $shipmentRequest->label_status = 'failed';
        $shipmentRequest->error_msg = $this->extractErrorMessages($responseBody);
        $shipmentRequest->save();

        return response()->json([
            'message' => 'Label created failed.',
            '$create_label_response_body' => $responseBody,
            'payload' => $payload,
        ], $statusCode);
    }
}
