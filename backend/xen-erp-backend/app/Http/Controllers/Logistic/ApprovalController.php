<?php

namespace App\Http\Controllers\Logistic;

use App\Models\Logistic\ShipmentRequest;
use App\Models\Logistic\ShipmentRequestHistory;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ApprovalController
{
    use ValidatesRequests;

    protected $emailTemplateController;

    protected $createLabelController;

    public function __construct()
    {
        $this->emailTemplateController = new EmailTemplateController;
        $this->createLabelController = new CreateLabelController;
    }

    public function actionApprover(Request $request, $id)
    {
        $shipmentRequest = ShipmentRequest::find($id);

        $var_scope_type = $shipmentRequest ? strtolower($shipmentRequest->shipment_scope_type) : null;

        if (! $shipmentRequest) {
            return response()->json(['message' => 'Shipment Request not found'], 404);
        }

        $validatedData = $this->validate($request, [
            'send_status' => 'required|string|in:approver_approved,approver_rejected',
            'login_user_id' => 'required|integer',
            'login_user_name' => 'required|string|max:255',
            'login_user_mail' => 'required|email|max:255',
            'remark' => 'nullable|string',
        ]);

        DB::beginTransaction();

        try {
            $send_status = $validatedData['send_status'];
            $login_user_id = $validatedData['login_user_id'];
            $login_user_name = $validatedData['login_user_name'];
            $login_user_mail = strtolower($validatedData['login_user_mail']);
            $user_role = 'approver';
            $now = Carbon::now();
            $invoice_no = null;
            $responseMessage = null;
            $labelMessage = null;
            $labelInfo = null;
            $createLabelResponse = null;

            if ($send_status === 'approver_approved') {
                $year = Carbon::now()->format('Y'); // current year

                // Determine prefix based on scope
                if (str_starts_with($var_scope_type, 'domestic')) {
                    $prefix = 'XENDOM'.$year.'-';
                } elseif ($var_scope_type === 'international_import') {
                    $prefix = 'XENIM'.$year.'-';
                } elseif ($var_scope_type === 'international_export') {
                    $prefix = 'XENEX'.$year.'-';
                } elseif ($var_scope_type === 'international_global') {
                    $prefix = 'XENINT'.$year.'-';
                } else {
                    $prefix = 'XEN'.$year.'-';
                }

                // Get the latest invoice for this scope type in the current year
                $latestInvoice = ShipmentRequest::where('shipment_scope_type', $var_scope_type)
                    ->whereNotNull('invoice_no')
                    ->whereYear('created_date_time', $year)
                    ->orderByDesc('shipmentRequestID')
                    ->value('invoice_no');

                if ($latestInvoice) {
                    $parts = explode('-', $latestInvoice);
                    $lastNumber = isset($parts[1]) ? (int) ltrim($parts[1], '0') : 0;
                    $newNumber = $lastNumber + 1;
                } else {
                    $newNumber = 1; // first invoice for this year
                }

                $invoice_no = $prefix.str_pad($newNumber, 4, '0', STR_PAD_LEFT);
            }

            $shipmentRequestData = [
                'request_status' => $send_status,
                'history_count' => $shipmentRequest->history_count + 1,
                'approver_approved_date_time' => $send_status === 'approver_approved' ? $now : null,
                'approver_rejected_date_time' => $send_status === 'approver_rejected' ? $now : null,
                'invoice_no' => $invoice_no,
            ];

            if (! $shipmentRequest->update($shipmentRequestData)) {
                throw new \Exception('Failed to update shipment for approver approval.');
            }

            $shipmentRequest->refresh();

            $shipmentRequestHistoryData = [
                'shipment_request_created_date_time' => $shipmentRequest->created_date_time,
                'user_id' => $login_user_id,
                'user_name' => $login_user_name,
                'user_role' => $user_role,
                'status' => $send_status,
                'remark' => $validatedData['remark'] ?? null,
                'history_count' => $shipmentRequest->history_count,
                'shipment_request_id' => $shipmentRequest->shipmentRequestID,
                'history_record_date_time' => $now,
            ];

            $add_ShipmentRequestHistory = ShipmentRequestHistory::create($shipmentRequestHistoryData);

            if (! $add_ShipmentRequestHistory) {
                throw new \Exception('Failed to create shipment request history.');
            }

            $createLabel = [];
            $isLabelFailed = false;

            if ($send_status === 'approver_approved') {
                // Check if shipping service is FedEx and shipdate is 10+ days in future
                $skipCreateLabel = false;

                $chosenRate = $shipmentRequest->rates->firstWhere('chosen', '1');

                $shippingService = strtolower($chosenRate->shipper_account_slug ?? '');
                $pickUpDate = $shipmentRequest->pick_up_date ?? null;

                if ($shippingService === 'fedex' && $pickUpDate) {
                    $daysUntilShip = Carbon::now()->diffInDays(Carbon::parse($pickUpDate), false);
                    if ($daysUntilShip >= 10) {
                        $skipCreateLabel = true;
                        $shipmentRequest->label_status = 'scheduled';
                        Log::info('Skipping createLabel for FedEx shipment', [
                            'shipment_request_id' => $shipmentRequest->shipmentRequestID,
                            'shipping_service' => $shippingService,
                            'pick_up_date' => $pickUpDate,
                            'days_until_ship' => $daysUntilShip,
                        ]);
                    }
                }

                if (! $skipCreateLabel) {
                    $createLabel = $this->createLabelController->createLabel($shipmentRequest->shipmentRequestID);

                    $createLabelResponse = $createLabel->getData(true); // true returns associative array

                    $responseMessage = $createLabelResponse['message'] ?? null;
                    $labelMessage = $createLabelResponse['$create_label_response_body']['meta']['message'] ?? null;
                    $labelInfo = $createLabelResponse['$create_label_response_body']['meta']['details'][0]['info'] ?? null;

                    if (empty($createLabelResponse)) {
                        return response()->json([
                            'status' => 'error',
                            'approval_message' => 'Shipment request '.$send_status.' by '.$user_role.'.',
                            'response_message' => $responseMessage,
                            'label_message' => $labelMessage,
                            'label_info' => $labelInfo,
                            'create_label_response' => $createLabelResponse,
                            'shipment_request' => $shipmentRequest,
                            'shipment_request_history' => $add_ShipmentRequestHistory,
                        ], 500);
                    }

                    // For non-calculate_rates shipping options (grab_pickup, supplier_pickup),
                    // label ID and tracking numbers are not required - approval alone completes the request
                    $shippingOptions = strtolower($shipmentRequest->shipping_options ?? '');
                    $requiresLabelValidation = ($shippingOptions === 'calculate_rates');

                    // Check if label creation failed - either by error message or missing label/tracking data
                    $labelId = $createLabelResponse['$create_label_response_body']['data']['id'] ?? null;
                    $trackingNumbers = $createLabelResponse['$create_label_response_body']['data']['tracking_numbers'] ?? null;

                    // Only validate label ID and tracking numbers for calculate_rates shipping option
                    $isLabelFailed = ($responseMessage === 'Label created failed.');
                    if ($requiresLabelValidation) {
                        $isLabelFailed = $isLabelFailed || empty($labelId) || empty($trackingNumbers);
                    }

                    if ($isLabelFailed) {
                        $errorDetails = $labelMessage.($labelInfo ? ' - '.$labelInfo : '');

                        // Add context if label/tracking is missing but no explicit error
                        if ($responseMessage !== 'Label created failed.' && (empty($labelId) || empty($trackingNumbers))) {
                            $missingFields = [];
                            if (empty($labelId)) {
                                $missingFields[] = 'Label ID';
                            }
                            if (empty($trackingNumbers)) {
                                $missingFields[] = 'Tracking Number';
                            }
                            $errorDetails = $errorDetails ?: ('Missing: '.implode(', ', $missingFields));
                        }

                        // Revert status to requestor_requested so approver can retry
                        $shipmentRequest->request_status = 'requestor_requested';
                        $shipmentRequest->approver_approved_date_time = null;
                        $shipmentRequest->label_error_msg = $errorDetails;
                        $shipmentRequest->save();

                        $this->emailTemplateController->labelCreationFailedNotification(
                            $shipmentRequest->shipmentRequestID,
                            $errorDetails
                        );

                        Log::warning('Label creation failed after approval - status reverted to requestor_requested', [
                            'shipment_request_id' => $shipmentRequest->shipmentRequestID,
                            'error_message' => $errorDetails,
                            'label_id' => $labelId,
                            'tracking_numbers' => $trackingNumbers,
                        ]);
                    }

                    Log::info('Create Label response', [
                        'shipment_request_id' => $shipmentRequest->shipmentRequestID,
                        'create_label_response' => $createLabelResponse,
                    ]);
                }
            }

            // Update shipment request with success status
            $invoiceDate = Carbon::now()->toDateString();
            $invoiceDueDate = Carbon::parse($invoiceDate)->addDays(30)->toDateString();

            $shipmentRequest->invoice_date = $invoiceDate;
            $shipmentRequest->invoice_due_date = $invoiceDueDate;
            $shipmentRequest->save();

            // Only send regular approval email if label creation did not fail
            // (failure email is already sent separately to wawa@xenoptics.com)
            if (! $isLabelFailed) {
                $emailBody = $this->emailTemplateController->automateEmail(
                    $shipmentRequest,
                    $user_role,
                    $login_user_name,
                    $login_user_mail
                );

                if (! $emailBody) {
                    throw new \Exception('Failed to send email notification. (Action by Approver)');
                }
            }

            DB::commit();

            // Refresh to get latest status (may have been reverted if label failed)
            $shipmentRequest->refresh();

            // Log the action
            if ($isLabelFailed) {
                Log::info("Shipment request {$id} approval attempted but label creation failed - status reverted to requestor_requested");
            } else {
                Log::info("Shipment request {$id} {$send_status} by {$user_role} ({$login_user_name})");
            }

            return response()->json([
                'status' => $isLabelFailed ? 'label_failed' : 'success',
                'approval_message' => $isLabelFailed
                    ? 'Label creation failed. Status reverted to requestor_requested for retry.'
                    : 'Shipment request '.$send_status.' by '.$user_role.'.',
                'response_message' => $responseMessage,
                'label_message' => $labelMessage,
                'label_info' => $labelInfo,
                'create_label_response' => $createLabelResponse,
                'shipment_request' => $shipmentRequest,
                'shipment_request_history' => $add_ShipmentRequestHistory,
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    private function sanitizeBit($value)
    {
        return is_bool($value) ? ($value ? 1 : 0) : $value;
    }

    private function sanitizeNumeric($value)
    {
        return is_numeric($value) ? $value : null;
    }
}
