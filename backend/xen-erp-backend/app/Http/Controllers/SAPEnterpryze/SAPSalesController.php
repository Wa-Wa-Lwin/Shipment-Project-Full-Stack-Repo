<?php

namespace App\Http\Controllers\SAPEnterpryze;

use App\Services\CountryCodeService;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class SAPSalesController
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
     * Get single Sales Invoice by Sales Invoice Number (DocNum) with full shipment data
     * //https://192.168.68.16:50000/b1s/v1/Invoices?$filter=DocNum eq 123
     */
    public function getsalesinv_by_number(Request $request, int $retryCount = 0)
    {
        $validator = Validator::make($request->all(), [
            'sinv_number' => 'required|integer',
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
                ->get("{$this->sapUrl}/Invoices", [
                    '$filter' => "DocNum eq {$validatedData['sinv_number']}",
                ]);

            if ($this->isSessionTimeout($response) && $retryCount < 1) {
                Log::warning('SAP session timeout detected, retrying after re-login');
                $this->clearSessionCache();

                return $this->getsalesinv_by_number($request, $retryCount + 1);
            }

            if ($response->successful()) {
                $data = $response->json();
                $value = $data['value'] ?? [];

                if (empty($value)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Sales Invoice not found with number: '.$validatedData['sinv_number'],
                        'data' => null,
                    ], 404);
                }

                $salesinv = $value[0];

                $parcel_items = [];
                $lineNo = 1;
                foreach ($salesinv['DocumentLines'] ?? [] as $line) {
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
                        'price_amount' => ($salesinv['DocCurrency'] ?? 'THB') === 'USD' ? ($line['RowTotalFC'] ?? 0) / $quantity : $unitPrice,
                        'price_after_vat' => $line['PriceAfterVAT'] ?? 0,
                        'line_total' => $lineTotal,
                        'gross_total' => $grossTotal,
                        'tax_total' => $line['TaxTotal'] ?? 0,
                        'tax_percentage' => $line['TaxPercentagePerRow'] ?? 0,
                        'price_currency' => $line['Currency'] ?? $salesinv['DocCurrency'] ?? 'THB',
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
                $shipToCountryISO2 = $salesinv['AddressExtension']['ShipToCountry'] ?? '';
                $shipToCountry = $countryCodeService->convertToISO3($shipToCountryISO2) ?? $shipToCountryISO2;
                $shipFromCountry = 'THA'; // $salesinv['AddressExtension']['BillToCountry'] ?? '';
                $shipFromCompanyName = 'XENOptics Limited';
                $shipToCompanyName = $salesinv['CardName'] ?? '';

                // Get TaxExtension data
                $taxExt = $salesinv['TaxExtension'] ?? [];

                // Determine shipment scope type based on countries and Xenoptics detection
                // Use ISO2 codes for internal logic (determineShipmentScopeType expects ISO2)
                $shipmentScopeType = $this->determineShipmentScopeType(
                    'TH', // shipFromCountry ISO2
                    $shipToCountryISO2,
                    $shipFromCompanyName,
                    $shipToCompanyName
                );

                $reponse_back = [
                    'no' => 1,
                    'shipment_scope_type' => $shipmentScopeType,
                    'service_options' => $salesinv['ShippingMethod'] ?? '',
                    'urgent_reason' => $salesinv['NumAtCard'] ?? '',
                    'remark' => $salesinv['Comments'] ?? '',
                    'topic' => 'For Sales',
                    'other_topic' => '',
                    'po_number' => $salesinv['DocNum'] ?? '',
                    'po_id' => $salesinv['DocEntry'] ?? '',
                    'sales_person' => $salesinv['SalesPersonCode'] ?? '',
                    'invoice_date' => $salesinv['DocDate'] ?? '',
                    'invoice_due_date' => $salesinv['DocDueDate'] ?? '',
                    'doc_total' => $salesinv['DocTotal'] ?? 0,
                    'doc_currency' => $salesinv['DocCurrency'] ?? '',
                    'vat_sum' => $salesinv['VatSum'] ?? 0,
                    'document_status' => $salesinv['DocumentStatus'] ?? '',
                    'tracking_number' => $salesinv['TrackingNumber'] ?? '',
                    'creation_date' => $salesinv['CreationDate'] ?? '',
                    'send_to' => $salesinv['DocumentsOwner'] ?? '',
                    'ship_from_country' => $shipFromCountry,
                    'ship_from_contact_name' => 'Ms. Sasipimol', // $salesinv['SalesPersonCode'] ?? '',
                    'ship_from_phone' => '+66-81-234-5678',
                    'ship_from_email' => 'sasipimol@xenoptics.com',
                    'ship_from_company_name' => $shipFromCompanyName,
                    // 'ship_from_card_code' => $salesinv['CardCode'] ?? '',
                    'ship_from_street1' => '195 Moo.3 Bypass Chiangmai-Hangdong',
                    'ship_from_street2' => '',
                    'ship_from_street3' => '',
                    'ship_from_city' => 'Hang Dong',
                    'ship_from_state' => 'Chiang Mai',
                    'ship_from_postal_code' => '50230',
                    'ship_from_tax_id' => '0505559000723', // $salesinv['FederalTaxID'] ?? '',
                    'ship_from_eori_number' => '',
                    'ship_to_country' => $shipToCountry,
                    'ship_to_contact_name' => '',
                    'ship_to_phone' => '',
                    'ship_to_email' => '',
                    'ship_to_company_name' => $shipToCompanyName,
                    'ship_to_street1' => $salesinv['AddressExtension']['ShipToStreetNo'] ?? '',
                    'ship_to_street2' => $salesinv['AddressExtension']['ShipToStreet'] ?? '',
                    'ship_to_street3' => $salesinv['AddressExtension']['ShipToBlock'] ?? '',
                    'ship_to_city' => $salesinv['AddressExtension']['ShipToCity'] ?? '',
                    'ship_to_state' => $shipToCountryISO2 === 'US' ? ($salesinv['AddressExtension']['ShipToState'] ?? '') : ($salesinv['AddressExtension']['ShipToCounty'] ?? ''),
                    'ship_to_postal_code' => $salesinv['AddressExtension']['ShipToZipCode'] ?? '',
                    'ship_to_tax_id' => $salesinv['FederalTaxID'] ?? '',
                    'ship_to_eori_number' => '',
                    'customs_purpose' => $taxExt['MainUsage'] ?? '',
                    'customs_terms_of_trade' => $taxExt['Incoterms'] ?? '',
                    'net_weight' => $taxExt['NetWeight'] ?? 0,
                    'gross_weight' => $taxExt['GrossWeight'] ?? 0,
                    'parcels' => [$parcel],
                ];

                return response()->json([
                    'success' => true,
                    'message' => 'SAP Get Sales Invoice by Number successful',
                    'data' => $reponse_back,
                ], 200);
            }

            Log::error('SAP GET Sales Invoice by Number failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'SAP Get Sales Invoice failed',
                'error' => $response->json()['error']['message']['value'] ?? 'Get Sales Invoice failed',
                'data' => null,
            ], $response->status());

        } catch (Exception $e) {
            Log::error('SAP Get Sales Invoice by Number exception', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred during Get Sales Invoice',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get single Sales Invoice by Number - raw SAP response only
     */
    public function getsalesinv_by_number_raw_response(Request $request, int $retryCount = 0)
    {
        $validator = Validator::make($request->all(), [
            'sinv_number' => 'required|integer',
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
                ->get("{$this->sapUrl}/Invoices", [
                    '$filter' => "DocNum eq {$validatedData['sinv_number']}",
                ]);

            if ($this->isSessionTimeout($response) && $retryCount < 1) {
                Log::warning('SAP session timeout detected, retrying after re-login');
                $this->clearSessionCache();

                return $this->getsalesinv_by_number_raw_response($request, $retryCount + 1);
            }

            if ($response->successful()) {
                $data = $response->json();
                $value = $data['value'] ?? [];

                if (empty($value)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Sales Invoice not found with number: '.$validatedData['sinv_number'],
                        'data' => null,
                    ], 404);
                }

                return response()->json([
                    'success' => true,
                    'message' => 'SAP Get Sales Invoice raw response successful',
                    'data' => $value[0],
                ], 200);
            }

            Log::error('SAP GET Sales Invoice raw response failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'SAP Get Sales Invoice failed',
                'error' => $response->json()['error']['message']['value'] ?? 'Get Sales Invoice failed',
                'data' => null,
            ], $response->status());

        } catch (Exception $e) {
            Log::error('SAP Get Sales Invoice raw response exception', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred during Get Sales Invoice',
                'error' => $e->getMessage(),
            ], 500);
        }
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
}
