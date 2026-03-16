<?php

namespace App\Http\Controllers\Logistic;

use App\Http\Controllers\Controller;
use App\Models\Logistic\Parcel;
use App\Models\Logistic\ParcelItem;
use App\Models\Logistic\Rate;
use App\Models\Logistic\ShipFrom;
use App\Models\Logistic\ShipmentRequest;
use App\Models\Logistic\ShipmentRequestHistory;
use App\Models\Logistic\ShipTo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class UpdateRequestController extends Controller
{
    protected $emailTemplateController;

    public function __construct()
    {
        $this->emailTemplateController = new EmailTemplateController;
    }

    private function sanitizeNumeric($value)
    {
        return is_numeric($value) ? $value : null;
    }

    private function sanitizeBit($value)
    {
        if ($value === true || $value === 1 || $value === '1') {
            return 1;
        }
        if ($value === false || $value === 0 || $value === '0') {
            return 0;
        }

        return null;
    }

    public function updateRequest(Request $request, $id)
    {
        $shipmentRequest = ShipmentRequest::with(
            'shipmentRequestHistories',
            'parcels',
            'parcels.items',
            'shipTo',
            'shipFrom',
            'rates',
            'invoiceDatas'
        )->find($id);

        if (! $shipmentRequest) {
            return response()->json(['message' => 'Shipment Request not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            // Basic info
            'send_status' => 'required|string|in:requestor_edited,logistic_edited,approver_edited,fallback_error',
            'login_user_id' => 'required|integer',
            'login_user_name' => 'required|string|max:255',
            'login_user_mail' => 'required|email|max:255',

            // Approver Info
            'approver_user_id' => 'required|integer',
            'approver_user_name' => 'required|string|max:255',
            'approver_user_mail' => 'required|email|max:255',

            // Shipment details
            'service_options' => 'required|string|max:255',
            'send_to' => 'nullable|string|max:10',
            'urgent_reason' => 'nullable|string|max:255',
            'remark' => 'nullable|string|max:255',
            'topic' => 'required|string|max:255',
            'po_number' => 'nullable|string|max:255',
            'po_date' => 'nullable|string|max:255',
            'other_topic' => 'nullable|string|max:255',
            'due_date' => 'required|date',

            // Parcels
            'parcels' => 'required|array',
            'parcels.*.box_type_name' => 'required|string|max:50',
            'parcels.*.width' => 'required|numeric',
            'parcels.*.height' => 'required|numeric',
            'parcels.*.depth' => 'required|numeric',
            'parcels.*.dimension_unit' => 'required|string|max:10',
            'parcels.*.weight_value' => 'required|numeric',
            'parcels.*.net_weight_value' => 'required|numeric',
            'parcels.*.parcel_weight_value' => 'required|numeric',
            'parcels.*.weight_unit' => 'required|string|max:10',
            'parcels.*.description' => 'nullable|string|max:255',
            'parcels.*.parcel_items' => 'required|array',
            'parcels.*.parcel_items.*.description' => 'nullable|string|max:255',
            'parcels.*.parcel_items.*.quantity' => 'required|integer',
            'parcels.*.parcel_items.*.price_currency' => 'nullable|string|max:10',
            'parcels.*.parcel_items.*.price_amount' => 'nullable|numeric',
            'parcels.*.parcel_items.*.item_id' => 'nullable|string|max:50',
            'parcels.*.parcel_items.*.origin_country' => 'nullable|string|max:50',
            'parcels.*.parcel_items.*.weight_unit' => 'nullable|string|max:10',
            'parcels.*.parcel_items.*.weight_value' => 'nullable|numeric',
            'parcels.*.parcel_items.*.sku' => 'nullable|string|max:255',
            'parcels.*.parcel_items.*.material_code' => 'nullable|string|max:255',
            'parcels.*.parcel_items.*.hs_code' => 'nullable|string|max:255',
            'parcels.*.parcel_items.*.return_reason' => 'nullable|string|max:255',

            // ShipTo
            'ship_to_country' => 'required|string|max:100',
            'ship_to_contact_name' => 'required|string|max:100',
            'ship_to_phone' => 'nullable|string|max:50',
            'ship_to_fax' => 'nullable|string|max:50',
            'ship_to_email' => 'nullable|email|max:100',
            'ship_to_company_name' => 'nullable|string|max:255',
            'ship_to_company_url' => 'nullable|string|max:255',
            'ship_to_street1' => 'nullable|string|max:255',
            'ship_to_street2' => 'nullable|string|max:255',
            'ship_to_street3' => 'nullable|string|max:255',
            'ship_to_city' => 'nullable|string|max:100',
            'ship_to_state' => 'nullable|string|max:100',
            'ship_to_postal_code' => 'required|string|max:20',
            'ship_to_tax_id' => 'nullable|string|max:50',
            'ship_to_eori_number' => 'nullable|string|max:50',

            // ShipFrom
            'ship_from_country' => 'required|string|max:100',
            'ship_from_contact_name' => 'required|string|max:100',
            'ship_from_phone' => 'nullable|string|max:50',
            'ship_from_fax' => 'nullable|string|max:50',
            'ship_from_email' => 'nullable|email|max:100',
            'ship_from_company_name' => 'nullable|string|max:255',
            'ship_from_company_url' => 'nullable|string|max:255',
            'ship_from_street1' => 'nullable|string|max:255',
            'ship_from_street2' => 'nullable|string|max:255',
            'ship_from_street3' => 'nullable|string|max:255',
            'ship_from_city' => 'nullable|string|max:100',
            'ship_from_state' => 'nullable|string|max:100',
            'ship_from_postal_code' => 'required|string|max:20',
            'ship_from_tax_id' => 'nullable|string|max:50',
            'ship_from_eori_number' => 'nullable|string|max:50',

            // Rates
            'rates' => 'nullable|array',
            'rates.*.shipper_account_id' => 'nullable|string|max:255',
            'rates.*.shipper_account_slug' => 'nullable|string|max:255',
            'rates.*.shipper_account_description' => 'nullable|string|max:255',
            'rates.*.service_type' => 'nullable|string|max:100',
            'rates.*.service_name' => 'nullable|string|max:255',
            'rates.*.pickup_deadline' => 'nullable|date',
            'rates.*.booking_cut_off' => 'nullable|date',
            'rates.*.delivery_date' => 'nullable|date',
            'rates.*.transit_time' => 'nullable|string|max:255',
            'rates.*.error_message' => 'nullable|string',
            'rates.*.info_message' => 'nullable|string',
            'rates.*.charge_weight_value' => 'nullable|numeric',
            'rates.*.charge_weight_unit' => 'nullable|string|max:10',
            'rates.*.total_charge_amount' => 'nullable|numeric',
            'rates.*.total_charge_currency' => 'nullable|string|max:10',
            'rates.*.chosen' => 'nullable|boolean',
            'rates.*.detailed_charges' => 'nullable|string|max:255',

            // Pickup & Insurance
            'pick_up_status' => 'nullable|boolean',
            'pick_up_date' => 'nullable|date',
            'pick_up_start_time' => 'nullable|date_format:H:i',
            'pick_up_end_time' => 'nullable|date_format:H:i',
            'pick_up_instructions' => 'nullable|string|max:255',

            'insurance_enabled' => 'nullable|boolean',
            'insurance_insured_value_amount' => 'nullable|numeric',
            'insurance_insured_value_currency' => 'nullable|string|max:10',

            'customs_purpose' => 'nullable|string|max:255',
            'customs_terms_of_trade' => 'nullable|string|max:255',
            'payment_terms' => 'nullable|string|max:255',
            'grab_rate_amount' => 'nullable|numeric',
            'grab_rate_currency' => 'nullable|string|max:10',
            'recipient_shipper_account_number' => 'nullable|string|max:255',
            'recipient_shipper_account_country_code' => 'nullable|string|max:10',
            'billing' => 'nullable|string|in:shipper,third_party,recipient',
            'customize_invoice_file' => 'nullable|file|mimes:pdf|max:10240', // 10MB max
            'customize_invoice_url' => 'nullable|string|max:500',
            'use_customize_invoice' => 'nullable|boolean',
            'shipping_options' => 'nullable|string|in:calculate_rates,grab_pickup,supplier_pickup,manual_input',
            'shipment_scope_type' => 'nullable|string|max:500',
            'testing' => 'nullable|boolean',

            'shipment_by_note' => 'nullable|string', // for sales invoices , logistic can fill in the shiment by note for the request, and it will be printed in the commercial invoice

        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $validatedData = $validator->validated();

        // Handle custom invoice file upload
        if ($request->hasFile('customize_invoice_file')) {
            $file = $request->file('customize_invoice_file');

            // Generate unique filename to avoid conflicts
            $originalName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
            $extension = $file->getClientOriginalExtension();
            $filename = $originalName.'_'.time().'.'.$extension;

            // Move file to public/uploads/invoices
            $file->move(public_path('uploads/invoices'), $filename);

            // Store relative URL path
            $validatedData['customize_invoice_url'] = 'uploads/invoices/'.$filename;
        } elseif (isset($validatedData['customize_invoice_url']) && ! empty($validatedData['customize_invoice_url'])) {

        } else {
            // If use_customize_invoice is false or no file/url provided, clear the URL
            if (isset($validatedData['use_customize_invoice']) && ! $validatedData['use_customize_invoice']) {
                $validatedData['customize_invoice_url'] = null;
            }
        }

        $time_now = \Illuminate\Support\Carbon::now();
        DB::beginTransaction();

        try {
            // Update ShipmentRequest
            $fieldsToCheck = [
                'approver_user_id',
                'approver_user_name',
                'approver_user_mail',

                'service_options',
                'send_to',
                'urgent_reason',
                'remark',
                'topic',
                'po_number',
                'po_date',
                'other_topic',
                'due_date',
                'pick_up_status',
                'pick_up_date',
                'pick_up_start_time',
                'pick_up_end_time',
                'pick_up_instructions',
                'insurance_enabled',
                'insurance_insured_value_amount',
                'insurance_insured_value_currency',
                'customs_purpose',
                'customs_terms_of_trade',
                'payment_terms',
                'grab_rate_amount',
                'grab_rate_currency',
                'recipient_shipper_account_number',
                'recipient_shipper_account_country_code',
                'billing',
                'use_customize_invoice',
                'customize_invoice_url',
                'shipping_options',
                'testing',

                'shipment_by_note',
            ];

            foreach ($fieldsToCheck as $field) {
                if (array_key_exists($field, $validatedData) && $validatedData[$field] != $shipmentRequest->$field) {
                    $shipmentRequest->$field = $validatedData[$field];
                }
            }

            $shipmentRequest->shipment_scope_type = $validatedData['shipment_scope_type'];
            $shipmentRequest->request_status = $validatedData['send_status'];
            $shipmentRequest->save();

            // requestor_edited,logistic_edited,approver_edited,fallback_error
            if ($validatedData['send_status'] === 'logistic_edited') {
                $user_role = 'logistic';
            } elseif ($validatedData['send_status'] === 'approver_edited') {
                $user_role = 'approver';
            } elseif ($validatedData['send_status'] === 'requestor_edited') {
                $user_role = 'requestor';
            }

            // ShipmentRequestHistory
            $historyData = [
                'shipment_request_id' => $shipmentRequest->shipmentRequestID,
                'shipment_request_created_date_time' => $shipmentRequest->created_date_time,
                'user_id' => $validatedData['login_user_id'],
                'user_name' => $validatedData['login_user_name'],
                'user_role' => $user_role,
                'status' => $validatedData['send_status'],
                'remark' => $validatedData['remark'] ?? null,
                'history_count' => $shipmentRequest->history_count + 1,
                'history_record_date_time' => $time_now,
            ];
            $shipmentRequestHistory = ShipmentRequestHistory::create($historyData);

            // Delete + recreate Parcels & Items
            $shipmentRequest->parcels()->each(function ($parcel) {
                $parcel->items()->delete();
                $parcel->delete();
            });

            foreach ($validatedData['parcels'] as $parcelData) {
                $parcelData['shipment_request_id'] = $shipmentRequest->shipmentRequestID;
                $parcel = Parcel::create($parcelData);

                foreach ($parcelData['parcel_items'] ?? [] as $itemData) {
                    $itemData['parcel_id'] = $parcel->parcelID;
                    ParcelItem::create($itemData);
                }
            }

            // ShipTo - dynamic mapping
            $shipTo = ShipTo::firstOrNew(['shipment_request_id' => $shipmentRequest->shipmentRequestID]);
            foreach ($validatedData as $key => $value) {
                if (str_starts_with($key, 'ship_to_')) {
                    $column = substr($key, 8);
                    $shipTo->$column = $value;
                }
            }
            $shipTo->save();

            // ShipFrom - dynamic mapping
            $shipFrom = ShipFrom::firstOrNew(['shipment_request_id' => $shipmentRequest->shipmentRequestID]);
            foreach ($validatedData as $key => $value) {
                if (str_starts_with($key, 'ship_from_')) {
                    $column = substr($key, 10);
                    $shipFrom->$column = $value;
                }
            }
            $shipFrom->save();

            // Delete + recreate Rates
            // Handle Rates

            // Step 1: Delete rates that are not chosen and not past_chosen
            Rate::where('shipment_request_id', $shipmentRequest->shipmentRequestID)
                ->where('chosen', false)
                ->where(function ($query) {
                    $query->where('past_chosen', false)
                        ->orWhereNull('past_chosen');
                })
                ->delete();

            // Step 2: Move current chosen to past_chosen
            Rate::where('shipment_request_id', $shipmentRequest->shipmentRequestID)
                ->where('chosen', true)
                ->update([
                    'chosen' => false,
                    'past_chosen' => true,
                ]);

            // Step 3: Insert new rates
            foreach ($validatedData['rates'] ?? [] as $rateData) {
                $rateData['shipment_request_id'] = $shipmentRequest->shipmentRequestID;
                $rateData['active'] = true; // always keep active
                $rateData['created_user_name'] = $validatedData['login_user_name']; // track who updated
                Rate::create($rateData);
            }

            // Send email
            $sendResult = $this->emailTemplateController->automateEmail(
                $shipmentRequest,
                'logistic',
                $validatedData['login_user_name'],
                $validatedData['login_user_mail']
            );

            DB::commit();

            return response()->json([
                'status' => $sendResult ? 'success' : 'warning',
                'message' => $sendResult
                    ? 'Shipment request updated successfully. Email sent.'
                    : 'Shipment request updated successfully. Email failed.',
                'shipment_request' => $shipmentRequest,
            ], $sendResult ? 200 : 500);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update shipment request.',
                'error_detail' => $e->getMessage(),
            ], 500);
        }
    }

    public function logisticUpdateRequest(Request $request, $id)
    {
        $shipmentRequest = ShipmentRequest::with(
            'shipmentRequestHistories',
            'parcels',
            'parcels.items',
            'shipTo',
            'shipFrom',
            'rates',
            'invoiceDatas'
        )->find($id);

        if (! $shipmentRequest) {
            return response()->json(['message' => 'Shipment Request not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            // Basic info
            'send_status' => 'required|string|in:logistic_updated',
            'login_user_id' => 'required|integer',
            'login_user_name' => 'required|string|max:255',
            'login_user_mail' => 'required|email|max:255',

            // Parcels and items validation
            'parcels' => 'nullable|array',
            'parcels.*.parcel_items' => 'nullable|array',
            'parcels.*.parcel_items.*.parcelItemID' => 'required|integer|exists:Parcel_Item,parcelItemID',
            'parcels.*.parcel_items.*.item_id' => 'nullable|string|max:50',
            'parcels.*.parcel_items.*.origin_country' => 'nullable|string|max:50',
            'parcels.*.parcel_items.*.hs_code' => 'nullable|string|max:255',

            // Customs info
            'customs_purpose' => 'nullable|string|max:255',
            'customs_terms_of_trade' => 'nullable|string|max:255',

            // Optional remark
            'remark' => 'nullable|string|max:1000',
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
                'customs_purpose' => $validatedData['customs_purpose'] ?? $shipmentRequest->customs_purpose,
                'customs_terms_of_trade' => $validatedData['customs_terms_of_trade'] ?? $shipmentRequest->customs_terms_of_trade,
                'updated_at' => $time_now,
            ]);

            // Update parcel items if provided
            if (isset($validatedData['parcels']) && is_array($validatedData['parcels'])) {
                foreach ($validatedData['parcels'] as $parcelData) {
                    if (isset($parcelData['parcel_items']) && is_array($parcelData['parcel_items'])) {
                        foreach ($parcelData['parcel_items'] as $itemData) {
                            // Find the item by parcelItemID
                            $parcelItemID = $itemData['parcelItemID'];

                            // Find the item across all parcels using the parcelItemID
                            $item = null;
                            /** @var \App\Models\Logistic\Parcel $parcel */
                            foreach ($shipmentRequest->parcels as $parcel) {
                                $foundItem = $parcel->items->where('parcelItemID', $parcelItemID)->first();
                                if ($foundItem) {
                                    $item = $foundItem;
                                    break;
                                }
                            }

                            if ($item) {
                                $updateData = [];

                                if (isset($itemData['item_id'])) {
                                    $updateData['item_id'] = $itemData['item_id'];
                                }
                                if (isset($itemData['origin_country'])) {
                                    $updateData['origin_country'] = $itemData['origin_country'];
                                }
                                if (isset($itemData['hs_code'])) {
                                    $updateData['hs_code'] = $itemData['hs_code'];
                                    // Also update hscode field if it exists
                                    $updateData['hscode'] = $itemData['hs_code'];
                                }

                                if (! empty($updateData)) {
                                    $updateData['updated_at'] = $time_now;
                                    $item->update($updateData);
                                }
                            }
                        }
                    }
                }
            }

            // Create history record for logistics update
            $shipmentRequest->shipmentRequestHistories()->create([
                'shipment_request_id' => $shipmentRequest->id,
                'status' => $validatedData['send_status'],
                'shipment_request_created_date_time' => $shipmentRequest->created_date_time,
                'user_id' => $validatedData['login_user_id'],
                'user_name' => $validatedData['login_user_name'],
                'user_role' => 'logistic',
                'user_email' => $validatedData['login_user_mail'],
                'remark' => $validatedData['remark'] ?? 'Logistics information updated',
                'history_count' => $shipmentRequest->history_count + 1,
                'history_record_date_time' => $time_now,
            ]);

            DB::commit();

            // Reload the shipment request with updated relationships
            $shipmentRequest->load([
                'shipmentRequestHistories',
                'parcels.items',
                'shipTo',
                'shipFrom',
                'rates',
                'invoiceDatas',
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Shipment request logistics information updated successfully',
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

    public function changePickupDateTime(Request $request, $id)
    {
        $shipmentRequest = ShipmentRequest::find($id);

        if (! $shipmentRequest) {
            return response()->json(['message' => 'Shipment Request not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            // Basic info
            'pick_up_date' => 'nullable|date',
            'pick_up_start_time' => 'nullable|date_format:H:i:s',
            'pick_up_end_time' => 'nullable|date_format:H:i:s',
            'pick_up_instructions' => 'nullable|string|max:255',

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
                'pick_up_date' => $validatedData['pick_up_date'],
                'pick_up_start_time' => $validatedData['pick_up_start_time'],
                'pick_up_end_time' => $validatedData['pick_up_end_time'],
                'pick_up_instructions' => $validatedData['pick_up_instructions'],
                'updated_at' => $time_now,
            ]);

            // Create history record for chnage pickup datetime
            $shipmentRequest->shipmentRequestHistories()->create([
                'shipment_request_id' => $shipmentRequest->id,
                'shipment_request_created_date_time' => $shipmentRequest->created_date_time,
                'user_id' => $validatedData['login_user_id'],
                'user_name' => $validatedData['login_user_name'],
                'status' => $validatedData['send_status'],
                'remark' => 'Pickup DateTime change.',
                'history_count' => $shipmentRequest->history_count + 1,
                'history_record_date_time' => $time_now,
            ]);

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Shipment request logistics information updated successfully',
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

    public function changeInvoiceData(Request $request, $id)
    {
        $shipmentRequest = ShipmentRequest::find($id);

        if (! $shipmentRequest) {
            return response()->json(['message' => 'Shipment Request not found'], 404);
        }

        $past_invoice_record = ' Past Record: Invoice No - '.$shipmentRequest->invoice_no.' | Invoice Date - '.$shipmentRequest->invoice_date.' | Invoice Due Date - '.$shipmentRequest->invoice_due_date.' | PO Number - '.$shipmentRequest->po_number.' | PO Date - '.$shipmentRequest->po_date.' | Shipment Date - '.$shipmentRequest->pick_up_date.' | Shiment By Note - '.$shipmentRequest->shipment_by_note;

        $validator = Validator::make($request->all(), [
            // Basic info
            'invoice_no' => 'nullable|string|max:255',
            'invoice_date' => 'nullable|date_format:Y-m-d',
            'invoice_due_date' => 'nullable|date_format:Y-m-d',

            'po_number' => 'nullable|string|max:255',
            'po_date' => 'nullable|date_format:Y-m-d',
            'pick_up_date' => 'nullable|date_format:Y-m-d',
            'shipment_by_note' => 'nullable|string|max:255',

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
                'invoice_no' => $validatedData['invoice_no'],
                'invoice_date' => $validatedData['invoice_date'],
                'invoice_due_date' => $validatedData['invoice_due_date'],

                'po_number' => $validatedData['po_number'],
                'po_date' => $validatedData['po_date'],
                'pick_up_date' => $validatedData['pick_up_date'],
                'shipment_by_note' => $validatedData['shipment_by_note'],

                'updated_at' => $time_now,
            ]);

            // Create history record for change invoice data
            $shipmentRequest->shipmentRequestHistories()->create([
                'shipment_request_id' => $shipmentRequest->id,
                'shipment_request_created_date_time' => $shipmentRequest->created_date_time,
                'user_id' => $validatedData['login_user_id'],
                'user_name' => $validatedData['login_user_name'],
                'status' => 'invoice_data_changed',
                'remark' => 'Some Data for invoice has changed.'.$past_invoice_record,
                'history_count' => $shipmentRequest->history_count + 1,
                'history_record_date_time' => $time_now,
            ]);

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'You have change invoice data successfully',
                'data' => [
                    'shipment_request' => $shipmentRequest,
                    'updated_at' => $time_now->toISOString(),
                ],
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'status' => 'error',
                'message' => 'Failed to change invoice information.',
                'error_detail' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    public function changeTrackingNumber(Request $request, $id)
    {
        $shipmentRequest = ShipmentRequest::find($id);

        if (! $shipmentRequest) {
            return response()->json(['message' => 'Shipment Request not found'], 404);
        }

        if ($shipmentRequest->shipping_options !== 'manual_input') {
            return response()->json(['status' => 'error', 'message' => 'Tracking number can only be updated for manual input shipments'], 422);
        }

        if ($shipmentRequest->request_status !== 'approver_approved') {
            return response()->json(['status' => 'error', 'message' => 'Tracking number can only be updated after approval'], 422);
        }

        $validator = Validator::make($request->all(), [
            'tracking_numbers' => 'required|string|max:500',
            'login_user_id' => 'required|integer',
            'login_user_name' => 'required|string|max:255',
            'login_user_mail' => 'required|email|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        $validatedData = $validator->validated();
        $time_now = \Illuminate\Support\Carbon::now();

        DB::beginTransaction();
        try {
            $shipmentRequest->update(['tracking_numbers' => $validatedData['tracking_numbers']]);

            $shipmentRequest->shipmentRequestHistories()->create([
                'shipment_request_id' => $shipmentRequest->id,
                'shipment_request_created_date_time' => $shipmentRequest->created_date_time,
                'user_id' => $validatedData['login_user_id'],
                'user_name' => $validatedData['login_user_name'],
                'status' => 'tracking_number_updated',
                'remark' => 'Tracking number manually updated: '.$validatedData['tracking_numbers'],
                'history_count' => $shipmentRequest->history_count + 1,
                'history_record_date_time' => $time_now,
            ]);

            DB::commit();

            return response()->json(['status' => 'success', 'message' => 'Tracking number updated successfully', 'data' => ['shipment_request' => $shipmentRequest]], 200);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json(['status' => 'error', 'message' => 'Failed to update tracking number.', 'error_detail' => config('app.debug') ? $e->getMessage() : 'Internal server error'], 500);
        }
    }

    public function changeTestingStatus(Request $request, $id)
    {
        $shipmentRequest = ShipmentRequest::with(
            'shipmentRequestHistories',
        )->find($id);

        if (! $shipmentRequest) {
            return response()->json(['message' => 'Shipment Request not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            // Action info
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
        $new_history_count = $shipmentRequest->history_count + 1;

        DB::beginTransaction();

        try {
            // Update main shipment request
            $shipmentRequest->update([
                'testing' => ! $shipmentRequest->fresh()->testing,
                'history_count' => $new_history_count,
            ]);

            // Create history record for logistics update
            $shipmentRequest->shipmentRequestHistories()->create([
                'shipment_request_id' => $shipmentRequest->id,
                'status' => $shipmentRequest->request_status,
                'shipment_request_created_date_time' => $shipmentRequest->created_date_time,
                'user_id' => $validatedData['login_user_id'],
                'user_name' => $validatedData['login_user_name'],
                'user_role' => 'developer',
                'user_email' => $validatedData['login_user_mail'],
                'remark' => 'Testing status changed',
                'history_count' => $new_history_count,
                'history_record_date_time' => $time_now,
            ]);

            DB::commit();

            // Reload the shipment request with updated relationships
            $shipmentRequest->load([
                'shipmentRequestHistories',
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Shipment request testing status changed successfully',
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
