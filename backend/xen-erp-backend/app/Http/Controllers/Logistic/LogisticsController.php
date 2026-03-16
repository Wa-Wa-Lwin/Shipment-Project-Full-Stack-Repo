<?php

namespace App\Http\Controllers\Logistic;

use GuzzleHttp\Client;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class LogisticsController
{
    /**
     * Create a new controller instance.
     *
     * @return void
     */
    protected $client;

    public function __construct()
    {
        $this->client = new Client([
            // 'base_uri' => 'https://api.aftership.com/postmen/v3/',
            'base_uri' => '104.16.189.2',
            'headers' => [
                'as-api-key' => 'asat_4042bd0e19e64f6e896709a712be7dcd', // important: use the correct header name for AfterShip
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
            ],
        ]);
    }

    public function address(Request $request)
    {
        // echo "EXEC [dbo].[Sp_Address_View]";
        $results = app('db')->select('EXEC [Logistics].[dbo].[Sp_Address_View]');

        $results = json_decode($results[0]->ret_obj);
        // $results[0]->data = base64_encode(json_encode($results[0]->data[0]));
        $results = $results[0];

        return response()->json($results);
    }

    public function getDepartment(Request $request)
    {
        $results = app('db')->select('EXEC [dbo].[Sp_Department_View]');

        $results = json_decode($results[0]->ret_obj);
        // $results[0]->data = base64_encode(json_encode($results[0]->data[0]));
        $results = $results[0];

        return response()->json($results);
    }

    public function test()
    {
        // $client = new Client();
        // try {
        //     $response = $client->get('https://httpbin.org/get'); // A safe test API
        //     echo $response->getStatusCode() . "\n";
        //     echo $response->getBody();
        // } catch (\Exception $e) {
        //     echo "Error: " . $e->getMessage();
        // }
        try {
            $client = new Client;
            $response = $client->get('https://httpbin.org/get');
            echo $response->getStatusCode()."\n";
            echo $response->getBody();
        } catch (\Exception $e) {
            echo 'Error: '.$e->getMessage();
        }
    }

    public function getRates(Request $request)
    {
        // try {
        $client = new Client;
        $preparedata = new \stdClass;
        $preparedata = $this->escape($request->input('preparedata'));
        if (empty($preparedata)) {
            return response()->json(['error' => 'preparedata is required'], 400);
        }
        $preparedata = json_encode($preparedata);

        $response = $client->request('GET', 'https://api.aftership.com/postmen/v3/rates?created_at_max=2025-05-21T08:31:15+00:00&created_at_min=2024-03-19T08:31:15+00:00', [
            'verify' => false,
            'headers' => [
                'Host' => 'api.aftership.com',
                'as-api-key' => 'asat_4042bd0e19e64f6e896709a712be7dcd', // important: use the correct header name for AfterShip
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
                'Accept-Encoding' => 'gzip, deflate, br',
                'created_at_max' => '2025-05-01T00:00:00Z',
                'created_at_min' => '2025-01-01T00:00:00Z',
            ],
            // 'json' => $preparedata
        ]);

        return json_decode($response->getBody(), true);
        // return json_decode($response->getBody()->getContents(), true);
        // }
        // catch (\Exception $e) {
        //     return [
        //         'error' => $e->getMessage(),
        //     ];
        // }
    }

    public function calRatesV2(Request $request)
    {
        $error = $this->error($request, ['preparedata']);
        if ($error) {
            return $this->resp_obj($error, 400);
        }

        $client = new Client;
        $apikey = 'asat_4042bd0e19e64f6e896709a712be7dcd';

        $preparedata = $this->escape($request->input('preparedata'));
        $type = $this->escape($request->input('type'));
        $shipment = $preparedata['shipment'];
        $pick_up_date = $preparedata['pick_up_date'];
        $expected_delivery_date = $preparedata['expected_delivery_date'];

        // Base shipper accounts
        $shipper_accounts = [
            ['id' => '927836f5-fb9f-456c-be0e-ad97d7c15b5a'], // FedEx
            // ['id' => 'f535473ba8f3493aa07aad9339f0a439'],       // UPS XENO OLD
            ['id' => 'fb842bff60154a2f8c84584a74d0cf69'],       // DHL eCommerce Asia
            // ['id' => 'cb9b8f9a1214447193ead90036de4aec'], // TNT
            ['id' => '9aa2b4d167cd4b94b3d0fc73582e4ada'], // UPS NEW
        ];

        // Determine DHL import/export account
        $DHLAcc = $shipment['ship_to']['country'] == 'THA' &&
            in_array($shipment['ship_to']['company_name'], ['Xenoptics Limited.', 'XENOptics Limited', 'Xenoptics'])
            ? 'import'
            : 'export';

        if ($DHLAcc === 'import') {
            $shipper_accounts[] = ['id' => 'ddf178238347473cbb9c496d05f852ec'];
        } else {
            $shipper_accounts[] = ['id' => 'f2d341a82daa43079e6e4daa849f8b5e'];
        }

        // Remove duplicate shipper accounts by id
        $shipper_accounts = array_values(
            array_reduce($shipper_accounts, function ($carry, $item) {
                $carry[$item['id']] = $item;

                return $carry;
            }, [])
        );

        $payload = [
            'ship_date' => strtotime($pick_up_date) < strtotime(date('Y-m-d'))
                ? date('Y-m-d', strtotime('+1 day'))
                : date('Y-m-d', strtotime($pick_up_date)),
            'shipper_accounts' => $shipper_accounts,
            'shipment' => $shipment,
            // 'expected_delivery_date' =>  $expected_delivery_date,
            // 'expected_delivery_date' =>  strtotime($expected_delivery_date),
        ];

        if (empty($payload)) {
            return response()->json(['error' => 'payload is required'], 400);
        }

        try {
            $response = $client->request('POST', 'https://api.aftership.com/postmen/v3/rates', [
                'verify' => false,
                'headers' => [
                    'Host' => 'api.aftership.com',
                    'as-api-key' => $apikey,
                    'Content-Type' => 'application/json',
                    'Accept' => 'application/json',
                    'Accept-Encoding' => 'gzip, deflate',
                ],
                'json' => $payload,
            ]);

            $body = (string) $response->getBody();
            $decodedBody = json_decode($body, true);

            if ($decodedBody === null) {
                return response()->json(['error' => 'Failed to decode API response'], 500);
            }

            // Remove duplicate rates based on shipper_account + service_type
            if (isset($decodedBody['data']['rates'])) {
                $uniqueRates = [];
                foreach ($decodedBody['data']['rates'] as $rate) {
                    $key = $rate['shipper_account']['id'].'_'.$rate['service_type'];
                    if (! isset($uniqueRates[$key])) {
                        $uniqueRates[$key] = $rate;
                    }
                }
                $decodedBody['data']['rates'] = array_values($uniqueRates);
                $decodedBody['data']['unique_rate_count'] = count($decodedBody['data']['rates']); // Add unique count
            }

            $isDomestic = isset($shipment['shipment_scope_type'])
                ? str_starts_with(strtolower($shipment['shipment_scope_type']), 'domestic')
                : $this->isDomesticThailand($shipment);

            Log::info('Domestic Thailand check', [
                'is_domestic' => $isDomestic,
                'check_method' => isset($shipment['shipment_scope_type']) ? 'scope_type' : 'country_check',
                'shipment_scope_type' => $shipment['shipment_scope_type'] ?? 'unknown',
                'ship_from_country' => $shipment['ship_from']['country'] ?? 'unknown',
                'ship_to_country' => $shipment['ship_to']['country'] ?? 'unknown',
            ]);

            if ($isDomestic) {
                Log::info('Fetching FedEx rates for domestic Thailand shipment');
                $fedexRates = $this->getFedExRates($shipment);

                if ($fedexRates && isset($fedexRates['rates'])) {
                    Log::info('Merging FedEx rates with AfterShip rates', [
                        'aftership_count' => count($decodedBody['data']['rates'] ?? []),
                        'fedex_count' => count($fedexRates['rates']),
                    ]);

                    // Merge FedEx rates with AfterShip rates
                    if (isset($decodedBody['data']['rates'])) {
                        $decodedBody['data']['rates'] = array_merge(
                            $decodedBody['data']['rates'],
                            $fedexRates['rates']
                        );
                        $decodedBody['data']['unique_rate_count'] = count($decodedBody['data']['rates']);

                        Log::info('Rates merged successfully', [
                            'total_rate_count' => $decodedBody['data']['unique_rate_count'],
                        ]);
                    }
                } else {
                    Log::warning('FedEx rates not available or empty');
                }
            }

            $decodedBody['debug_payload'] = $payload;

            return response()->json($decodedBody);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    protected function error(Request $request, array $requiredFields)
    {
        foreach ($requiredFields as $field) {
            if (! $request->has($field)) {
                return ['error' => "$field is required"];
            }
        }

        return null;
    }

    protected function resp_obj($data, $status = 200)
    {
        return response()->json($data, $status);
    }

    protected function escape($value)
    {
        if (is_array($value)) {
            return array_map([$this, 'escape'], $value);
        }

        return is_string($value) ? e($value) : $value;
    }

    /**
     * Check if shipment is domestic Thailand (TH to TH)
     */
    protected function isDomesticThailand(array $shipment): bool
    {
        $shipFromCountry = strtoupper($shipment['ship_from']['country'] ?? '');
        $shipToCountry = strtoupper($shipment['ship_to']['country'] ?? '');

        // Check if both are Thailand (THA or TH)
        $isFromThailand = in_array($shipFromCountry, ['TH', 'THA', 'THAILAND']);
        $isToThailand = in_array($shipToCountry, ['TH', 'THA', 'THAILAND']);

        return $isFromThailand && $isToThailand;
    }

    /**
     * Get FedEx rates for domestic Thailand shipment, only for supported postal codes
     */
    protected function getFedExRates(array $shipment): ?array
    {
        try {
            // Disable Check for supported postal code prefixes
            // $supportedPostalPrefixes = ['10', '50', '20', '80', '30', '40','13','51']; // Bangkok, Chiang Mai, Chonburi, Phuket, Ayutthaya, Lamphun etc.

            // $shipFromPostal = $shipment['ship_from']['postal_code'] ?? '';
            // $shipToPostal = $shipment['ship_to']['postal_code'] ?? '';

            // $fromPrefix = substr($shipFromPostal, 0, 2);
            // $toPrefix = substr($shipToPostal, 0, 2);

            // // Skip FedEx if either postal prefix is not supported
            // if (!in_array($fromPrefix, $supportedPostalPrefixes) || !in_array($toPrefix, $supportedPostalPrefixes)) {
            //     Log::warning('FedEx skipped: postal codes not supported', [
            //         'ship_from' => $shipFromPostal,
            //         'ship_to' => $shipToPostal
            //     ]);
            //     return null;
            // }

            // Transform AfterShip shipment format to FedEx format
            $fedexPayload = $this->transformToFedExFormat($shipment);

            Log::info('Calling FedEx API for domestic Thailand rates', [
                'payload' => $fedexPayload,
            ]);

            $response = Http::withOptions(['verify' => false])
                ->post(url('/api/fedex/rate-quotes'), $fedexPayload);

            if (! $response->successful()) {
                Log::warning('FedEx rate request failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return null;
            }

            $fedexResponse = $response->json();

            if (! isset($fedexResponse['success']) || ! $fedexResponse['success']) {
                Log::warning('FedEx response indicates failure', ['response' => $fedexResponse]);

                return null;
            }

            // Transform FedEx response to AfterShip rate format
            $transformedRates = $this->transformFedExToAfterShipFormat($fedexResponse);

            Log::info('FedEx rates successfully retrieved and transformed', [
                'rate_count' => count($transformedRates['rates'] ?? []),
            ]);

            return $transformedRates;
        } catch (\Exception $e) {
            Log::error('Error fetching FedEx rates', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return null;
        }
    }

    /**
     * Transform AfterShip shipment format to FedEx API format
     */
    protected function transformToFedExFormat(array $shipment): array
    {
        $packages = [];

        if (isset($shipment['parcels']) && is_array($shipment['parcels'])) {
            foreach ($shipment['parcels'] as $parcel) {
                $package = [
                    'weight' => [
                        'value' => $parcel['weight']['value'] ?? 1,
                        'units' => strtoupper($parcel['weight']['unit'] ?? 'KG'),
                    ],
                ];

                // Add dimensions if available
                if (isset($parcel['dimension'])) {
                    $package['dimensions'] = [
                        'length' => $parcel['dimension']['depth'] ?? 10,
                        'width' => $parcel['dimension']['width'] ?? 10,
                        'height' => $parcel['dimension']['height'] ?? 10,
                        'units' => strtoupper($parcel['dimension']['unit'] ?? 'CM'),
                    ];
                }

                $packages[] = $package;
            }
        }

        // Default package if none provided
        if (empty($packages)) {
            $packages[] = [
                'weight' => [
                    'value' => 1,
                    'units' => 'KG',
                ],
            ];
        }

        // Get postal codes for province lookup
        $shipFromPostal = $shipment['ship_from']['postal_code'] ?? '';
        $shipToPostal = $shipment['ship_to']['postal_code'] ?? '';

        // Get FedEx-formatted city and state codes
        $shipperCity = $this->getFedExCityName($shipFromPostal, $shipment['ship_from']['city'] ?? '');
        $shipperState = $this->getFedExStateCode($shipFromPostal, $shipment['ship_from']['state'] ?? '');

        $recipientCity = $this->getFedExCityName($shipToPostal, $shipment['ship_to']['city'] ?? '');
        $recipientState = $this->getFedExStateCode($shipToPostal, $shipment['ship_to']['state'] ?? '');

        return [
            'shipper' => [
                'postalCode' => $shipFromPostal,
                'countryCode' => 'TH',
                'city' => $shipperCity,
            ],
            'recipient' => [
                'postalCode' => $shipToPostal,
                'countryCode' => 'TH',
                'city' => $recipientCity,
                'residential' => isset($shipment['ship_to']['type']) && $shipment['ship_to']['type'] === 'residential',
            ],
            'packages' => $packages,
            'pickupType' => 'USE_SCHEDULED_PICKUP', // Better for domestic Thailand
            'rateRequestType' => ['ACCOUNT'],
        ];
    }

    /**
     * Get FedEx-compliant city name (English only, no Thai characters)
     * Always use postal code mapping for Thailand to ensure FedEx recognizes the city
     */
    protected function getFedExCityName(string $postalCode, string $cityName): string
    {
        // Map common Thai postal prefixes to main city names
        $postalPrefix = substr($postalCode, 0, 2);

        $cityMapping = [
            '10' => 'Bangkok',
            '50' => 'Chiang Mai',
            '20' => 'Chonburi',
            '80' => 'Phuket',
            '30' => 'Nakhon Ratchasima',
            '40' => 'Khon Kaen',
            '60' => 'Nakhon Sawan',
        ];

        // Always use postal code mapping for consistency with FedEx
        // Districts like "Hang Dong" (postal 50230) should map to "Chiang Mai"
        return $cityMapping[$postalPrefix] ?? 'Bangkok';
    }

    /**
     * Get FedEx state code in TH-XX format (ISO 3166-2:TH)
     */
    protected function getFedExStateCode(string $postalCode, string $stateName): string
    {
        // Postal code to FedEx state code mapping (ISO 3166-2:TH format)
        $postalPrefix = substr($postalCode, 0, 2);

        $stateCodeMapping = [
            '10' => 'TH-10', // Bangkok
            '50' => 'TH-50', // Chiang Mai
            '51' => 'TH-57', // Lamphun
            '52' => 'TH-58', // Lampang
            '20' => 'TH-20', // Chonburi
            '21' => 'TH-21', // Rayong
            '80' => 'TH-83', // Phuket
            '30' => 'TH-30', // Nakhon Ratchasima
            '40' => 'TH-40', // Khon Kaen
            '60' => 'TH-60', // Nakhon Sawan
            '11' => 'TH-11', // Samut Prakan
            '12' => 'TH-12', // Nonthaburi
            '13' => 'TH-13', // Pathum Thani
            '14' => 'TH-14', // Phra Nakhon Si Ayutthaya
            '15' => 'TH-15', // Ang Thong
            '16' => 'TH-16', // Lopburi
            '17' => 'TH-17', // Sing Buri
            '18' => 'TH-18', // Chai Nat
            '19' => 'TH-19', // Saraburi
            '22' => 'TH-22', // Chanthaburi
            '23' => 'TH-23', // Trat
            '24' => 'TH-24', // Chachoengsao
            '25' => 'TH-25', // Prachin Buri
            '26' => 'TH-26', // Nakhon Nayok
            '27' => 'TH-27', // Sa Kaeo
            '31' => 'TH-31', // Buri Ram
            '32' => 'TH-32', // Surin
            '33' => 'TH-33', // Si Sa Ket
            '34' => 'TH-34', // Ubon Ratchathani
            '35' => 'TH-35', // Yasothon
            '36' => 'TH-36', // Chaiyaphum
            '37' => 'TH-37', // Amnat Charoen
            '38' => 'TH-38', // Bueng Kan
            '39' => 'TH-39', // Nong Bua Lam Phu
            '41' => 'TH-41', // Udon Thani
            '42' => 'TH-42', // Loei
            '43' => 'TH-43', // Nong Khai
            '44' => 'TH-44', // Maha Sarakham
            '45' => 'TH-45', // Roi Et
            '46' => 'TH-46', // Kalasin
            '47' => 'TH-47', // Sakon Nakhon
            '48' => 'TH-48', // Nakhon Phanom
            '49' => 'TH-49', // Mukdahan
            '53' => 'TH-52', // Uttaradit
            '54' => 'TH-54', // Phrae
            '55' => 'TH-55', // Nan
            '56' => 'TH-56', // Phayao
            '57' => 'TH-51', // Chiang Rai
            '58' => 'TH-53', // Mae Hong Son
            '70' => 'TH-70', // Ratchaburi
            '71' => 'TH-71', // Kanchanaburi
            '72' => 'TH-72', // Suphan Buri
            '73' => 'TH-73', // Nakhon Pathom
            '74' => 'TH-74', // Samut Sakhon
            '75' => 'TH-75', // Samut Songkhram
            '76' => 'TH-76', // Phetchaburi
            '77' => 'TH-77', // Prachuap Khiri Khan
            '81' => 'TH-82', // Phang Nga
            '82' => 'TH-81', // Krabi
            '83' => 'TH-84', // Nakhon Si Thammarat
            '84' => 'TH-86', // Surat Thani
            '85' => 'TH-85', // Ranong
            '86' => 'TH-80', // Chumphon
            '90' => 'TH-90', // Songkhla
            '91' => 'TH-91', // Satun
            '92' => 'TH-92', // Trang
            '93' => 'TH-93', // Phatthalung
            '94' => 'TH-94', // Pattani
            '95' => 'TH-95', // Yala
            '96' => 'TH-96', // Narathiwat
        ];

        return $stateCodeMapping[$postalPrefix] ?? 'TH-10'; // Default to Bangkok
    }

    /**
     * Transform FedEx API response to AfterShip rate format
     * Matches the exact structure of calRatesV2 response
     */
    protected function transformFedExToAfterShipFormat(array $fedexResponse): array
    {
        $rates = [];

        if (! isset($fedexResponse['data']['output']['rateReplyDetails'])) {
            return ['rates' => []];
        }

        foreach ($fedexResponse['data']['output']['rateReplyDetails'] as $rateDetail) {
            foreach ($rateDetail['ratedShipmentDetails'] as $shipmentDetail) {
                if ($shipmentDetail['rateType'] !== 'ACCOUNT') {
                    continue; // Only use account rates
                }

                // Build rate in exact AfterShip format
                $rate = [
                    'shipper_account' => [
                        'id' => '927836f5-fb9f-456c-be0e-ad97d7c15b5a', // Use actual FedEx account ID
                        'slug' => 'fedex',
                        'description' => 'FedEx Domestic Thailand',
                    ],
                    'service_type' => strtolower($rateDetail['serviceType']),
                    'service_name' => $rateDetail['serviceName'] ?? $rateDetail['serviceType'],
                    'pickup_deadline' => null, // FedEx API doesn't provide this for domestic
                    'booking_cut_off' => null, // FedEx API doesn't provide this for domestic
                    'delivery_date' => null,   // FedEx API doesn't provide this for domestic
                    'transit_time' => null,    // FedEx API doesn't provide this for domestic
                    'error_message' => null,
                    'info_message' => null,
                    'charge_weight' => [
                        'value' => $shipmentDetail['shipmentRateDetail']['totalBillingWeight']['value'] ?? 0,
                        'unit' => strtolower($shipmentDetail['shipmentRateDetail']['totalBillingWeight']['units'] ?? 'kg'),
                    ],
                    'total_charge' => [
                        'amount' => $shipmentDetail['totalNetCharge'],
                        'currency' => $shipmentDetail['currency'] ?? 'THB',
                    ],
                    'detailed_charges' => [],
                ];

                // Add base charge
                $rate['detailed_charges'][] = [
                    'type' => 'base',
                    'charge' => [
                        'amount' => $shipmentDetail['totalBaseCharge'],
                        'currency' => $shipmentDetail['currency'] ?? 'THB',
                    ],
                ];

                // Add surcharges with proper naming to match AfterShip format
                if (isset($shipmentDetail['shipmentRateDetail']['surCharges'])) {
                    foreach ($shipmentDetail['shipmentRateDetail']['surCharges'] as $surcharge) {
                        $type = strtolower($surcharge['type']);

                        // Map FedEx charge types to AfterShip naming convention
                        $typeMapping = [
                            'fuel' => 'fuel_surcharge',
                            'residential_delivery' => 'residential_delivery',
                            'demand_surcharge' => 'demand_surcharge',
                        ];

                        $mappedType = $typeMapping[$type] ?? $type;

                        $rate['detailed_charges'][] = [
                            'type' => $mappedType,
                            'charge' => [
                                'amount' => $surcharge['amount'],
                                'currency' => $shipmentDetail['currency'] ?? 'THB',
                            ],
                        ];
                    }
                }

                $rates[] = $rate;
            }
        }

        return ['rates' => $rates];
    }
}
