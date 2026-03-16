<?php

namespace App\Models\Logistic;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InvoiceData extends Model
{
    use HasFactory;

    protected $connection = 'sqlsrv';

    protected $table = 'Invoice_Data'; // Table name

    protected $primaryKey = 'invoiceID'; // Primary key

    public $incrementing = true; // Auto-increment integer primary key

    protected $keyType = 'int'; // Primary key type is integer

    public $timestamps = false; // No default timestamps

    protected $fillable = [
        'shipment_request_id',
        'invoice_number',
        'beneficiary_bank',
        'bank_swift_code',
        'bank_address',
        'bank_account_no',
        'subtotal',
        'freight',
        'sales_tax',
        'trade_discount',
        'payment_credit_amount',
        'balance_amount',
        'balance_currency',
        'payment_terms',
        'invoice_date',
        'harmonized_code',
        'so_code',
        'any_note',
    ];

    /**
     * Relationship to ShipmentRequest
     */
    public function shipmentRequest()
    {
        return $this->belongsTo(ShipmentRequest::class, 'shipment_request_id', 'shipmentRequestID');
    }
}
