<?php

namespace App\Services;

use App\Http\Controllers\Logistic\CreateLabelController;
use App\Models\Logistic\ShipmentRequest;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

class ScheduleLabelCreationService
{
    protected $createLabelController;

    public function __construct(?CreateLabelController $createLabelController = null)
    {
        $this->createLabelController = $createLabelController ?? app(CreateLabelController::class);
    }

    /**
     * Automated FedEx label creation scheduling
     * For FedEx shipments with ship_date more than 10 days in the future,
     * schedule label creation to run daily until created
     * This prevents labels from being created too early when they may expire
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function automateScheduleLabelCreation()
    {
        try {
            // Find all FedEx shipment requests that need scheduling or creation
            // - shipping_options = 'calculate_rates'
            // - label_status not 'created' or 'failed'
            // - FedEx is the chosen carrier
            $today = Carbon::today();
            $tenDaysLater = Carbon::today()->addDays(10);

            $shipmentRequests = ShipmentRequest::with(['rates'])
                ->where('shipping_options', 'calculate_rates')
                ->where(function ($query) {
                    $query->where('label_status', '===', 'scheduled')
                        ->where('request_status', '===', 'approver_approved');
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
                'skipped' => 0,
                'scheduled' => 0,
                'details' => [],
            ];

            foreach ($shipmentRequests as $shipmentRequest) {
                $results['processed']++;
                // Parse pickup date
                try {
                    $pickupDate = Carbon::parse($shipmentRequest->pick_up_date);
                } catch (\Exception $e) {
                    $results['failed']++;
                    $results['details'][] = [
                        'shipment_request_id' => $shipmentRequest->shipmentRequestID,
                        'status' => 'failed',
                        'message' => 'Invalid or missing pick_up_date',
                    ];

                    continue;
                }

                // If pickup date is more than 10 days away -> mark as scheduled and skip creation
                if ($pickupDate->greaterThan($tenDaysLater)) {
                    if (strtolower($shipmentRequest->label_status ?? '') !== 'scheduled') {
                        $shipmentRequest->label_status = 'scheduled';
                        $shipmentRequest->label_error_msg = 'Label scheduled for future creation';
                        $shipmentRequest->save();
                        $results['scheduled']++;
                        $results['details'][] = [
                            'shipment_request_id' => $shipmentRequest->shipmentRequestID,
                            'status' => 'scheduled',
                            'message' => 'Label scheduled for future creation',
                        ];
                    } else {
                        $results['skipped']++;
                        $results['details'][] = [
                            'shipment_request_id' => $shipmentRequest->shipmentRequestID,
                            'status' => 'skipped',
                            'message' => 'Already scheduled for future creation',
                        ];
                    }

                    continue;
                }

                // Otherwise pickup is within the 10-day window -> attempt label creation
                // Skip if recently attempted to avoid excessive API calls
                if ($this->shouldSkipLabelCreationAttempt($shipmentRequest)) {
                    $results['skipped']++;
                    $results['details'][] = [
                        'shipment_request_id' => $shipmentRequest->shipmentRequestID,
                        'status' => 'skipped',
                        'message' => 'Label creation attempt skipped - already attempted recently',
                    ];

                    continue;
                }

                $labelResult = $this->createLabelController->createLabel($shipmentRequest->shipmentRequestID);
                $labelResponse = json_decode($labelResult->getContent(), true);

                if ($labelResult->getStatusCode() >= 200 && $labelResult->getStatusCode() < 300) {
                    $results['success']++;
                    $results['details'][] = [
                        'shipment_request_id' => $shipmentRequest->shipmentRequestID,
                        'status' => 'success',
                        'message' => $labelResponse['message'] ?? 'Label created successfully',
                    ];
                } else {
                    $results['failed']++;
                    $results['details'][] = [
                        'shipment_request_id' => $shipmentRequest->shipmentRequestID,
                        'status' => 'failed',
                        'message' => $labelResponse['message'] ?? 'Label creation failed',
                    ];
                }
            }

            Log::info('FedEx Automated Label Creation Scheduling Completed', $results);

            return response()->json([
                'message' => 'Automated FedEx label creation scheduling completed',
                'results' => $results,
            ], 200);
        } catch (\Exception $e) {
            Log::error('FedEx Automated Label Creation Scheduling Failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Automated FedEx label creation scheduling failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Check if label creation attempt should be skipped
     * Prevents excessive API calls by checking if an attempt was made recently
     * Only attempts once per day for shipments with future dates
     *
     * @param  ShipmentRequest  $shipmentRequest
     */
    private function shouldSkipLabelCreationAttempt($shipmentRequest): bool
    {
        // If label was just created, skip
        if ($shipmentRequest->label_status === 'created') {
            return true;
        }

        // If label creation failed, skip for now (will retry tomorrow)
        if ($shipmentRequest->label_status === 'failed') {
            return true;
        }

        // If label creation is currently processing, skip
        if ($shipmentRequest->label_status === 'processing') {
            return true;
        }

        return false;
    }
}
