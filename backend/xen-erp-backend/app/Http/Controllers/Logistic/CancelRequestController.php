<?php

namespace App\Http\Controllers\Logistic;

use App\Http\Controllers\Controller;
use App\Models\Logistic\ShipmentRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class CancelRequestController extends Controller
{
    protected $emailTemplateController;

    public function __construct()
    {
        $this->emailTemplateController = new EmailTemplateController;
    }

    public function cancelRequest(Request $request, $id)
    {
        $shipmentRequest = ShipmentRequest::find($id);

        if (! $shipmentRequest) {
            return response()->json(['message' => 'Shipment Request not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            // Basic info
            'send_status' => 'required|string|in:cancelled',
            'login_user_id' => 'required|integer',
            'login_user_name' => 'required|string|max:255',
            'login_user_mail' => 'required|email|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $validatedData = $validator->validated();
        $time_now = \Illuminate\Support\Carbon::now();

        DB::beginTransaction();

        try {
            // Update main shipment request
            $shipmentRequest->update([
                'request_status' => $validatedData['send_status'],
            ]);

            // Create history record for logistics update
            $shipmentRequest->shipmentRequestHistories()->create([
                'shipment_request_id' => $shipmentRequest->id,
                'shipment_request_created_date_time' => $shipmentRequest->created_date_time,
                'user_id' => $validatedData['login_user_id'],
                'user_name' => $validatedData['login_user_name'],
                'status' => $validatedData['send_status'],
                'remark' => 'Shipment Request is cancelled.',
                'history_count' => $shipmentRequest->history_count + 1,
                'history_record_date_time' => $time_now,
            ]);

            // Send email
            $sendResult = $this->emailTemplateController->automateEmail(
                $shipmentRequest,
                'requestor',
                $validatedData['login_user_name'],
                $validatedData['login_user_mail']
            );

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Shipment request is cancelled successfully',
                'data' => [
                    'shipment_request' => $shipmentRequest,
                    'updated_at' => $time_now->toISOString(),
                ],
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update shipment request logistics information.',
                'error_detail' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }
}
