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

class SubmitRequestController extends Controller
{
    protected $emailTemplateController;

    public function __construct()
    {
        $this->emailTemplateController = new EmailTemplateController;
    }

    private function sanitizeNumeric($value)
    {
        if ($value === null || $value === '') {
            return null;
        }
        if (! is_numeric($value)) {
            return null;
        }
        // Return as float - Eloquent model casts will handle the DB conversion
        // For very small numbers that might trigger scientific notation, we ensure proper handling
        $floatValue = (float) $value;

        // If the value is very small (scientific notation territory), return as decimal string
        if (abs($floatValue) > 0 && abs($floatValue) < 0.0001) {
            return number_format($floatValue, 10, '.', '');
        }

        return $floatValue;
    }

    private function sanitizeBit($value)
    {
        if ($value === true || $value === 1 || $value === '1') {
            return 1;
        } elseif ($value === false || $value === 0 || $value === '0') {
            return 0;
        }

        return null;
    }

    public function submitRequest(Request $request)
    {
        $validator = Validator::make($request->all(), [
            // details //history will come from details
            'shipment_scope_type' => 'required|string|max:255',
            'service_options' => 'required|string|max:255',
            'send_to' => 'nullable|string|max:10',
            'urgent_reason' => 'nullable|string|max:255', // nullable
            'request_status' => 'required|string|max:255',

            'created_user_id' => 'required|integer',
            'created_user_name' => 'required|string|max:255',
            'created_user_mail' => 'required|email|max:255',

            'approver_user_id' => 'required|integer',
            'approver_user_name' => 'required|string|max:255',
            'approver_user_mail' => 'required|email|max:255',

            'remark' => 'nullable|string',

            'topic' => 'required|string|max:255',
            'po_number' => 'nullable|string|max:255',
            'other_topic' => 'nullable|string|max:255',
            'due_date' => 'required|date',

            'invoice_date' => 'nullable|date',
            'invoice_due_date' => 'nullable|date',
            'sales_person' => 'nullable|string|max:255',
            'po_date' => 'nullable|date',

            // Parcel and Parcel Items
            'parcels' => 'required|array', // array of parcels
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
            'parcels.*.parcel_items' => 'required|array', // array of parcel items
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

            // ship to
            'ship_to_country' => 'required|string|max:100',
            'ship_to_contact_name' => 'nullable|string|max:100',
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
            'ship_to_postal_code' => 'nullable|string|max:20',
            'ship_to_tax_id' => 'nullable|string|max:50',
            'ship_to_eori_number' => 'nullable|string|max:50',

            // ship from
            'ship_from_country' => 'required|string|max:100',
            'ship_from_contact_name' => 'nullable|string|max:100',
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
            'ship_from_postal_code' => 'nullable|string|max:20',
            'ship_from_tax_id' => 'nullable|string|max:50',
            'ship_from_eori_number' => 'nullable|string|max:50',

            // rates
            'rates' => 'nullable|array',
            'rates.*.shipper_account_id' => 'nullable|string|max:255',
            'rates.*.shipper_account_slug' => 'nullable|string|max:255',
            'rates.*.shipper_account_description' => 'nullable|string|max:255',
            'rates.*.service_type' => 'nullable|string|max:100',
            'rates.*.service_name' => 'nullable|string|max:255',
            'rates.*.pickup_deadline' => 'nullable|date',
            'rates.*.booking_cut_off' => 'nullable|date',
            'rates.*.delivery_date' => 'nullable|date',
            'rates.*.transit_time' => 'nullable|integer|max:255',
            'rates.*.error_message' => 'nullable|string',
            'rates.*.info_message' => 'nullable|string',
            'rates.*.charge_weight_value' => 'nullable|numeric',
            'rates.*.charge_weight_unit' => 'nullable|string|max:10',
            'rates.*.total_charge_amount' => 'nullable|numeric',
            'rates.*.total_charge_currency' => 'nullable|string|max:10',
            'rates.*.chosen' => 'nullable|boolean',
            'rates.*.detailed_charges' => 'nullable|string',

            'pick_up_status' => 'nullable|boolean',
            'pick_up_date' => 'nullable|date',
            'pick_up_start_time' => 'nullable|date_format:H:i',
            'pick_up_end_time' => 'nullable|date_format:H:i',
            'pick_up_instructions' => 'nullable|string',

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
            'testing' => 'nullable|boolean',
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
        $customizeInvoiceUrl = null;
        if ($request->hasFile('customize_invoice_file')) {
            $file = $request->file('customize_invoice_file');

            // Generate unique filename to avoid conflicts
            $originalName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
            $extension = $file->getClientOriginalExtension();
            $filename = $originalName.'_'.time().'.'.$extension;

            // Move file to public/uploads/invoices
            $file->move(public_path('uploads/invoices'), $filename);

            // Store relative URL path
            $customizeInvoiceUrl = 'uploads/invoices/'.$filename;
        } elseif (isset($validatedData['customize_invoice_url']) && ! empty($validatedData['customize_invoice_url'])) {
            // Use the provided URL string if no file was uploaded
            $customizeInvoiceUrl = $validatedData['customize_invoice_url'];
        }

        $time_now = \Illuminate\Support\Carbon::now();

        $mailerrormsg = null;

        DB::beginTransaction();

        try {

            $shipmentRequestData = [
                'service_options' => $validatedData['service_options'],
                'send_to' => $validatedData['send_to'],
                'urgent_reason' => $validatedData['urgent_reason'] ?? null,
                'request_status' => $validatedData['request_status'],
                'created_user_id' => $validatedData['created_user_id'],
                'created_user_name' => $validatedData['created_user_name'],
                'created_user_mail' => $validatedData['created_user_mail'],
                'created_date_time' => $time_now,
                'approver_user_id' => $validatedData['approver_user_id'],
                'approver_user_name' => $validatedData['approver_user_name'],
                'approver_user_mail' => $validatedData['approver_user_mail'],

                'remark' => $validatedData['remark'],
                'history_count' => 1,
                'topic' => $validatedData['topic'],
                'po_number' => $validatedData['po_number'],
                'po_date' => $validatedData['po_date'],
                'other_topic' => $validatedData['other_topic'],
                'due_date' => $validatedData['due_date'] ?? null,
                'detailed_charges' => $validatedData['detailed_charges'] ?? null,
                'error_msg' => $validatedData['error_msg'] ?? null,
                'shipment_scope_type' => $validatedData['shipment_scope_type'] ?? null,
                'active' => true,

                'pick_up_status' => $validatedData['pick_up_status'] ?? null,
                'pick_up_date' => $validatedData['pick_up_date'] ?? null,
                'pick_up_start_time' => $validatedData['pick_up_start_time'] ?? null,
                'pick_up_end_time' => $validatedData['pick_up_end_time'] ?? null,
                'pick_up_instructions' => $validatedData['pick_up_instructions'] ?? null,

                'insurance_enabled' => $validatedData['insurance_enabled'] ?? null,
                'insurance_insured_value_amount' => $validatedData['insurance_insured_value_amount'] ?? null,
                'insurance_insured_value_currency' => $validatedData['insurance_insured_value_currency'] ?? null,

                // 'customs_purpose' => $validatedData['customs_purpose'] ?? null,
                'customs_purpose' => isset($validatedData['customs_purpose'])
                                            ? strtolower($validatedData['customs_purpose'])
                                            // : "sample",
                                            : null,
                // 'customs_terms_of_trade' => $validatedData['customs_terms_of_trade'] ?? null,
                'customs_terms_of_trade' => isset($validatedData['customs_terms_of_trade'])
                                            ? strtolower($validatedData['customs_terms_of_trade'])
                                            // : "exw",
                                            : null,
                'payment_terms' => $validatedData['payment_terms'] ?? null,

                'invoice_date' => $validatedData['invoice_date'] ?? null,
                'invoice_due_date' => $validatedData['invoice_due_date'] ?? null,
                'sales_person' => $validatedData['sales_person'] ?? null,

                'grab_rate_amount' => $validatedData['grab_rate_amount'] ?? null,
                'grab_rate_currency' => $validatedData['grab_rate_currency'] ?? null,
                'recipient_shipper_account_number' => $validatedData['recipient_shipper_account_number'] ?? null,
                'recipient_shipper_account_country_code' => $validatedData['recipient_shipper_account_country_code'] ?? null,
                'billing' => $validatedData['billing'] ?? null,
                'use_customize_invoice' => $validatedData['use_customize_invoice'] ?? null,
                'customize_invoice_url' => $customizeInvoiceUrl,
                'shipping_options' => $validatedData['shipping_options'] ?? null,
                'testing' => $validatedData['testing'] ?? false,
            ];

            $add_ShipmentRequest = ShipmentRequest::create($shipmentRequestData);

            if (! $add_ShipmentRequest) {
                return response()->json(['message' => 'Failed to create shipment request details. '], 500);
            }

            $shipmentRequestHistoryData = [
                'shipment_request_created_date_time' => $time_now,
                'user_id' => $validatedData['created_user_id'],
                'user_name' => $validatedData['created_user_name'],
                'user_role' => 'requestor',
                'status' => $validatedData['request_status'],
                'remark' => $validatedData['remark'],
                'history_count' => $add_ShipmentRequest->history_count,
                'shipment_request_id' => $add_ShipmentRequest->shipmentRequestID,
                'history_record_date_time' => \Illuminate\Support\Carbon::now(),
            ];

            $add_ShipmentRequestHistory = ShipmentRequestHistory::create($shipmentRequestHistoryData);

            if (! $add_ShipmentRequestHistory) {
                return response()->json(['message' => 'Failed to create shipment request history.'], 500);
            }

            // Parcel and Parcel Items

            $parcelsData = $validatedData['parcels'] ?? [];

            foreach ($parcelsData as $parcel) {

                // Ensure shipment_request_id is included and sanitize numeric fields
                $parcelData = [
                    'shipment_request_id' => $add_ShipmentRequest->shipmentRequestID,
                    'box_type_name' => $parcel['box_type_name'] ?? null,
                    'width' => $this->sanitizeNumeric($parcel['width'] ?? null),
                    'height' => $this->sanitizeNumeric($parcel['height'] ?? null),
                    'depth' => $this->sanitizeNumeric($parcel['depth'] ?? null),
                    'dimension_unit' => $parcel['dimension_unit'] ?? null,
                    'weight_value' => $this->sanitizeNumeric($parcel['weight_value'] ?? null),
                    'net_weight_value' => $this->sanitizeNumeric($parcel['net_weight_value'] ?? null),
                    'parcel_weight_value' => $this->sanitizeNumeric($parcel['parcel_weight_value'] ?? null),
                    'weight_unit' => $parcel['weight_unit'] ?? null,
                    'description' => $parcel['description'] ?? null,
                ];

                $add_Parcel = Parcel::create($parcelData);

                if (! $add_Parcel) {
                    return response()->json(['message' => 'Failed to create parcel.'], 500);
                }

                $parcelItemsData = $parcel['parcel_items'] ?? [];

                foreach ($parcelItemsData as $item) {
                    $itemData = [
                        'parcel_id' => $add_Parcel->parcelID,
                        'description' => $item['description'] ?? null,
                        'quantity' => $this->sanitizeNumeric($item['quantity'] ?? null),
                        'price_currency' => $item['price_currency'] ?? null,
                        'price_amount' => $this->sanitizeNumeric($item['price_amount'] ?? null),
                        'item_id' => $item['item_id'] ?? null,
                        'origin_country' => $item['origin_country'] ?? null,
                        'weight_unit' => $item['weight_unit'] ?? null,
                        'weight_value' => $this->sanitizeNumeric($item['weight_value'] ?? null),
                        'sku' => $item['sku'] ?? null,
                        'material_code' => $item['material_code'] ?? null,
                        'hs_code' => $item['hs_code'] ?? null,
                        'return_reason' => $item['return_reason'] ?? null,
                    ];
                    $add_Item = ParcelItem::create($itemData);
                    if (! $add_Item) {
                        return response()->json(['message' => 'Failed to create parcel item.'], 500);
                    }
                }
            }

            $shipToData = [
                'shipment_request_id' => $add_ShipmentRequest->shipmentRequestID,
                'country' => $validatedData['ship_to_country'],
                'contact_name' => $validatedData['ship_to_contact_name'],
                'phone' => $validatedData['ship_to_phone'],
                'fax' => $validatedData['ship_to_fax'] ?? null,
                'email' => $validatedData['ship_to_email'],
                'company_name' => $validatedData['ship_to_company_name'],
                'company_url' => $validatedData['ship_to_company_url'] ?? null,
                'street1' => $validatedData['ship_to_street1'],
                'street2' => $validatedData['ship_to_street2'] ?? null,
                'street3' => $validatedData['ship_to_street3'] ?? null,
                'city' => $validatedData['ship_to_city'],
                'state' => $validatedData['ship_to_state'],
                'postal_code' => $validatedData['ship_to_postal_code'],
                'tax_id' => $validatedData['ship_to_tax_id'] ?? null,
                'eori_number' => $validatedData['ship_to_eori_number'] ?? null,
            ];

            $add_ShipTo = ShipTo::create($shipToData);

            if (! $add_ShipTo) {
                return response()->json(['message' => 'Failed to create ship to.'], 500);
            }

            $shipFromData = [
                'shipment_request_id' => $add_ShipmentRequest->shipmentRequestID,
                'country' => $validatedData['ship_from_country'],
                'contact_name' => $validatedData['ship_from_contact_name'],
                'phone' => $validatedData['ship_from_phone'],
                'fax' => $validatedData['ship_from_fax'] ?? null,
                'email' => $validatedData['ship_from_email'],
                'company_name' => $validatedData['ship_from_company_name'],
                'company_url' => $validatedData['ship_from_company_url'] ?? null,
                'street1' => $validatedData['ship_from_street1'],
                'street2' => $validatedData['ship_from_street2'] ?? null,
                'street3' => $validatedData['ship_from_street3'] ?? null,
                'city' => $validatedData['ship_from_city'],
                'state' => $validatedData['ship_from_state'],
                'postal_code' => $validatedData['ship_from_postal_code'],
                'tax_id' => $validatedData['ship_from_tax_id'] ?? null,
                'eori_number' => $validatedData['ship_from_eori_number'] ?? null,
            ];

            $add_ShipFrom = ShipFrom::create($shipFromData);

            if (! $add_ShipFrom) {
                return response()->json(['message' => 'Failed to create ship from.'], 500);
            }

            // rates
            foreach ($validatedData['rates'] ?? [] as $item) {
                $item['shipment_request_id'] = $add_ShipmentRequest->shipmentRequestID;
                $item['past_chosen'] = false;
                $item['created_user_name'] = $validatedData['created_user_name'];
                $add_Rate = Rate::create($item);
                if (! $add_Rate) {
                    return response()->json(['message' => 'Failed to create rate.'], 500);
                }
            }

            $shipmentRequest = ShipmentRequest::with(
                'shipmentRequestHistories',
                'parcels',
                'parcels.items',
                'shipTo',
                'shipFrom',
                'rates',
                'invoiceDatas'
            )->find($add_ShipmentRequest->shipmentRequestID);

            $sendResult = $this->emailTemplateController->automateEmail(
                $add_ShipmentRequest,
                'requestor',
                $validatedData['created_user_name'],
                $validatedData['created_user_mail']
            );

            if (! $sendResult) {

                $mailerrormsg = 'mail error';

                DB::commit();

                return response()->json([
                    'status' => 'error',
                    'message' => 'Shipment request submitted successfully but Email notification failed to send.',
                    'shipment_request' => $shipmentRequest,
                ], 500);
            }

            $mailerrormsg = 'not mail error';

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Shipment request submitted successfully. Notify Email Sent successfully.',
                'shipment_request' => $shipmentRequest,
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'status' => 'error',
                'message' => 'Failed to submit shipment request.',
                'mailerrormsg' => $mailerrormsg,
                'error_detail' => $e->getMessage(),
            ], 500);
        }
    }
}
