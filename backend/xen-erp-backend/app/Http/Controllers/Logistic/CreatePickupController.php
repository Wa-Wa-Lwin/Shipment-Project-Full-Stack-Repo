<?php

namespace App\Http\Controllers\Logistic;

use App\Http\Controllers\Logistic\FedEx\FedExShipmentController;
use App\Models\Logistic\ShipmentRequest;
use GuzzleHttp\Client;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

class CreatePickupController
{
    protected $fedexShipmentController;

    public function __construct(?FedExShipmentController $fedexShipmentController = null)
    {
        $this->fedexShipmentController = $fedexShipmentController ?? app(FedExShipmentController::class);
    }

    /**
     * Automated FedEx pickup scheduling
     * FedEx only allows pickup for today and tomorrow
     * This runs daily at 10 AM to book pickups for tomorrow
     */
    public function automateSchedulePickup()
    {
        try {
            $tomorrow = Carbon::tomorrow()->toDateString();

            // Find all shipment requests with:
            // 1. FedEx as chosen rate
            // 2. Pickup date = tomorrow
            // 3. Pickup status not 'created_success'
            // 4. Label status = 'created' (label must be created first)
            $shipmentRequests = ShipmentRequest::with(['rates', 'shipFrom'])
                ->where('pick_up_date', $tomorrow)
                ->where('pick_up_status', true)
                ->where('label_status', 'created')
                ->where(function ($query) {
                    $query->where('pick_up_created_status', '!=', 'created_success')
                        ->orWhereNull('pick_up_created_status');
                })
                ->whereHas('rates', function ($query) {
                    $query->where('chosen', '1')
                        ->where('shipper_account_slug', 'fedex');
                })
                ->get();

            $results = [
                'total_found' => $shipmentRequests->count(),
                'processed' => 0,
                'success' => 0,
                'failed' => 0,
                'details' => [],
            ];

            foreach ($shipmentRequests as $shipmentRequest) {
                $results['processed']++;

                $pickupResult = $this->createPickup($shipmentRequest->shipmentRequestID);
                $pickupResponse = json_decode($pickupResult->getContent(), true);

                if ($pickupResult->getStatusCode() >= 200 && $pickupResult->getStatusCode() < 300) {
                    $results['success']++;
                    $results['details'][] = [
                        'shipment_request_id' => $shipmentRequest->shipmentRequestID,
                        'status' => 'success',
                        'message' => $pickupResponse['message'] ?? 'Pickup created successfully',
                    ];
                } else {
                    $results['failed']++;
                    $results['details'][] = [
                        'shipment_request_id' => $shipmentRequest->shipmentRequestID,
                        'status' => 'failed',
                        'message' => $pickupResponse['message'] ?? 'Pickup creation failed',
                    ];
                }
            }

            Log::info('FedEx Automated Pickup Scheduling Completed', $results);

            return response()->json([
                'message' => 'Automated FedEx pickup scheduling completed',
                'results' => $results,
            ], 200);
        } catch (\Exception $e) {
            Log::error('FedEx Automated Pickup Scheduling Failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Automated FedEx pickup scheduling failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function createPickup($id)
    {
        try {
            $shipmentRequest = ShipmentRequest::findOrFail($id);

            // Short-circuit: if shipping_options is not 'calculate_rates', only generate invoice and notify warehouse
            if (strtolower($shipmentRequest->shipping_options ?? '') !== 'calculate_rates') {
                $shipmentRequest->pick_up_created_status = 'created_success';
                $shipmentRequest->save();

                return response()->json([
                    'message' => 'Pickup created successfully. This is '.$shipmentRequest->service_options.' .So, there will be no pickup ID or confirmation numbers.',
                    'pick_up_country' => $shipmentRequest->shipFrom->country,
                    'pickup_created_status' => $shipmentRequest->pick_up_created_status,
                    'pickup_id' => $shipmentRequest->pick_up_created_id,
                ]);
            }

            $chosenRate = $shipmentRequest->rates->firstWhere('chosen', '1');

            if (! $chosenRate) {
                $shipmentRequest->error_msg = 'No chosen rate found: create pickup';
                $shipmentRequest->save();

                return response()->json(['message' => 'No chosen rate found: create pickup'], 400);
            }

            // Check if this is FedEx Domestic Thailand - use FedEx Direct API
            if ($chosenRate->shipper_account_description === 'FedEx Domestic Thailand') {
                return $this->fedexShipmentController->createPickupViaFedex($id);
            }

            // Continue with Aftership API for other carriers
            $client = new Client;
            $api_key = 'asat_4042bd0e19e64f6e896709a712be7dcd';
            $serviceType = $chosenRate->service_type;

            $create_pickup_production_url = 'https://api.aftership.com/postmen/v3/pickups';

            // Determine company name length limit and address type based on carrier
            $carrierSlug = strtolower($chosenRate->shipper_account_slug ?? '');
            $isUps = $carrierSlug === 'ups';
            $isDhl = $carrierSlug === 'dhl';
            $companyNameLimit = $isUps ? 25 : 35;

            // Build pickup_from address
            $pickupFrom = [
                'street1' => $shipmentRequest->shipFrom->street1,
                'country' => $shipmentRequest->shipFrom->country,
                'contact_name' => $shipmentRequest->shipFrom->contact_name,
                'phone' => substr($shipmentRequest->shipFrom->phone, 0, 15),
                'company_name' => substr($shipmentRequest->shipFrom->company_name, 0, $companyNameLimit),
                'email' => $shipmentRequest->shipFrom->email,
                'street2' => $shipmentRequest->shipFrom->street2,
                'street3' => $shipmentRequest->shipFrom->street3 ?? '-',
                'city' => $shipmentRequest->shipFrom->city,
                'state' => $shipmentRequest->shipFrom->state,
                'postal_code' => $shipmentRequest->shipFrom->postal_code,
            ];

            // Add type field only for UPS (residential) or DHL (business)
            if ($isUps) {
                $pickupFrom['type'] = 'residential';
            } elseif ($isDhl) {
                $pickupFrom['type'] = 'business';
            }

            // Build ship_to address
            $shipTo = [
                'street1' => $shipmentRequest->shipTo->street1,
                'country' => $shipmentRequest->shipTo->country,
                'contact_name' => $shipmentRequest->shipTo->contact_name,
                'phone' => substr($shipmentRequest->shipTo->phone, 0, 15),
                'company_name' => substr($shipmentRequest->shipTo->company_name, 0, $companyNameLimit),
                'email' => $shipmentRequest->shipTo->email,
                'street2' => $shipmentRequest->shipTo->street2,
                'street3' => $shipmentRequest->shipTo->street3 ?? '-',
                'city' => $shipmentRequest->shipTo->city,
                'state' => $shipmentRequest->shipTo->state,
                'postal_code' => $shipmentRequest->shipTo->postal_code,
            ];

            // Add type field only for UPS (residential) or DHL (business)
            if ($isUps) {
                $shipTo['type'] = 'residential';
            } elseif ($isDhl) {
                $shipTo['type'] = 'business';
            }

            $pickup_payload = [
                // 'pickup_date' => $pick_up_date,
                'pickup_date' => $shipmentRequest->pick_up_date,
                'pickup_start_time' => date('H:i:s', strtotime($shipmentRequest->pick_up_start_time)),
                'pickup_end_time' => date('H:i:s', strtotime($shipmentRequest->pick_up_end_time)),
                'pickup_from' => $pickupFrom,
                'ship_to' => $shipTo,
                'label_ids' => [$shipmentRequest->label_id],
                'pickup_instructions' => ! empty($shipmentRequest->pick_up_instructions)
                    ? $shipmentRequest->pick_up_instructions
                    : '-',
                // 'service_type' => $serviceType,
                // 'shipper_account' => [
                //     'id' => $shipperAccountId,
                // ],
                // 'customs' => [
                //     'purpose' => $shipmentRequest->customs_purpose,
                //     'terms_of_trade' => $shipmentRequest->customs_terms_of_trade,
                // ],
            ];

            $pickup_response = $client->request('POST', $create_pickup_production_url, [
                'verify' => false,
                'headers' => [
                    'Host' => 'api.aftership.com',
                    'as-api-key' => $api_key,
                    'Content-Type' => 'application/json',
                    'Accept' => 'application/json',
                ],
                'json' => $pickup_payload,
                'http_errors' => false,
            ]);

            $pickup_status_code = $pickup_response->getStatusCode();
            $pickup_body = json_decode($pickup_response->getBody(), true);

            if (
                empty($pickup_body['data']['id']) ||
                empty($pickup_body['data']['pickup_confirmation_numbers']) ||
                $pickup_body['data']['status'] === 'failed'
            ) {
                $code = $pickup_body['meta']['code'] ?? 'N/A';
                $message = $pickup_body['meta']['message'] ?? 'No message';
                $details = [];

                if (! empty($pickup_body['meta']['details'])) {
                    foreach ($pickup_body['meta']['details'] as $detail) {
                        if (! empty($detail['info'])) {
                            $details[] = $detail['info'];
                        }
                    }
                }

                $details_str = ! empty($details) ? implode(', ', $details) : 'No details provided';
                $shipmentRequest->pick_up_error_msg = "Code: {$code} | Message: {$message} | Details: {$details_str}";

                $shipmentRequest->pick_up_created_status = 'created_failed';
                $shipmentRequest->save();

                return response()->json([
                    'message' => 'Pickup created failed.',
                    'pick_up_country' => $shipmentRequest->shipFrom->country,
                    'pickup_status_code' => $pickup_status_code,
                    'pickup_created_status' => $shipmentRequest->pick_up_created_status,
                    'pickup_id' => $shipmentRequest->pick_up_created_id,
                    'data_body' => $pickup_body,
                    'pickup_payload' => $pickup_payload,
                ], $pickup_status_code);
            } else {
                $shipmentRequest->pick_up_created_id = $pickup_body['data']['id'];
                $shipmentRequest->pickup_confirmation_numbers = $pickup_body['data']['pickup_confirmation_numbers'][0];  // "message": "Exception occurred: Array to string conversion", "code": 500
                $shipmentRequest->pick_up_created_status = 'created_success';
                $shipmentRequest->save();

                return response()->json([
                    'message' => 'Pickup created successfully. With pickup ID or confirmation numbers.',
                    'pick_up_country' => $shipmentRequest->shipFrom->country,
                    'pickup_status_code' => $pickup_status_code,
                    'pickup_created_status' => $shipmentRequest->pick_up_created_status,
                    'pickup_id' => $shipmentRequest->pick_up_created_id,
                    'data_body' => $pickup_body,
                    'pickup_payload' => $pickup_payload,
                ], $pickup_status_code);
            }
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Exception occurred: '.$e->getMessage(),
                'code' => 500,
            ], 500);
        }
    }
}
