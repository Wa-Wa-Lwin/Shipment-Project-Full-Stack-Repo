<?php

namespace App\Http\Controllers\SAPEnterpryze;

use App\Services\CountryCodeService;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class SAPController
{
    private string $sapUrl;

    private string $sapCompanyDB;

    private int $sessionTimeout;

    private string $nextLink = '';

    private string $cacheKeyPrefix = 'sap_session_';

    public function __construct()
    {
        $this->sapUrl = config('services.sap.url', 'https://192.168.68.16:50000/b1s/v1');
        $this->sapCompanyDB = config('services.sap.company_db', '');
        $this->sessionTimeout = config('services.sap.session_timeout', 30); // Default 30 minutes
    }

    /**
     * Generate cache key for SAP session
     */
    private function getCacheKey(string $username, string $companyDB): string
    {
        return $this->cacheKeyPrefix.md5($username.'_'.$companyDB);
    }

    /**
     * Get valid SAP session, login if needed
     *
     * @return array Session data with cookies
     *
     * @throws Exception If login fails
     */
    private function getValidSession(): array
    {
        $username = 'manager';
        $password = 'Sap@xen22';
        $companyDB = 'XEN';

        $cacheKey = $this->getCacheKey($username, $companyDB);

        if (Cache::has($cacheKey)) {
            Log::info('Using cached SAP session for API call');

            return Cache::get($cacheKey);
        }

        Log::info('No cached session, logging into SAP');

        $response = Http::withOptions([
            'verify' => false,
        ])->post("{$this->sapUrl}/Login", [
            'CompanyDB' => $companyDB,
            'UserName' => $username,
            'Password' => $password,
        ]);

        if (! $response->successful()) {
            Log::error('SAP login failed during getValidSession', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            throw new Exception('SAP login failed: '.($response->json()['error']['message']['value'] ?? 'Unknown error'));
        }

        $data = $response->json();
        $sessionId = $data['SessionId'] ?? null;

        if (! $sessionId) {
            throw new Exception('SAP login successful but no SessionId returned');
        }

        // Extract cookies as name => value pairs
        $cookies = [];
        foreach ($response->cookies() as $cookie) {
            $cookies[$cookie->getName()] = $cookie->getValue();
        }

        $sessionData = [
            'session_id' => $sessionId,
            'cookies' => $cookies,
            'username' => $username,
            'company_db' => $companyDB,
            'logged_in_at' => now()->toDateTimeString(),
        ];

        // Cache for 28 minutes (SAP default timeout is 30 min)
        Cache::put($cacheKey, $sessionData, now()->addMinutes(28));

        Log::info('SAP session created and cached', ['session_id' => $sessionId]);

        return $sessionData;
    }

    /**
     * Check if response indicates session timeout
     *
     * @param  \Illuminate\Http\Client\Response  $response
     */
    private function isSessionTimeout($response): bool
    {
        if ($response->successful()) {
            return false;
        }

        $json = $response->json();
        $errorMessage = $json['error']['message']['value']
            ?? $json['error']['message']
            ?? '';

        return str_contains($errorMessage, 'Invalid session')
            || str_contains($errorMessage, 'session already timeout');
    }

    /**
     * Clear the cached SAP session
     */
    private function clearSessionCache(): void
    {
        $cacheKey = $this->getCacheKey('manager', 'XEN');
        Cache::forget($cacheKey);
        Log::info('SAP session cache cleared');
    }

    /**
     * Determine shipment scope type based on countries and company names
     *
     * @param  string  $shipFromCountry  Country code of origin (e.g., 'TH', 'US')
     * @param  string  $shipToCountry  Country code of destination
     * @param  string  $shipFromCompanyName  Company name of sender
     * @param  string  $shipToCompanyName  Company name of recipient (if available)
     * @return string One of: domestic_import, domestic_export, international_export, international_import, international_global, or empty string if country data is missing
     */
    private function determineShipmentScopeType(
        string $shipFromCountry,
        string $shipToCountry,
        string $shipFromCompanyName = '',
        string $shipToCompanyName = ''
    ): string {
        // If country data is missing, return empty so user can fill in manually
        if (empty($shipFromCountry) || empty($shipToCountry)) {
            return '';
        }

        $isShipFromThailand = strtoupper($shipFromCountry) === 'TH';
        $isShipToThailand = strtoupper($shipToCountry) === 'TH';

        // Case-insensitive check for "xenoptics" in company names
        $isShipFromXenoptics = stripos($shipFromCompanyName, 'xenoptics') !== false;
        $isShipToXenoptics = stripos($shipToCompanyName, 'xenoptics') !== false;

        // Both domestic (within Thailand)
        if ($isShipFromThailand && $isShipToThailand) {
            // If shipping FROM Xenoptics to somewhere in Thailand
            if ($isShipFromXenoptics) {
                return 'domestic_export';
            }

            // If shipping TO Xenoptics from somewhere in Thailand
            return 'domestic_import';
        }

        // Ship from Thailand to another country
        if ($isShipFromThailand && ! $isShipToThailand) {
            return 'international_export';
        }

        // Ship from another country to Thailand
        if (! $isShipFromThailand && $isShipToThailand) {
            return 'international_import';
        }

        // Both outside Thailand
        return 'international_global';
    }

    public function getTop10po_query(): string
    {
        $results = app('db')->select('SELECT TOP 10 * FROM [192.168.68.14].[XEN].[dbo].[OINV]');

        return response()->json([
            'success' => true,
            'message' => 'SAP login successful',
            'data' => $results,
        ], 200);
    }

    /**
     * Login to SAP Business One Service Layer
     * POST /api/sap/login
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function login(Request $request)
    {
        try {

            $username = 'manager';
            $password = 'Sap@xen22';
            $companyDB = 'XEN';

            $cacheKey = $this->getCacheKey($username, $companyDB);
            if (Cache::has($cacheKey)) {
                $cachedSession = Cache::get($cacheKey);
                Log::info('Using cached SAP session', [
                    'username' => $username,
                    'company_db' => $companyDB,
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Using existing SAP session',
                    'data' => $cachedSession,
                ], 200);
            }

            $response = Http::withOptions([
                'verify' => false,
            ])->post("{$this->sapUrl}/Login", [
                'CompanyDB' => $companyDB,
                'UserName' => $username,
                'Password' => $password,
            ]);

            if ($response->successful()) {
                $data = $response->json();
                $sessionId = $data['SessionId'] ?? null;
                $version = $data['Version'] ?? null;
                $sessionTimeout = $data['SessionTimeout'] ?? $this->sessionTimeout;

                if (! $sessionId) {
                    Log::error('SAP login successful but no SessionId returned', [
                        'response' => $data,
                    ]);

                    return response()->json([
                        'success' => false,
                        'message' => 'SAP login failed: No SessionId returned',
                        'data' => null,
                    ], 500);
                }

                $cookies = $response->cookies();

                $sessionData = [
                    'session_id' => $sessionId,
                    'version' => $version,
                    'session_timeout' => $sessionTimeout,
                    'cookies' => $cookies->toArray(),
                    'username' => $username,
                    'company_db' => $companyDB,
                    'logged_in_at' => now()->toDateTimeString(),
                ];

                $cacheMinutes = max(1, $sessionTimeout - 2);
                Cache::put($cacheKey, $sessionData, now()->addMinutes($cacheMinutes));

                Log::info('SAP B1 Service Layer login successful', [
                    'username' => $username,
                    'session_id' => $sessionId,
                    'cache_duration' => $cacheMinutes.' minutes',
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'SAP login successful',
                    'data' => $sessionData,
                ], 200);
            }

            Log::error('SAP B1 Service Layer login failed', [
                'status' => $response->status(),
                'body' => $response->body(),
                'username' => $username,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'SAP login failed',
                'error' => $response->json()['error']['message']['value'] ?? 'Authentication failed',
                'data' => null,
            ], $response->status());

        } catch (Exception $e) {
            Log::error('SAP login exception', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred during SAP login',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get first 20 Purchase Orders with full shipment data
     */
    public function getpo_alldata(Request $request, int $retryCount = 0)
    {
        try {
            $session = $this->getValidSession();

            $response = Http::withOptions([
                'verify' => false,
            ])->withCookies($session['cookies'], '192.168.68.16')
                ->get("{$this->sapUrl}/PurchaseOrders/\$count");

            $totalCountInSystem = $response->successful() ? (int) $response->body() : 0;

            $response = Http::withOptions([
                'verify' => false,
            ])->withCookies($session['cookies'], '192.168.68.16')
                ->get("{$this->sapUrl}/PurchaseOrders", [
                    '$orderby' => 'DocEntry desc',
                ]);

            if ($this->isSessionTimeout($response) && $retryCount < 1) {
                Log::warning('SAP session timeout detected, retrying after re-login');
                $this->clearSessionCache();

                return $this->getpo_alldata($request, $retryCount + 1);
            }

            if ($response->successful()) {
                $data = $response->json();

                $value = $data['value'] ?? [];
                $this->nextLink = $data['odata.nextLink'] ?? '';
                $reponse_back = [];
                $itemNo = 1;
                foreach ($value as $po) {
                    $parcel_items = [];
                    foreach ($po['DocumentLines'] ?? [] as $line) {
                        $quantity = max(1, $line['Quantity'] ?? 1);
                        $parcel_items[] = [
                            'description' => $line['ItemDescription'] ?? '',
                            'quantity' => $line['Quantity'] ?? 0,
                            'price_amount' => ($po['DocCurrency'] ?? '') === 'USD' ? ($line['RowTotalFC'] ?? 0) / $quantity : ($line['Price'] ?? 0),
                            'price_currency' => $po['DocCurrency'] ?? 'USD',
                            'weight_value' => 0,
                            'weight_unit' => 'kg',
                            'origin_country' => '',
                            'sku' => $line['ItemDescription'] ?? '',
                            'material_code' => $line['ItemCode'] ?? '',
                            'hs_code' => '',
                            'item_id' => $line['ItemCode'] ?? '',
                            'return_reason' => 'N/A',
                        ];
                    }

                    $parcel = [
                        'box_type_name' => 'CARDBOARD BOX',
                        'width' => 0,
                        'height' => 0,
                        'depth' => 0,
                        'dimension_unit' => 'cm',
                        'weight_value' => 0,
                        'net_weight_value' => 0,
                        'parcel_weight_value' => 0,
                        'weight_unit' => 'kg',
                        'description' => 'PO Items',
                        'parcel_items' => $parcel_items,
                    ];

                    $countryCodeService = new CountryCodeService;
                    $shipToCountryISO2 = $po['AddressExtension']['ShipToCountry'] ?? '';
                    $shipFromCountryISO2 = $po['AddressExtension']['BillToCountry'] ?? '';
                    $shipToCountry = $countryCodeService->convertToISO3($shipToCountryISO2) ?? $shipToCountryISO2;
                    $shipFromCountry = $countryCodeService->convertToISO3($shipFromCountryISO2) ?? $shipFromCountryISO2;
                    $shipFromCompanyName = $po['CardName'] ?? '';
                    $shipToCompanyName = '';

                    // Get TaxExtension data
                    $taxExt = $po['TaxExtension'] ?? [];

                    // Determine shipment scope type based on countries and Xenoptics detection
                    // Use ISO2 codes for internal logic
                    $shipmentScopeType = $this->determineShipmentScopeType(
                        $shipFromCountryISO2,
                        $shipToCountryISO2,
                        $shipFromCompanyName,
                        $shipToCompanyName
                    );

                    $reponse_back[] = [
                        'no' => $itemNo++,
                        'shipment_scope_type' => $shipmentScopeType,
                        'service_options' => $po['ShippingMethod'] ?? '',
                        'urgent_reason' => $po['PickRemark'] ?? '',
                        'remark' => $po['Comments'] ?? '',
                        'topic' => '',
                        'other_topic' => '',
                        'po_number' => $po['DocNum'] ?? '',
                        'po_id' => $po['DocEntry'] ?? '',
                        'due_date' => $po['DocDueDate'] ?? '',
                        'sales_person' => $po['OpeningRemarks'] ?? '',
                        'po_date' => $po['DocDate'] ?? '',
                        'doc_total' => $po['DocTotal'] ?? 0,
                        'doc_currency' => $po['DocCurrency'] ?? '',
                        'vat_sum' => $po['VatSum'] ?? 0,
                        'document_status' => $po['DocumentStatus'] ?? '',
                        'tracking_number' => $po['TrackingNumber'] ?? '',
                        'creation_date' => $po['CreationDate'] ?? '',
                        'send_to' => $po['DocumentsOwner'] ?? '',
                        'ship_from_country' => $shipFromCountry,
                        'ship_from_contact_name' => $po['ContactPersonCode'] ?? '',
                        'ship_from_phone' => '',
                        'ship_from_email' => '',
                        'ship_from_company_name' => $po['CardName'] ?? '',
                        'ship_from_card_code' => $po['CardCode'] ?? '',
                        'ship_from_street1' => $po['AddressExtension']['BillToStreetNo'] ?? '',
                        'ship_from_street2' => $po['AddressExtension']['BillToStreet'] ?? '',
                        'ship_from_street3' => $po['AddressExtension']['BillToBlock'] ?? '',
                        'ship_from_city' => $po['AddressExtension']['BillToCity'] ?? '',
                        'ship_from_state' => $shipFromCountryISO2 === 'US' ? ($po['AddressExtension']['BillToState'] ?? '') : ($po['AddressExtension']['BillToCounty'] ?? ''),
                        'ship_from_postal_code' => $po['AddressExtension']['BillToZipCode'] ?? '',
                        'ship_from_tax_id' => $po['FederalTaxID'] ?? '',
                        'ship_from_eori_number' => '',
                        'ship_to_country' => $shipToCountry,
                        'ship_to_contact_name' => '',
                        'ship_to_phone' => '',
                        'ship_to_email' => '',
                        'ship_to_company_name' => '',
                        'ship_to_street1' => $po['AddressExtension']['ShipToStreetNo'] ?? '',
                        'ship_to_street2' => $po['AddressExtension']['ShipToStreet'] ?? '',
                        'ship_to_street3' => $po['AddressExtension']['ShipToBlock'] ?? '',
                        'ship_to_city' => $po['AddressExtension']['ShipToCity'] ?? '',
                        'ship_to_state' => $shipToCountryISO2 === 'US' ? ($po['AddressExtension']['ShipToState'] ?? '') : ($po['AddressExtension']['ShipToCounty'] ?? ''),
                        'ship_to_postal_code' => $po['AddressExtension']['ShipToZipCode'] ?? '',
                        'ship_to_tax_id' => '',
                        'ship_to_eori_number' => '',

                        'customs_purpose' => $taxExt['MainUsage'] ?? '',
                        'customs_terms_of_trade' => $taxExt['Incoterms'] ?? '',
                        'net_weight' => $taxExt['NetWeight'] ?? 0,
                        'gross_weight' => $taxExt['GrossWeight'] ?? 0,
                        'parcels' => [$parcel],
                    ];
                }

                if (! $reponse_back) {
                    return response()->json([
                        'success' => false,
                        'message' => 'SAP Get PO failed: No data returned',
                        'total_count_in_system' => $totalCountInSystem,
                        'total_count_now' => 0,
                        'data' => null,
                    ], 500);
                }

                return response()->json([
                    'success' => true,
                    'message' => 'SAP Get First 20 PO successful',
                    'total_count_in_system' => $totalCountInSystem,
                    'total_count_now' => count($reponse_back),
                    'data' => $reponse_back,
                    'raw_response' => $value,
                ], 200);
            }

            return response()->json([
                'success' => false,
                'message' => 'SAP Get PO failed',
                'error' => $response->json()['error']['message']['value'] ?? 'Get PO failed',
                'total_count_in_system' => $totalCountInSystem ?? 0,
                'total_count_now' => 0,
                'data' => null,
            ], $response->status());

        } catch (Exception $e) {
            Log::error('SAP Get PO exception', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred during Get PO',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get next 20 Purchase Orders with full shipment data (pagination)
     */
    public function getpoNext20_alldata(Request $request, int $retryCount = 0)
    {
        try {
            $session = $this->getValidSession();

            $countResponse = Http::withOptions([
                'verify' => false,
            ])->withCookies($session['cookies'], '192.168.68.16')
                ->get("{$this->sapUrl}/PurchaseOrders/\$count");

            $totalCountInSystem = $countResponse->successful() ? (int) $countResponse->body() : 0;

            $response = Http::withOptions([
                'verify' => false,
            ])->withCookies($session['cookies'], '192.168.68.16')
                ->get("{$this->sapUrl}/{$this->nextLink}");

            if ($this->isSessionTimeout($response) && $retryCount < 1) {
                Log::warning('SAP session timeout detected, retrying after re-login');
                $this->clearSessionCache();

                return $this->getpoNext20_alldata($request, $retryCount + 1);
            }

            if ($response->successful()) {
                $data = $response->json();

                $value = $data['value'] ?? [];
                $this->nextLink = $data['odata.nextLink'] ?? '';
                $reponse_back = [];
                $itemNo = 1;
                foreach ($value as $po) {
                    $parcel_items = [];
                    foreach ($po['DocumentLines'] ?? [] as $line) {
                        $quantity = max(1, $line['Quantity'] ?? 1);
                        $parcel_items[] = [
                            'description' => $line['ItemDescription'] ?? '',
                            'quantity' => $line['Quantity'] ?? 0,
                            'price_amount' => ($po['DocCurrency'] ?? '') === 'USD' ? ($line['RowTotalFC'] ?? 0) / $quantity : ($line['Price'] ?? 0),
                            'price_currency' => $po['DocCurrency'] ?? 'USD',
                            'weight_value' => 0,
                            'weight_unit' => 'kg',
                            'origin_country' => '',
                            'sku' => $line['ItemDescription'] ?? '',
                            'material_code' => $line['ItemCode'] ?? '',
                            'hs_code' => '',
                            'item_id' => $line['ItemCode'] ?? '',
                            'return_reason' => 'N/A',
                        ];
                    }

                    $parcel = [
                        'box_type_name' => 'CARDBOARD BOX',
                        'width' => 0,
                        'height' => 0,
                        'depth' => 0,
                        'dimension_unit' => 'cm',
                        'weight_value' => 0,
                        'net_weight_value' => 0,
                        'parcel_weight_value' => 0,
                        'weight_unit' => 'kg',
                        'description' => 'PO Items',
                        'parcel_items' => $parcel_items,
                    ];

                    $countryCodeService = new CountryCodeService;
                    $shipToCountryISO2 = $po['AddressExtension']['ShipToCountry'] ?? '';
                    $shipFromCountryISO2 = $po['AddressExtension']['BillToCountry'] ?? '';
                    $shipToCountry = $countryCodeService->convertToISO3($shipToCountryISO2) ?? $shipToCountryISO2;
                    $shipFromCountry = $countryCodeService->convertToISO3($shipFromCountryISO2) ?? $shipFromCountryISO2;
                    $shipFromCompanyName = $po['CardName'] ?? '';
                    $shipToCompanyName = '';

                    // Get TaxExtension data
                    $taxExt = $po['TaxExtension'] ?? [];

                    // Determine shipment scope type based on countries and Xenoptics detection
                    // Use ISO2 codes for internal logic
                    $shipmentScopeType = $this->determineShipmentScopeType(
                        $shipFromCountryISO2,
                        $shipToCountryISO2,
                        $shipFromCompanyName,
                        $shipToCompanyName
                    );

                    $reponse_back[] = [
                        'no' => $itemNo++,
                        'shipment_scope_type' => $shipmentScopeType,
                        'service_options' => $po['ShippingMethod'] ?? '',
                        'urgent_reason' => $po['PickRemark'] ?? '',
                        'remark' => $po['Comments'] ?? '',
                        'topic' => '',
                        'other_topic' => '',
                        'po_number' => $po['DocNum'] ?? '',
                        'po_id' => $po['DocEntry'] ?? '',
                        'due_date' => $po['DocDueDate'] ?? '',
                        'sales_person' => $po['OpeningRemarks'] ?? '',
                        'po_date' => $po['DocDate'] ?? '',
                        'doc_total' => $po['DocTotal'] ?? 0,
                        'doc_currency' => $po['DocCurrency'] ?? '',
                        'vat_sum' => $po['VatSum'] ?? 0,
                        'document_status' => $po['DocumentStatus'] ?? '',
                        'tracking_number' => $po['TrackingNumber'] ?? '',
                        'creation_date' => $po['CreationDate'] ?? '',
                        'send_to' => $po['DocumentsOwner'] ?? '',
                        'ship_from_country' => $shipFromCountry,
                        'ship_from_contact_name' => $po['ContactPersonCode'] ?? '',
                        'ship_from_phone' => '',
                        'ship_from_email' => '',
                        'ship_from_company_name' => $po['CardName'] ?? '',
                        'ship_from_card_code' => $po['CardCode'] ?? '',
                        'ship_from_street1' => $po['AddressExtension']['BillToStreetNo'] ?? '',
                        'ship_from_street2' => $po['AddressExtension']['BillToStreet'] ?? '',
                        'ship_from_street3' => $po['AddressExtension']['BillToBlock'] ?? '',
                        'ship_from_city' => $po['AddressExtension']['BillToCity'] ?? '',
                        'ship_from_state' => $shipFromCountryISO2 === 'US' ? ($po['AddressExtension']['BillToState'] ?? '') : ($po['AddressExtension']['BillToCounty'] ?? ''),
                        'ship_from_postal_code' => $po['AddressExtension']['BillToZipCode'] ?? '',
                        'ship_from_tax_id' => $po['FederalTaxID'] ?? '',
                        'ship_from_eori_number' => '',
                        'ship_to_country' => $shipToCountry,
                        'ship_to_contact_name' => '',
                        'ship_to_phone' => '',
                        'ship_to_email' => '',
                        'ship_to_company_name' => '',
                        'ship_to_street1' => $po['AddressExtension']['ShipToStreetNo'] ?? '',
                        'ship_to_street2' => $po['AddressExtension']['ShipToStreet'] ?? '',
                        'ship_to_street3' => $po['AddressExtension']['ShipToBlock'] ?? '',
                        'ship_to_city' => $po['AddressExtension']['ShipToCity'] ?? '',
                        'ship_to_state' => $shipToCountryISO2 === 'US' ? ($po['AddressExtension']['ShipToState'] ?? '') : ($po['AddressExtension']['ShipToCounty'] ?? ''),
                        'ship_to_postal_code' => $po['AddressExtension']['ShipToZipCode'] ?? '',
                        'ship_to_tax_id' => '',
                        'ship_to_eori_number' => '',

                        'customs_purpose' => $taxExt['MainUsage'] ?? '',
                        'customs_terms_of_trade' => $taxExt['Incoterms'] ?? '',
                        'net_weight' => $taxExt['NetWeight'] ?? 0,
                        'gross_weight' => $taxExt['GrossWeight'] ?? 0,
                        'parcels' => [$parcel],
                    ];
                }

                if (! $reponse_back) {
                    return response()->json([
                        'success' => false,
                        'message' => 'SAP Get PO failed: No data returned',
                        'total_count_in_system' => $totalCountInSystem,
                        'total_count_now' => 0,
                        'data' => null,
                    ], 500);
                }

                return response()->json([
                    'success' => true,
                    'message' => 'SAP Get 20 Next PO successful',
                    'total_count_in_system' => $totalCountInSystem,
                    'total_count_now' => count($reponse_back),
                    'data' => $reponse_back,
                    'raw_response' => $value,
                ], 200);
            }

            Log::error('SAP GET 20 Next PO failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'SAP Get PO failed',
                'error' => $response->json()['error']['message']['value'] ?? 'Get PO failed',
                'total_count_in_system' => $totalCountInSystem,
                'total_count_now' => 0,
                'data' => null,
            ], $response->status());

        } catch (Exception $e) {
            Log::error('SAP Get PO exception', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred during Get PO',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get first 20 PO numbers only (lightweight)
     */
    public function getpo_numbers(Request $request, int $retryCount = 0)
    {
        try {
            $session = $this->getValidSession();

            $countResponse = Http::withOptions([
                'verify' => false,
            ])->withCookies($session['cookies'], '192.168.68.16')
                ->get("{$this->sapUrl}/PurchaseOrders/\$count");

            $totalCountInSystem = $countResponse->successful() ? (int) $countResponse->body() : 0;

            $response = Http::withOptions([
                'verify' => false,
            ])->withCookies($session['cookies'], '192.168.68.16')
                ->get("{$this->sapUrl}/PurchaseOrders", [
                    '$select' => 'DocEntry,DocNum,DocDate,CardName',
                    '$orderby' => 'DocEntry desc',
                ]);

            if ($this->isSessionTimeout($response) && $retryCount < 1) {
                Log::warning('SAP session timeout detected, retrying after re-login');
                $this->clearSessionCache();

                return $this->getpo_numbers($request, $retryCount + 1);
            }

            if ($response->successful()) {
                $data = $response->json();

                $value = $data['value'] ?? [];
                $this->nextLink = $data['odata.nextLink'];
                $reponse_back = [];
                $itemNo = 1;
                foreach ($value as $po) {
                    $reponse_back[] = [
                        'no' => $itemNo++,
                        'po_id' => $po['DocEntry'] ?? '',
                        'po_number' => $po['DocNum'] ?? '',
                        'po_date' => $po['DocDate'] ?? '',
                        'supplier_name' => $po['CardName'] ?? '',
                    ];
                }

                if (! $reponse_back) {
                    return response()->json([
                        'success' => false,
                        'message' => 'SAP Get PO failed: No data returned',
                        'total_count_in_system' => $totalCountInSystem,
                        'total_count_now' => 0,
                        'data' => null,
                    ], 500);
                }

                return response()->json([
                    'success' => true,
                    'message' => 'SAP Get First 20 PO successful',
                    'total_count_in_system' => $totalCountInSystem,
                    'total_count_now' => count($reponse_back),
                    'data' => $reponse_back,
                ], 200);
            }

            return response()->json([
                'success' => false,
                'message' => 'SAP Get PO failed',
                'error' => $response->json()['error']['message']['value'] ?? 'Get PO failed',
                'total_count_in_system' => $totalCountInSystem,
                'total_count_now' => 0,
                'data' => null,
            ], $response->status());

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred during Get PO',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get next 20 PO numbers only (pagination)
     */
    public function getpoNext20_numbers(Request $request, int $retryCount = 0)
    {
        try {
            $session = $this->getValidSession();

            $countResponse = Http::withOptions([
                'verify' => false,
            ])->withCookies($session['cookies'], '192.168.68.16')
                ->get("{$this->sapUrl}/PurchaseOrders/\$count");

            $totalCountInSystem = $countResponse->successful() ? (int) $countResponse->body() : 0;

            $response = Http::withOptions([
                'verify' => false,
            ])->withCookies($session['cookies'], '192.168.68.16')
                ->get("{$this->sapUrl}/{$this->nextLink}");

            if ($this->isSessionTimeout($response) && $retryCount < 1) {
                Log::warning('SAP session timeout detected, retrying after re-login');
                $this->clearSessionCache();

                return $this->getpoNext20_numbers($request, $retryCount + 1);
            }

            if ($response->successful()) {
                $data = $response->json();

                $value = $data['value'] ?? [];
                $this->nextLink = $data['odata.nextLink'];
                $reponse_back = [];
                $itemNo = 1;
                foreach ($value as $po) {
                    $reponse_back[] = [
                        'no' => $itemNo++,
                        'po_id' => $po['DocEntry'] ?? '',
                        'po_number' => $po['DocNum'] ?? '',
                        'po_date' => $po['DocDate'] ?? '',
                        'supplier_name' => $po['CardName'] ?? '',
                    ];
                }

                if (! $reponse_back) {
                    return response()->json([
                        'success' => false,
                        'message' => 'SAP Get PO failed: No data returned',
                        'total_count_in_system' => $totalCountInSystem,
                        'total_count_now' => 0,
                        'data' => null,
                    ], 500);
                }

                return response()->json([
                    'success' => true,
                    'message' => 'SAP Get Next 20 PO successful',
                    'total_count_in_system' => $totalCountInSystem,
                    'total_count_now' => count($reponse_back),
                    'data' => $reponse_back,
                ], 200);
            }

            return response()->json([
                'success' => false,
                'message' => 'SAP Get PO failed',
                'error' => $response->json()['error']['message']['value'] ?? 'Get PO failed',
                'total_count_in_system' => $totalCountInSystem,
                'total_count_now' => 0,
                'data' => null,
            ], $response->status());

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred during Get PO',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get single PO by ID with full shipment data
     */
    public function getpo(Request $request, int $retryCount = 0)
    {
        $validator = Validator::make($request->all(), [
            'po_id' => 'required|integer',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $validatedData = $validator->validated();
        try {
            $session = $this->getValidSession();

            $response = Http::withOptions([
                'verify' => false,
            ])->withCookies($session['cookies'], '192.168.68.16')
                ->get("{$this->sapUrl}/PurchaseOrders({$validatedData['po_id']})");

            if ($this->isSessionTimeout($response) && $retryCount < 1) {
                Log::warning('SAP session timeout detected, retrying after re-login');
                $this->clearSessionCache();

                return $this->getpo($request, $retryCount + 1);
            }

            if ($response->successful()) {
                $po = $response->json();

                if (! $po || ! isset($po['DocNum'])) {
                    return response()->json([
                        'success' => false,
                        'message' => 'SAP Get PO failed: No data returned',
                        'data' => null,
                    ], 500);
                }

                $parcel_items = [];
                foreach ($po['DocumentLines'] ?? [] as $line) {
                    $quantity = max(1, $line['Quantity'] ?? 1);
                    $parcel_items[] = [
                        'description' => $line['ItemDescription'] ?? '',
                        'quantity' => $line['Quantity'] ?? 0,
                        'price_amount' => ($po['DocCurrency'] ?? '') === 'USD' ? ($line['RowTotalFC'] ?? 0) / $quantity : ($line['Price'] ?? 0),
                        'price_currency' => $po['DocCurrency'] ?? 'USD',
                        'weight_value' => 0,
                        'weight_unit' => 'kg',
                        'origin_country' => '',
                        'sku' => $line['ItemDescription'] ?? '',
                        'material_code' => $line['ItemCode'] ?? '',
                        'hs_code' => '',
                        'item_id' => $line['ItemCode'] ?? '',
                        'return_reason' => 'N/A',
                    ];
                }

                $parcel = [
                    'box_type_name' => 'CARDBOARD BOX',
                    'width' => 0,
                    'height' => 0,
                    'depth' => 0,
                    'dimension_unit' => 'cm',
                    'weight_value' => 0,
                    'net_weight_value' => 0,
                    'parcel_weight_value' => 0,
                    'weight_unit' => 'kg',
                    'description' => 'PO Items',
                    'parcel_items' => $parcel_items,
                ];

                $countryCodeService = new CountryCodeService;
                $shipToCountryISO2 = $po['AddressExtension']['ShipToCountry'] ?? '';
                $shipFromCountryISO2 = $po['AddressExtension']['BillToCountry'] ?? '';
                $shipToCountry = $countryCodeService->convertToISO3($shipToCountryISO2) ?? $shipToCountryISO2;
                $shipFromCountry = $countryCodeService->convertToISO3($shipFromCountryISO2) ?? $shipFromCountryISO2;
                $shipFromCompanyName = $po['CardName'] ?? '';
                $shipToCompanyName = '';

                // Get TaxExtension data
                $taxExt = $po['TaxExtension'] ?? [];

                // Determine shipment scope type based on countries and Xenoptics detection
                // Use ISO2 codes for internal logic
                $shipmentScopeType = $this->determineShipmentScopeType(
                    $shipFromCountryISO2,
                    $shipToCountryISO2,
                    $shipFromCompanyName,
                    $shipToCompanyName
                );

                $reponse_back = [
                    'no' => 1,
                    'shipment_scope_type' => $shipmentScopeType,
                    'service_options' => $po['ShippingMethod'] ?? '',
                    'urgent_reason' => $po['PickRemark'] ?? '',
                    'remark' => $po['Comments'] ?? '',
                    'topic' => '',
                    'other_topic' => '',
                    'po_number' => $po['DocNum'] ?? '',
                    'po_id' => $po['DocEntry'] ?? '',
                    'due_date' => $po['DocDueDate'] ?? '',
                    'sales_person' => $po['OpeningRemarks'] ?? '',
                    'po_date' => $po['DocDate'] ?? '',
                    'doc_total' => $po['DocTotal'] ?? 0,
                    'doc_currency' => $po['DocCurrency'] ?? '',
                    'vat_sum' => $po['VatSum'] ?? 0,
                    'document_status' => $po['DocumentStatus'] ?? '',
                    'tracking_number' => $po['TrackingNumber'] ?? '',
                    'creation_date' => $po['CreationDate'] ?? '',
                    'send_to' => $po['DocumentsOwner'] ?? '',
                    'ship_from_country' => $shipFromCountry,
                    'ship_from_contact_name' => $po['ContactPersonCode'] ?? '',
                    'ship_from_phone' => '',
                    'ship_from_email' => '',
                    'ship_from_company_name' => $po['CardName'] ?? '',
                    'ship_from_card_code' => $po['CardCode'] ?? '',
                    'ship_from_street1' => $po['AddressExtension']['BillToStreetNo'] ?? '',
                    'ship_from_street2' => $po['AddressExtension']['BillToStreet'] ?? '',
                    'ship_from_street3' => $po['AddressExtension']['BillToBlock'] ?? '',
                    'ship_from_city' => $po['AddressExtension']['BillToCity'] ?? '',
                    'ship_from_state' => $shipFromCountryISO2 === 'US' ? ($po['AddressExtension']['BillToState'] ?? '') : ($po['AddressExtension']['BillToCounty'] ?? ''),
                    'ship_from_postal_code' => $po['AddressExtension']['BillToZipCode'] ?? '',
                    'ship_from_tax_id' => $po['FederalTaxID'] ?? '',
                    'ship_from_eori_number' => '',
                    'ship_to_country' => $shipToCountry,
                    'ship_to_contact_name' => '',
                    'ship_to_phone' => '',
                    'ship_to_email' => '',
                    'ship_to_company_name' => '',
                    'ship_to_street1' => $po['AddressExtension']['ShipToStreetNo'] ?? '',
                    'ship_to_street2' => $po['AddressExtension']['ShipToStreet'] ?? '',
                    'ship_to_street3' => $po['AddressExtension']['ShipToBlock'] ?? '',
                    'ship_to_city' => $po['AddressExtension']['ShipToCity'] ?? '',
                    'ship_to_state' => $shipToCountryISO2 === 'US' ? ($po['AddressExtension']['ShipToState'] ?? '') : ($po['AddressExtension']['ShipToCounty'] ?? ''),
                    'ship_to_postal_code' => $po['AddressExtension']['ShipToZipCode'] ?? '',
                    'ship_to_tax_id' => '',
                    'ship_to_eori_number' => '',

                    'customs_purpose' => $taxExt['MainUsage'] ?? '',
                    'customs_terms_of_trade' => $taxExt['Incoterms'] ?? '',
                    'net_weight' => $taxExt['NetWeight'] ?? 0,
                    'gross_weight' => $taxExt['GrossWeight'] ?? 0,
                    'parcels' => [$parcel],
                ];

                return response()->json([
                    'success' => true,
                    'message' => 'SAP Get PO successful',
                    'data' => $reponse_back,
                    'raw_response' => $po,
                ], 200);
            }

            Log::error('SAP GET PO failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'SAP Get PO failed',
                'error' => $response->json()['error']['message']['value'] ?? 'Get PO failed',
                'data' => null,
            ], $response->status());

        } catch (Exception $e) {
            Log::error('SAP Get PO exception', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred during Get PO',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get single PO by PO Number (DocNum) with full shipment data
     */
    public function getpo_by_number(Request $request, int $retryCount = 0)
    {
        $validator = Validator::make($request->all(), [
            'po_number' => 'required|integer',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $validatedData = $validator->validated();
        try {
            $session = $this->getValidSession();

            $response = Http::withOptions([
                'verify' => false,
            ])->withCookies($session['cookies'], '192.168.68.16')
                ->get("{$this->sapUrl}/PurchaseOrders", [
                    '$filter' => "DocNum eq {$validatedData['po_number']}",
                ]);

            if ($this->isSessionTimeout($response) && $retryCount < 1) {
                Log::warning('SAP session timeout detected, retrying after re-login');
                $this->clearSessionCache();

                return $this->getpo_by_number($request, $retryCount + 1);
            }

            if ($response->successful()) {
                $data = $response->json();
                $value = $data['value'] ?? [];

                if (empty($value)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'PO not found with number: '.$validatedData['po_number'],
                        'data' => null,
                    ], 404);
                }

                $po = $value[0];

                $parcel_items = [];
                $lineNo = 1;
                foreach ($po['DocumentLines'] ?? [] as $line) {
                    $quantity = max(1, $line['Quantity'] ?? 1);
                    $unitPrice = $line['UnitPrice'] ?? $line['Price'] ?? 0;
                    $lineTotal = $line['LineTotal'] ?? 0;
                    $grossTotal = $line['GrossTotal'] ?? 0;

                    $parcel_items[] = [
                        'line_no' => $lineNo++,
                        'line_num' => $line['LineNum'] ?? 0,
                        'description' => $line['ItemDescription'] ?? '',
                        'quantity' => $line['Quantity'] ?? 0,
                        'unit_price' => $unitPrice,
                        'price_amount' => ($po['DocCurrency'] ?? 'THB') === 'USD' ? ($line['RowTotalFC'] ?? 0) / $quantity : $unitPrice,
                        'price_after_vat' => $line['PriceAfterVAT'] ?? 0,
                        'line_total' => $lineTotal,
                        'gross_total' => $grossTotal,
                        'tax_total' => $line['TaxTotal'] ?? 0,
                        'tax_percentage' => $line['TaxPercentagePerRow'] ?? 0,
                        'price_currency' => $line['Currency'] ?? $po['DocCurrency'] ?? 'THB',
                        'weight_value' => $line['Weight1'] ?? 0,
                        'weight_unit' => 'kg',
                        'origin_country' => $line['CountryOrg'] ?? '',
                        'sku' => $line['BarCode'] ?? $line['ItemCode'] ?? '',
                        'material_code' => $line['ItemCode'] ?? '',
                        'hs_code' => '',
                        'item_id' => $line['ItemCode'] ?? '',
                        'warehouse_code' => $line['WarehouseCode'] ?? '',
                        'ship_date' => $line['ShipDate'] ?? '',
                        'required_date' => $line['RequiredDate'] ?? '',
                        'line_status' => $line['LineStatus'] ?? '',
                        'uom_code' => $line['UoMCode'] ?? '',
                        'return_reason' => 'N/A',
                    ];
                }

                $parcel = [
                    'box_type_name' => 'CARDBOARD BOX',
                    'width' => 0,
                    'height' => 0,
                    'depth' => 0,
                    'dimension_unit' => 'cm',
                    'weight_value' => 0,
                    'net_weight_value' => 0,
                    'parcel_weight_value' => 0,
                    'weight_unit' => 'kg',
                    'description' => 'PO Items',
                    'total_items' => count($parcel_items),
                    'parcel_items' => $parcel_items,
                ];

                $countryCodeService = new CountryCodeService;
                $shipToCountryISO2 = $po['AddressExtension']['ShipToCountry'] ?? '';
                $shipFromCountryISO2 = $po['AddressExtension']['BillToCountry'] ?? '';
                $shipToCountry = $countryCodeService->convertToISO3($shipToCountryISO2) ?? $shipToCountryISO2;
                $shipFromCountry = $countryCodeService->convertToISO3($shipFromCountryISO2) ?? $shipFromCountryISO2;
                $shipFromCompanyName = $po['CardName'] ?? '';
                $shipToCompanyName = '';

                // Get TaxExtension data
                $taxExt = $po['TaxExtension'] ?? [];

                // Determine shipment scope type based on countries and Xenoptics detection
                // Use ISO2 codes for internal logic
                $shipmentScopeType = $this->determineShipmentScopeType(
                    $shipFromCountryISO2,
                    $shipToCountryISO2,
                    $shipFromCompanyName,
                    $shipToCompanyName
                );

                $reponse_back = [
                    'no' => 1,
                    'shipment_scope_type' => $shipmentScopeType,
                    'service_options' => $po['ShippingMethod'] ?? '',
                    'urgent_reason' => $po['PickRemark'] ?? '',
                    'remark' => $po['Comments'] ?? '',
                    'topic' => '',
                    'other_topic' => '',
                    'po_number' => $po['DocNum'] ?? '',
                    'po_id' => $po['DocEntry'] ?? '',
                    'due_date' => $po['DocDueDate'] ?? '',
                    'sales_person' => $po['OpeningRemarks'] ?? '',
                    'po_date' => $po['DocDate'] ?? '',
                    'doc_total' => $po['DocTotal'] ?? 0,
                    'doc_currency' => $po['DocCurrency'] ?? '',
                    'vat_sum' => $po['VatSum'] ?? 0,
                    'document_status' => $po['DocumentStatus'] ?? '',
                    'tracking_number' => $po['TrackingNumber'] ?? '',
                    'creation_date' => $po['CreationDate'] ?? '',
                    'send_to' => $po['DocumentsOwner'] ?? '',
                    'ship_from_country' => $shipFromCountry,
                    'ship_from_contact_name' => $po['ContactPersonCode'] ?? '',
                    'ship_from_phone' => '',
                    'ship_from_email' => '',
                    'ship_from_company_name' => $po['CardName'] ?? '',
                    'ship_from_card_code' => $po['CardCode'] ?? '',
                    'ship_from_street1' => $po['AddressExtension']['BillToStreetNo'] ?? '',
                    'ship_from_street2' => $po['AddressExtension']['BillToStreet'] ?? '',
                    'ship_from_street3' => $po['AddressExtension']['BillToBlock'] ?? '',
                    'ship_from_city' => $po['AddressExtension']['BillToCity'] ?? '',
                    'ship_from_state' => $shipFromCountryISO2 === 'US' ? ($po['AddressExtension']['BillToState'] ?? '') : ($po['AddressExtension']['BillToCounty'] ?? ''),
                    'ship_from_postal_code' => $po['AddressExtension']['BillToZipCode'] ?? '',
                    'ship_from_tax_id' => $po['FederalTaxID'] ?? '',
                    'ship_from_eori_number' => '',
                    'ship_to_country' => $shipToCountry,
                    'ship_to_contact_name' => '',
                    'ship_to_phone' => '',
                    'ship_to_email' => '',
                    'ship_to_company_name' => '',
                    'ship_to_street1' => $po['AddressExtension']['ShipToStreetNo'] ?? '',
                    'ship_to_street2' => $po['AddressExtension']['ShipToStreet'] ?? '',
                    'ship_to_street3' => $po['AddressExtension']['ShipToBlock'] ?? '',
                    'ship_to_city' => $po['AddressExtension']['ShipToCity'] ?? '',
                    'ship_to_state' => $shipToCountryISO2 === 'US' ? ($po['AddressExtension']['ShipToState'] ?? '') : ($po['AddressExtension']['ShipToCounty'] ?? ''),
                    'ship_to_postal_code' => $po['AddressExtension']['ShipToZipCode'] ?? '',
                    'ship_to_tax_id' => $po['AddressExtension']['ShipToStreetNo'] = '195 Moo.3 Bypass Chiangmai-Hangdong' ? '0505559000723' : '',
                    'ship_to_eori_number' => '',
                    'customs_purpose' => $taxExt['MainUsage'] ?? '',
                    'customs_terms_of_trade' => $taxExt['Incoterms'] ?? '',
                    'net_weight' => $taxExt['NetWeight'] ?? 0,
                    'gross_weight' => $taxExt['GrossWeight'] ?? 0,
                    'parcels' => [$parcel],
                ];

                return response()->json([
                    'success' => true,
                    'message' => 'SAP Get PO by Number successful',
                    'data' => $reponse_back,
                    'raw_response' => $po,
                ], 200);
            }

            Log::error('SAP GET PO by Number failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'SAP Get PO failed',
                'error' => $response->json()['error']['message']['value'] ?? 'Get PO failed',
                'data' => null,
            ], $response->status());

        } catch (Exception $e) {
            Log::error('SAP Get PO by Number exception', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred during Get PO',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
