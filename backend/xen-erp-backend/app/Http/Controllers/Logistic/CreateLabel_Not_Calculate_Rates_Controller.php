<?php

namespace App\Http\Controllers\Logistic;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

class CreateLabel_Not_Calculate_Rates_Controller
{
    protected $createPickupController;

    protected $emailTemplateController;

    public function __construct($createPickupController = null, $emailTemplateController = null)
    {
        $this->createPickupController = $createPickupController ?? app(CreatePickupController::class);
        $this->emailTemplateController = $emailTemplateController ?? new EmailTemplateController;
    }

    /**
     * Handle shipments where shipping_options != 'calculate_rates'.
     * Generates invoice, optionally creates pickup, notifies warehouse, and returns JSON response.
     *
     * @param  \App\Models\Logistic\ShipmentRequest  $shipmentRequest
     * @return \Illuminate\Http\JsonResponse
     */
    public function handle($shipmentRequest)
    {
        $invoiceDate = Carbon::now()->toDateString();
        $invoiceDueDate = Carbon::parse($invoiceDate)->addDays(30)->toDateString();

        if (empty($shipmentRequest->invoice_no)) {
            $shipmentRequest->invoice_no = 'INV-'.$shipmentRequest->shipmentRequestID.'-'.time();
        }

        $shipmentRequest->invoice_date = $invoiceDate;
        $shipmentRequest->invoice_due_date = $invoiceDueDate;
        $shipmentRequest->label_status = 'created';
        $shipmentRequest->error_msg = '-';
        $shipmentRequest->save();

        // Create pickup immediately for non-FedEx or for FedEx with today/tomorrow pickup dates
        try {
            $create_pick_up = $this->createPickupController->createPickup($shipmentRequest->shipmentRequestID);
            if (! $create_pick_up) {
                $message = 'Invoice generated but pickup creation failed.';

                return response()->json([
                    'message' => $message,
                    'shipment_request_id' => $shipmentRequest->shipmentRequestID,
                    'shipment_request' => $shipmentRequest,
                ], 200);
            }
        } catch (\Exception $e) {
            Log::warning('Short-circuit: Pickup creation threw exception', [
                'shipment_request_id' => $shipmentRequest->shipmentRequestID,
                'error' => $e->getMessage(),
            ]);
        }

        // Notify warehouse (best-effort)
        try {
            if ($this->emailTemplateController) {
                $result = $this->emailTemplateController->warehouseNotification($shipmentRequest->shipmentRequestID);
                Log::info('Short-circuit: Warehouse notification sent', [
                    'shipment_request_id' => $shipmentRequest->shipmentRequestID,
                    'result' => $result,
                ]);
            }
        } catch (\Exception $e) {
            Log::warning('Short-circuit: Failed to send warehouse notification', [
                'shipment_request_id' => $shipmentRequest->shipmentRequestID,
                'error' => $e->getMessage(),
            ]);
        }

        return response()->json([
            'message' => 'Invoice generated and warehouse notified. Label creation skipped due to shipping_options setting.',
            'shipment_request_id' => $shipmentRequest->shipmentRequestID,
            'invoice_no' => $shipmentRequest->invoice_no,
            'invoice_date' => $shipmentRequest->invoice_date,
            'invoice_due_date' => $shipmentRequest->invoice_due_date,
        ], 200);
    }
}
