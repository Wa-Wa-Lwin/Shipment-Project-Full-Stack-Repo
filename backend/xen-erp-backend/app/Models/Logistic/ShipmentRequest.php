<?php

namespace App\Models\Logistic;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * ShipmentRequest Model
 *
 * @property int $shipmentRequestID
 * @property int|null $rate_request_id
 * @property string|null $request_status
 * @property int|null $created_user_id
 * @property string|null $created_user_name
 * @property string|null $created_user_mail
 * @property string|null $created_date_time
 * @property int|null $approver_user_id
 * @property string|null $approver_user_name
 * @property string|null $approver_user_mail
 * @property string|null $approver_approved_date_time
 * @property string|null $approver_rejected_date_time
 * @property string|null $remark
 * @property int|null $history_count
 * @property string|null $topic
 * @property string|null $other_topic
 * @property string|null $po_number
 * @property string|null $service_options
 * @property string|null $urgent_reason
 * @property string|null $due_date
 * @property string|null $pick_up_status
 * @property string|null $pick_up_date
 * @property string|null $pick_up_start_time
 * @property string|null $pick_up_end_time
 * @property string|null $pick_up_instructions
 * @property string|null $pick_up_created_status
 * @property string|null $pick_up_created_id
 * @property string|null $pick_up_confirmation_numbers
 * @property string|null $detailed_charges
 * @property string|null $customs_purpose
 * @property string|null $customs_terms_of_trade
 * @property string|null $payment_terms
 * @property string|null $label_status
 * @property string|null $tracking_numbers
 * @property string|null $error_msg
 * @property bool|null $insurance_enabled
 * @property float|null $insurance_insured_value_amount
 * @property string|null $insurance_insured_value_currency
 * @property string|null $files_label_url
 * @property string|null $files_invoice_url
 * @property string|null $files_packing_slip
 * @property string|null $label_id
 * @property string|null $shipment_scope_type
 * @property bool|null $active
 * @property string|null $invoice_no
 * @property string|null $invoice_date
 * @property string|null $invoice_due_date
 * @property string|null $sales_person
 * @property string|null $shipment_date
 * @property string|null $po_date
 * @property string|null $pick_up_error_msg
 * @property string|null $label_error_msg
 * @property string|null $send_to
 * @property float|null $grab_rate_amount
 * @property string|null $grab_rate_currency
 * @property string|null $recipient_shipper_account_number
 * @property string|null $recipient_shipper_account_country_code
 * @property string|null $billing
 * @property string|null $customize_invoice_url
 * @property bool|null $use_customize_invoice
 * @property bool|null $return_shipment
 * @property string|null $paper_size
 * @property string|null $shipping_options
 * @property bool $testing
 * @property-read Collection|Rate[] $rates
 * @property-read Collection|ShipmentRequestHistory[] $shipmentRequestHistories
 * @property-read ShipTo|null $shipTo
 * @property-read BillTo|null $billTo
 * @property-read ShipFrom|null $shipFrom
 * @property-read Collection|Parcel[] $parcels
 * @property-read Collection|InvoiceData[] $invoiceDatas
 * @property-read Collection|FedExAPICreateShipment[] $fedExAPICreateShipments
 */
class ShipmentRequest extends Model
{
    protected $connection = 'sqlsrv';

    protected $table = 'Shipment_Request';

    protected $primaryKey = 'shipmentRequestID';

    public $incrementing = true;

    protected $keyType = 'int';

    public $timestamps = false;

    protected $fillable = [
        'rate_request_id',
        'request_status',
        'created_user_id',
        'created_user_name',
        'created_user_mail',
        'created_date_time',

        'approver_user_id',
        'approver_user_name',
        'approver_user_mail',
        'approver_approved_date_time',
        'approver_rejected_date_time',

        'remark',
        'history_count',
        'topic',
        'other_topic',
        'po_number',
        'service_options',
        'urgent_reason',
        'due_date',
        'pick_up_status',
        'pick_up_date',
        'pick_up_start_time',
        'pick_up_end_time',
        'pick_up_instructions',
        'pick_up_created_status',
        'pick_up_created_id',
        'pick_up_confirmation_numbers',
        'detailed_charges',
        'customs_purpose',
        'customs_terms_of_trade',
        'payment_terms',
        'label_status',
        'tracking_numbers',
        'error_msg',
        'insurance_enabled',
        'insurance_insured_value_amount',
        'insurance_insured_value_currency',
        'files_label_url',
        'files_invoice_url',
        'files_packing_slip',
        'label_id',
        'shipment_scope_type',
        'active',

        'invoice_no',
        'invoice_date',
        'invoice_due_date',
        'sales_person',
        'shipment_date',
        'po_date',

        'pick_up_error_msg',
        'label_error_msg',
        'send_to',

        'grab_rate_amount',
        'grab_rate_currency',
        'recipient_shipper_account_number',
        'recipient_shipper_account_country_code',
        'billing', // shipper, third_party, recipient
        'customize_invoice_url',
        'use_customize_invoice',
        'return_shipment',
        'paper_size',
        'shipping_options', // calculate_rates, grab_pickup, supplier_pickup
        'testing',

        'shipment_by_note', // for sales invoices , logistic can fill in the shiment by note for the request, and it will be printed in the commercial invoice
    ];

    public function rates()
    {
        return $this->hasMany(Rate::class, 'shipment_request_id', 'shipmentRequestID');
    }

    public function shipmentRequestHistories()
    {
        return $this->hasMany(ShipmentRequestHistory::class, 'shipment_request_id', 'shipmentRequestID');
    }

    public function shipTo()
    {
        return $this->hasOne(ShipTo::class, 'shipment_request_id', 'shipmentRequestID');
    }

    public function billTo()
    {
        return $this->hasOne(BillTo::class, 'shipment_request_id', 'shipmentRequestID');
    }

    public function shipFrom()
    {
        return $this->hasOne(ShipFrom::class, 'shipment_request_id', 'shipmentRequestID');
    }

    public function parcels()
    {
        return $this->hasMany(Parcel::class, 'shipment_request_id', 'shipmentRequestID');
    }

    public function invoiceDatas()
    {
        return $this->hasMany(InvoiceData::class, 'shipment_request_id', 'shipmentRequestID');
    }

    public function fedExAPICreateShipments()
    {
        return $this->hasMany(FedExAPICreateShipment::class, 'shipment_request_id', 'shipmentRequestID');
    }
}
