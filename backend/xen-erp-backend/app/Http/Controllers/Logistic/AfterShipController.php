<?php

namespace App\Http\Controllers\Logistic;

use App\Models\Logistic\ShipmentRequest;
use App\Models\Logistic\ShipmentRequestHistory;
use GuzzleHttp\Client;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

class AfterShipController
{
    /**
     * Get all labels from AfterShip API
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getAllLabels(Request $request)
    {
        $client = new Client;
        $api_key = 'asat_4042bd0e19e64f6e896709a712be7dcd';
        $base_url = 'https://api.aftership.com/postmen/v3/labels';

        try {
            // Build query parameters
            $queryParams = [];

            // Date range configuration
            $maxDaysRange = 90; // Maximum allowed date range in days
            $defaultDaysBack = 1; // Default to last 24 hours

            // Get created_at_min from request, default to 24 hours ago
            if ($request->has('created_at_min')) {
                $createdAtMin = $request->input('created_at_min');

                // Validate date format
                try {
                    $minDate = new \DateTime($createdAtMin);
                } catch (\Exception $e) {
                    return response()->json([
                        'message' => 'Invalid created_at_min date format',
                        'error' => 'Please provide a valid ISO 8601 date format (e.g., 2025-10-14T02:16:17+00:00)',
                    ], 400);
                }
            } else {
                // Default to 24 hours ago
                $minDate = new \DateTime('now', new \DateTimeZone('UTC'));
                $minDate->modify("-{$defaultDaysBack} day");
                $createdAtMin = $minDate->format('Y-m-d\TH:i:sP');
            }

            // Get created_at_max from request, default to current time
            if ($request->has('created_at_max')) {
                $createdAtMax = $request->input('created_at_max');

                // Validate date format
                try {
                    $maxDate = new \DateTime($createdAtMax);
                } catch (\Exception $e) {
                    return response()->json([
                        'message' => 'Invalid created_at_max date format',
                        'error' => 'Please provide a valid ISO 8601 date format (e.g., 2025-10-15T02:16:17+00:00)',
                    ], 400);
                }
            } else {
                // Default to current time
                $maxDate = new \DateTime('now', new \DateTimeZone('UTC'));
                $createdAtMax = $maxDate->format('Y-m-d\TH:i:sP');
            }

            // Validate date range
            if (! isset($minDate)) {
                $minDate = new \DateTime($createdAtMin);
            }
            if (! isset($maxDate)) {
                $maxDate = new \DateTime($createdAtMax);
            }

            // Ensure created_at_max is after created_at_min
            if ($maxDate <= $minDate) {
                return response()->json([
                    'message' => 'Invalid date range',
                    'error' => 'created_at_max must be after created_at_min',
                ], 400);
            }

            // Check if date range exceeds maximum allowed
            $daysDifference = $maxDate->diff($minDate)->days;
            if ($daysDifference > $maxDaysRange) {
                return response()->json([
                    'message' => 'Date range too large',
                    'error' => "Maximum allowed date range is {$maxDaysRange} days. Current range: {$daysDifference} days",
                ], 400);
            }

            $queryParams['created_at_min'] = $createdAtMin;
            $queryParams['created_at_max'] = $createdAtMax;

            // Set limit to maximum to reduce number of API calls
            $queryParams['limit'] = 100;

            // Fetch all labels with automatic pagination
            $allLabels = [];
            $nextToken = null;
            $pageCount = 0;
            $maxPages = 100; // Safety limit to prevent infinite loops (100 pages * 100 items = 10,000 max)

            do {
                // Add next_token to query if we have one
                if ($nextToken) {
                    $queryParams['next_token'] = $nextToken;
                } else {
                    // Remove next_token from query for first request
                    unset($queryParams['next_token']);
                }

                // Make the API request
                $response = $client->request('GET', $base_url, [
                    'verify' => false,
                    'headers' => [
                        'Host' => 'api.aftership.com',
                        'as-api-key' => $api_key,
                        'Content-Type' => 'application/json',
                        'Accept' => 'application/json',
                    ],
                    'query' => $queryParams,
                    'http_errors' => false,
                ]);

                $statusCode = $response->getStatusCode();
                $bodyContents = $response->getBody()->getContents();
                $responseBody = json_decode($bodyContents, true);

                // Log each page for debugging
                Log::info('AfterShip Get All Labels Response - Page '.($pageCount + 1), [
                    'status_code' => $statusCode,
                    'labels_count' => count($responseBody['data']['labels'] ?? []),
                    'has_next_token' => ! empty($responseBody['data']['next_token']),
                ]);

                // Check if the request was successful
                if ($statusCode !== 200 || ! isset($responseBody['meta']['code']) || $responseBody['meta']['code'] !== 200) {
                    return response()->json([
                        'message' => 'Failed to retrieve labels',
                        'meta' => $responseBody['meta'] ?? null,
                        'data' => $responseBody['data'] ?? null,
                        'raw_response' => $bodyContents,
                    ], $statusCode);
                }

                // Collect labels from this page
                $pageLabels = $responseBody['data']['labels'] ?? [];
                $allLabels = array_merge($allLabels, $pageLabels);

                // Get next_token for pagination
                $nextToken = $responseBody['data']['next_token'] ?? null;
                $pageCount++;

                // Safety check to prevent infinite loops
                if ($pageCount >= $maxPages) {
                    Log::warning('AfterShip Get All Labels - Max pages reached', [
                        'max_pages' => $maxPages,
                        'total_labels_fetched' => count($allLabels),
                    ]);
                    break;
                }

            } while (! empty($nextToken));

            // Calculate counts from all collected labels
            $totalRequestCount = count($allLabels);
            $createdRequestCount = 0;
            $cancelledRequestCount = 0;
            $failedRequestCount = 0;

            foreach ($allLabels as $label) {
                if (isset($label['status'])) {
                    if ($label['status'] === 'created') {
                        $createdRequestCount++;
                    } elseif ($label['status'] === 'cancelled') {
                        $cancelledRequestCount++;
                    } elseif ($label['status'] === 'failed') {
                        $failedRequestCount++;
                    }
                }
            }

            Log::info('AfterShip Get All Labels - Complete', [
                'total_pages' => $pageCount,
                'total_labels' => $totalRequestCount,
            ]);

            return response()->json([
                'message' => 'Labels retrieved successfully',
                'total_request_count' => $totalRequestCount,
                'created_request_count' => $createdRequestCount,
                'cancelled_request_count' => $cancelledRequestCount,
                'failed_request_count' => $failedRequestCount,
                'pages_fetched' => $pageCount,
                'meta' => [
                    'code' => 200,
                    'message' => 'OK',
                ],
                'data' => [
                    'labels' => $allLabels,
                    'created_at_min' => $createdAtMin,
                    'created_at_max' => $createdAtMax,
                    'next_token' => '', // Always empty since we fetch all
                ],
            ], 200);

        } catch (\Exception $e) {
            Log::error('AfterShip Get All Labels Exception', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Exception occurred while retrieving labels',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get a single label by ID from AfterShip API
     *
     * @param  string  $labelId
     * @return \Illuminate\Http\JsonResponse
     */
    public function getLabel($labelId)
    {
        $client = new Client;
        $api_key = 'asat_4042bd0e19e64f6e896709a712be7dcd';
        $url = "https://api.aftership.com/postmen/v3/labels/{$labelId}";

        try {
            $response = $client->request('GET', $url, [
                'verify' => false,
                'headers' => [
                    'Host' => 'api.aftership.com',
                    'as-api-key' => $api_key,
                    'Content-Type' => 'application/json',
                    'Accept' => 'application/json',
                ],
                'http_errors' => false,
            ]);

            $statusCode = $response->getStatusCode();
            $bodyContents = $response->getBody()->getContents();
            $responseBody = json_decode($bodyContents, true);

            Log::info('AfterShip Get Label Response', [
                'label_id' => $labelId,
                'status_code' => $statusCode,
                'response' => $responseBody,
            ]);

            if ($statusCode === 200 && isset($responseBody['meta']['code']) && $responseBody['meta']['code'] === 200) {
                return response()->json([
                    'message' => 'Label retrieved successfully',
                    'meta' => $responseBody['meta'],
                    'data' => $responseBody['data'],
                ], 200);
            } else {
                return response()->json([
                    'message' => 'Failed to retrieve label',
                    'meta' => $responseBody['meta'] ?? null,
                    'data' => $responseBody['data'] ?? null,
                    'raw_response' => $bodyContents,
                ], $statusCode);
            }

        } catch (\Exception $e) {
            Log::error('AfterShip Get Label Exception', [
                'label_id' => $labelId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Exception occurred while retrieving label',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Cancel a label by ID in AfterShip API
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function cancelLabel(Request $request)
    {
        $client = new Client;
        $api_key = 'asat_4042bd0e19e64f6e896709a712be7dcd';
        $url = 'https://api.aftership.com/postmen/v3/cancel-labels';

        try {
            // Validate the request
            $labelId = $request->input('label.id') ?? $request->input('label_id');

            if (empty($labelId)) {
                return response()->json([
                    'message' => 'Label ID is required',
                    'error' => 'Please provide label.id or label_id in the request body',
                ], 400);
            }

            // Build the payload
            $payload = [
                'label' => [
                    'id' => $labelId,
                ],
            ];

            // Make the API request
            $response = $client->request('POST', $url, [
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

            // Log the response for debugging
            Log::info('AfterShip Cancel Label Response', [
                'label_id' => $labelId,
                'status_code' => $statusCode,
                'response' => $responseBody,
            ]);

            // Check if the request was successful
            if ($statusCode === 200 && isset($responseBody['meta']['code']) && $responseBody['meta']['code'] === 200) {
                // Update the Shipment_Request record in database
                $shipmentRequest = ShipmentRequest::where('label_id', $labelId)->first();

                if ($shipmentRequest) {
                    // Update label_status to cancelled
                    $shipmentRequest->label_status = 'cancelled';
                    $shipmentRequest->save();

                    // Create a new shipment request history record
                    $history = new ShipmentRequestHistory;
                    $history->shipment_request_id = $shipmentRequest->shipmentRequestID;
                    $history->shipment_request_created_date_time = $shipmentRequest->created_date_time;
                    $history->user_id = $request->input('user_id') ?? null;
                    $history->user_name = $request->input('user_name') ?? 'System';
                    $history->user_role = $request->input('user_role') ?? 'System';
                    $history->status = 'Label Cancelled';
                    $history->remark = "Label ID: {$labelId} cancelled via AfterShip API";
                    $history->history_count = $shipmentRequest->history_count + 1;
                    $history->history_record_date_time = Carbon::now();
                    $history->save();

                    // Increment history_count
                    $shipmentRequest->increment('history_count');

                    Log::info('Shipment Request Updated After Label Cancellation', [
                        'shipment_request_id' => $shipmentRequest->shipmentRequestID,
                        'label_id' => $labelId,
                        'label_status' => 'cancelled',
                    ]);
                } else {
                    Log::warning('Shipment Request Not Found for Label ID', [
                        'label_id' => $labelId,
                    ]);
                }

                return response()->json([
                    'message' => 'Label cancelled successfully',
                    'meta' => $responseBody['meta'],
                    'data' => $responseBody['data'],
                    'database_updated' => $shipmentRequest ? true : false,
                    'shipment_request_id' => $shipmentRequest->shipmentRequestID ?? null,
                ], 200);
            } else {
                return response()->json([
                    'message' => 'Failed to cancel label',
                    'meta' => $responseBody['meta'] ?? null,
                    'data' => $responseBody['data'] ?? null,
                    'raw_response' => $bodyContents,
                ], $statusCode);
            }

        } catch (\Exception $e) {
            Log::error('AfterShip Cancel Label Exception', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Exception occurred while cancelling label',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
