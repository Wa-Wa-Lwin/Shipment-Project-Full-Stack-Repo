<?php

namespace App\Http\Controllers\Logistic;

use App\Http\Controllers\Controller;
use App\Models\Logistic\ShipmentRequest;

class EmailTemplateController extends Controller
{
    /**
     * Check if requestor is the developer and override recipients for testing.
     * When the requestor matches the configured developer_test_email,
     * all emails go only to them instead of normal recipients.
     *
     * @param  array  $recipients  Original recipient list
     * @param  string|null  $requestorEmail  The requestor's email address
     * @return array Modified recipient list (developer only, or original)
     */
    private function applyDeveloperTestOverride(array $recipients, ?string $requestorEmail): array
    {
        $developerEmail = config('logistic.developer_test_email');

        if ($developerEmail && $requestorEmail && strtolower(trim($requestorEmail)) === strtolower(trim($developerEmail))) {
            return [$developerEmail];
        }

        return $recipients;
    }

    public function automateEmail(
        $shipmentRequest,
        $role,
        $login_user_name,
        $login_user_mail
    ) {

        $send_status = $shipmentRequest->request_status;
        $id = $shipmentRequest->shipmentRequestID;
        $value_approver_approved_date_time = $shipmentRequest->approver_approved_date_time;
        $value_approver_rejected_date_time = $shipmentRequest->approver_rejected_date_time;

        $sendTo = [$shipmentRequest->created_user_mail, $login_user_mail];

        // Load configurable email lists from config/logistic.php (backed by .env)
        // Read lists from config; fall back to empty arrays if env not set
        $logisticTeamEmails = config('logistic.logistic_team_emails', []);
        $warehouseEmails = config('logistic.warehouse_emails', []);

        $header_background_color = '#007BFF';
        switch ($send_status) {
            case 'requestor_requested':
                $sendTo[] = $shipmentRequest->approver_user_mail;
                $sendSubject = 'XenLogistics | New Shipment Request - '.$id.' - Requestor';
                $statusMessage = 'The '.$role.' : '.$login_user_name.' has requested the shipment request: '.
                    $id.'. Please review it.';
                break;

            case 'request_to_logistic':
                // add logistic team and warehouse emails from config
                $sendTo = array_merge($sendTo, $logisticTeamEmails);
                $sendTo = array_merge($sendTo, $warehouseEmails);
                $sendSubject = 'XenLogistics | Fill Missing Fields for New Shipment Request - '.$id.' - Requestor';
                $statusMessage = 'The '.$role.' : '.$login_user_name.' has requested the shipment request: '.
                    $id.' with some missing fields. Please review it and fill them.';
                break;

            case 'approver_approved':
                // add logistic team and warehouse emails so they can prepare the shipment
                $sendTo = array_merge($sendTo, $logisticTeamEmails);
                $sendTo = array_merge($sendTo, $warehouseEmails);
                $sendSubject = 'Local XenLogistics : Approver Approved - '.$id.' | Label Generated. ';
                $statusMessage = 'The '.$role.' : '.$login_user_name.' has approved the shipment request: '.
                    $id.' Requested by '.$shipmentRequest->created_user_name.'.  <b>The label is also created.</b> Please review it.';
                break;

            case 'approver_rejected':
                $header_background_color = '#FF0000';
                $sendSubject = 'Local XenLogistics : Approver Rejected - '.$id;
                $statusMessage = 'The '.$role.' : '.$login_user_name.' has rejected the shipment request: '.
                    $id.' Requested by '.$shipmentRequest->created_user_name.'. Please review it.';
                break;

            case 'cancelled':
                $header_background_color = '#6c757d';
                $sendSubject = 'XenLogistics | Shipment Request Cancelled - '.$id;
                $statusMessage = 'The shipment request '.$id.' has been cancelled by '.$login_user_name.'.';
                break;

            case 'logistic_updated':
            case 'logistic_edited':
                $sendTo[] = $shipmentRequest->approver_user_mail;
                $sendSubject = 'XenLogistics | New Shipment Request - '.$id.' - Logistic';
                $statusMessage = 'The '.$role.' : '.$login_user_name.' has filled the necessary data and sent the shipment request: '.
                    $id.'<br>Please review it.';
                break;

            default:
                $sendSubject = 'Local XenLogistics : Shipment Edited - '.$id;
                $statusMessage = 'Shipment request status edited by '.$role.' : '.$login_user_name.'.';
                break;
        }

        $formattedDate_Created = date('j F Y (l)', strtotime($shipmentRequest->created_date_time));

        $unformattedDate_Approver = null;

        if (
            ! is_null($value_approver_approved_date_time)
            && date('Y', strtotime($value_approver_approved_date_time)) > 2000
        ) {

            $unformattedDate_Approver = $value_approver_approved_date_time;
        } elseif ($send_status === 'approver_approved') {

            $unformattedDate_Approver = $value_approver_approved_date_time;
        } elseif ($send_status === 'approver_rejected') {

            $unformattedDate_Approver = $value_approver_rejected_date_time;
        }

        $formattedDate_Approver = date('j F Y (l)', strtotime($unformattedDate_Approver));

        $weblink = env('APP_URL', 'https://shipment.xeno.lan').'/xeno-shipment/shipment/'.$id;

        $var_scope_type = str_replace('_', ' ', strtoupper($shipmentRequest->shipment_scope_type));

        $sendBody = '
        <html>
            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        background-color: #f5f7fa;
                        color: #333;
                        padding: 20px;
                        border-bottom: 1px solid #eee;
                    }
                    .container {
                        background-color: #ffffff;
                        border-radius: 8px;
                        padding: 25px;
                        max-width: 600px;
                        margin: auto;
                        border: 1px solid #e0e0e0;
                        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
                    }
                    h2 {
                        color: #2c3e50;
                        margin-bottom: 10px;
                    }
                    .info-block {
                        margin: 15px 0;
                        padding: 12px;
                        background-color: #f0f8ff;
                        border-left: 4px solid #007BFF;
                        border-radius: 4px;
                    }
                    .label {
                        font-weight: bold;
                        color: #444;
                        display: inline-block;
                        width: 180px;
                    }
                    .footer {
                        margin-top: 30px;
                        font-size: 12px;
                        color: #777;
                        text-align: center;
                    }
                </style>
            </head>
            <body>'.$statusMessage.'
                <p>
                    <strong>Shipment Request ID: </strong> '.$id.' 
                    <a href="'.$weblink.'"> (Go To Website) </a>
                    <br><br>
                    <strong>Requestor: </strong> '.$shipmentRequest->created_user_name.'<br>
                    <strong>Requested Date: </strong> '.$formattedDate_Created.'<br>
                    <strong>Topic: </strong> '.$shipmentRequest->topic.'<br>
                    <strong>Scope: </strong> '.$var_scope_type.'<br>
                    <strong>Pickup Date: </strong> '.date('j F Y (l)', strtotime($shipmentRequest->pick_up_date)).'<br>
                </p>
                <div class="info-block">
                    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                        <thead>
                            <tr style="background-color:'.$header_background_color.'; color: #fff;">
                                <th style="padding: 10px; border: 1px solid #ccc;">Requestor</th>
                                <th style="padding: 10px; border: 1px solid #ccc;">Approver</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style="padding: 10px; border: 1px solid #ccc;">'.$shipmentRequest->created_user_name.'</td>
                                <td style="padding: 10px; border: 1px solid #ccc;">'.$shipmentRequest->approver_user_name.'</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; border: 1px solid #ccc;"><strong>Requested On</strong><br>'.$formattedDate_Created.'</td>
                                <td style="padding: 10px; border: 1px solid #ccc;">'.
                                (! is_null($value_approver_approved_date_time) && date('Y', strtotime($value_approver_approved_date_time)) > 2000
                                ? '<strong>Approved On</strong><br>'.$formattedDate_Approver
                                : ($send_status === 'approver_approved'
                                ? '<strong>Approved On</strong><br>'.$formattedDate_Approver
                                : ($send_status === 'approver_rejected'
                                ? '<strong>Rejected On</strong><br>'.$formattedDate_Approver
                                : '<strong>Waiting</strong>'))).
                                '</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </body>
        </html>';

        $error = null;

        // Filter out null/empty email addresses and remove duplicates
        $sendTo = array_values(array_unique(array_filter($sendTo, function ($email) {
            return ! empty($email) && filter_var($email, FILTER_VALIDATE_EMAIL);
        })));

        // Developer testing override: if requestor is wawa@xenoptics.com, send only to her
        $sendTo = $this->applyDeveloperTestOverride($sendTo, $shipmentRequest->created_user_mail);

        // Ensure we have at least one recipient
        if (empty($sendTo)) {
            throw new \Exception('No valid recipient email addresses found for shipment request notification.');
        }

        $sendResult = MailSenderController::send(
            $sendTo,
            $sendSubject,
            $sendBody,
            $error
        );

        return $sendResult;
    }

    public function warehouseNotification($id)
    {
        $shipmentRequest = ShipmentRequest::find($id);
        if (! $shipmentRequest) {
            return response()->json(['message' => 'Shipment Request not found'], 404);
        }

        // Use configured warehouse emails (comma-separated in .env -> WAREHOUSE_EMAILS)
        $sendTo = config('logistic.warehouse_emails', ['wawa@xenoptics.com']);

        $sendSubject = 'XenLogistics | Warehouse Notification - Shipment Request '.$id;

        // Format dates
        $formattedRequested = date('j F Y (l) H:i', strtotime($shipmentRequest->created_date_time));

        $approvedDate = $shipmentRequest->approver_approved_date_time
            ? date('j F Y (l) H:i', strtotime($shipmentRequest->approver_approved_date_time))
            : 'Waiting';

        $pickupDate = $shipmentRequest->pick_up_date
            ? date('j F Y (l)', strtotime($shipmentRequest->pick_up_date))
            : 'Not Set';

        $pickupTime = ($shipmentRequest->pick_up_start_time && $shipmentRequest->pick_up_end_time)
            ? substr($shipmentRequest->pick_up_start_time, 0, 5).' - '.substr($shipmentRequest->pick_up_end_time, 0, 5)
            : 'Not Set';

        $weblink = env('APP_URL', 'https://shipment.xeno.lan').'/xeno-shipment/shipment/'.$id;

        $var_scope_type = str_replace('_', ' ', strtoupper($shipmentRequest->shipment_scope_type));

        // -----------------------
        //     EMAIL BODY HTML
        // -----------------------
        $sendBody = '
        <html>
            <head>
                <style>
                    body { font-family: Arial; background:#f5f7fa; padding:20px; }
                    .container { background:white; padding:20px; border-radius:8px; max-width:600px; margin:auto; }
                    .label { font-weight:bold; width:180px; display:inline-block; }
                    .header { font-size:18px; margin-bottom:10px; }
                    .info-block { background:#f0f8ff; padding:12px; border-left:4px solid #007BFF; margin-top:15px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h2 class="header">Warehouse Shipment Notification</h2>

                    <p>
                        <span class="label">Shipment ID:</span> '.$id.' 
                        <a href="'.$weblink.'"> (View Shipment)</a><br>

                        <span class="label">Requestor:</span> '.$shipmentRequest->created_user_name.'<br>
                        <span class="label">Requested Date:</span> '.$formattedRequested.'<br>

                        <span class="label">Approver:</span> '.$shipmentRequest->approver_user_name.'<br>
                        <span class="label">Approved Date:</span> '.$approvedDate.'<br>

                        <span class="label">Shipment Scope:</span> '.$var_scope_type.'<br>
                        <span class="label">Pickup Date:</span> '.$pickupDate.' '.$pickupTime.'<br>
                    </p>

                    <div class="info-block">
                        Please prepare the requested items for warehouse processing.
                    </div>
                </div>
            </body>
        </html>';

        // Send email
        $error = null;

        // Developer testing override: if requestor is wawa@xenoptics.com, send only to her
        $sendTo = $this->applyDeveloperTestOverride($sendTo, $shipmentRequest->created_user_mail);

        $sendResult = MailSenderController::send(
            $sendTo,
            $sendSubject,
            $sendBody,
            $error
        );

        // If the email failed
        if (! $sendResult) {
            return response()->json([
                'message' => 'Failed to send warehouse notification email',
                'error' => $error,
            ], 500);
        }

        // If success
        return response()->json([
            'message' => 'Warehouse notification email sent successfully',
            'shipmentRequestID' => $id,
        ], 200);
    }

    public function labelCreationFailedNotification($id, $errorMessage = null)
    {
        $shipmentRequest = ShipmentRequest::find($id);
        if (! $shipmentRequest) {
            return false;
        }

        $sendTo = ['wawa@xenoptics.com'];

        $sendSubject = 'Approver Approval Fail - '.$id;

        $weblink = env('APP_URL', 'https://shipment.xeno.lan').'/xeno-shipment/shipment/'.$id;

        $var_scope_type = str_replace('_', ' ', strtoupper($shipmentRequest->shipment_scope_type));

        $formattedRequested = date('j F Y (l) H:i', strtotime($shipmentRequest->created_date_time));

        $pickupDate = $shipmentRequest->pick_up_date
            ? date('j F Y (l)', strtotime($shipmentRequest->pick_up_date))
            : 'Not Set';

        // Email body HTML
        $sendBody = '
        <html>
            <head>
                <style>
                    body { font-family: Arial; background:#f5f7fa; padding:20px; }
                    .container { background:white; padding:20px; border-radius:8px; max-width:600px; margin:auto; }
                    .label { font-weight:bold; width:180px; display:inline-block; }
                    .header { font-size:18px; margin-bottom:10px; color:#dc3545; }
                    .info-block { background:#f8d7da; padding:12px; border-left:4px solid #dc3545; margin-top:15px; }
                    .error-block { background:#fff3cd; padding:12px; border-left:4px solid #ffc107; margin-top:15px; font-family: monospace; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h2 class="header">Label Creation Failed After Approval</h2>

                    <p>
                        <span class="label">Shipment Request ID:</span> '.$id.'
                        <a href="'.$weblink.'"> (View Shipment)</a><br><br>

                        <span class="label">Requestor:</span> '.$shipmentRequest->created_user_name.'<br>
                        <span class="label">Requested Date:</span> '.$formattedRequested.'<br>
                        <span class="label">Approver:</span> '.$shipmentRequest->approver_user_name.'<br>
                        <span class="label">Shipment Scope:</span> '.$var_scope_type.'<br>
                        <span class="label">Pickup Date:</span> '.$pickupDate.'<br>
                    </p>

                    <div class="info-block">
                        <strong>Issue:</strong> The shipment request was approved but label creation failed.
                    </div>

                    '.($errorMessage ? '<div class="error-block"><strong>Error Details:</strong><br>'.htmlspecialchars($errorMessage).'</div>' : '').'
                </div>
            </body>
        </html>';

        // Send email
        $error = null;

        // Developer testing override: if requestor is wawa@xenoptics.com, send only to her
        $sendTo = $this->applyDeveloperTestOverride($sendTo, $shipmentRequest->created_user_mail);

        $sendResult = MailSenderController::send(
            $sendTo,
            $sendSubject,
            $sendBody,
            $error
        );

        return $sendResult;
    }

    public function requestorRequestedMail($id)
    {
        $shipmentRequest = ShipmentRequest::find($id);
        if (! $shipmentRequest) {
            return response()->json(['message' => 'Shipment Request not found'], 404);
        }

        // Send to approver and requestor
        $sendTo = [
            $shipmentRequest->approver_user_mail,
            $shipmentRequest->created_user_mail,
        ];

        // Filter out null/empty email addresses and remove duplicates
        $sendTo = array_values(array_unique(array_filter($sendTo, function ($email) {
            return ! empty($email) && filter_var($email, FILTER_VALIDATE_EMAIL);
        })));

        // Developer testing override: if requestor is wawa@xenoptics.com, send only to her
        $sendTo = $this->applyDeveloperTestOverride($sendTo, $shipmentRequest->created_user_mail);

        // Ensure we have at least one recipient
        if (empty($sendTo)) {
            return response()->json([
                'message' => 'No valid recipient email addresses found',
                'error' => 'Approver and requestor emails are missing or invalid',
            ], 400);
        }

        $sendSubject = 'XenLogistics | New Shipment Request - '.$id.' - Awaiting Approval';

        // Format dates
        $formattedRequested = date('j F Y (l) H:i', strtotime($shipmentRequest->created_date_time));

        $pickupDate = $shipmentRequest->pick_up_date
            ? date('j F Y (l)', strtotime($shipmentRequest->pick_up_date))
            : 'Not Set';

        $pickupTime = ($shipmentRequest->pick_up_start_time && $shipmentRequest->pick_up_end_time)
            ? substr($shipmentRequest->pick_up_start_time, 0, 5).' - '.substr($shipmentRequest->pick_up_end_time, 0, 5)
            : 'Not Set';

        $weblink = env('APP_URL', 'https://shipment.xeno.lan').'/xeno-shipment/shipment/'.$id;

        $var_scope_type = str_replace('_', ' ', strtoupper($shipmentRequest->shipment_scope_type));

        // Email body HTML
        $sendBody = '
        <html>
            <head>
                <style>
                    body { font-family: Arial; background:#f5f7fa; padding:20px; }
                    .container { background:white; padding:20px; border-radius:8px; max-width:600px; margin:auto; }
                    .label { font-weight:bold; width:180px; display:inline-block; }
                    .header { font-size:18px; margin-bottom:10px; color:#007BFF; }
                    .info-block { background:#fff3cd; padding:12px; border-left:4px solid #ffc107; margin-top:15px; }
                    .status-badge { background:#ffc107; color:#000; padding:5px 10px; border-radius:4px; font-weight:bold; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h2 class="header">New Shipment Request - Awaiting Approval</h2>

                    <p>
                        <span class="label">Shipment ID:</span> '.$id.'
                        <a href="'.$weblink.'"> (View & Review Request)</a><br><br>
                        <span class="label">Status:</span> <span class="status-badge">Pending Approval</span><br><br>

                        <span class="label">Requestor:</span> '.$shipmentRequest->created_user_name.'<br>
                        <span class="label">Requested Date:</span> '.$formattedRequested.'<br>

                        <span class="label">Approver:</span> '.$shipmentRequest->approver_user_name.'<br>

                        <span class="label">Topic:</span> '.($shipmentRequest->topic ?? 'N/A').'<br>
                        <span class="label">Shipment Scope:</span> '.$var_scope_type.'<br>
                        <span class="label">Pickup Date:</span> '.$pickupDate.' '.$pickupTime.'<br>
                    </p>

                    <div class="info-block">
                        <strong>Action Required:</strong> This shipment request requires approval from <strong>'.$shipmentRequest->approver_user_name.'</strong>.
                        Please review the request and take appropriate action.
                    </div>
                </div>
            </body>
        </html>';

        // Send email
        $error = null;

        $sendResult = MailSenderController::send(
            $sendTo,
            $sendSubject,
            $sendBody,
            $error
        );

        // If the email failed
        if (! $sendResult) {
            return response()->json([
                'message' => 'Failed to send requestor requested notification email',
                'error' => $error,
            ], 500);
        }

        // If success
        return response()->json([
            'message' => 'Requestor requested notification email sent successfully',
            'shipmentRequestID' => $id,
            'recipients' => $sendTo,
        ], 200);
    }
}
