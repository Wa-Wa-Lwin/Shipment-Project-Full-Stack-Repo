<?php

namespace App\Models\Logistic;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Rate extends Model
{
    use HasFactory;

    protected $connection = 'sqlsrv';

    protected $table = 'Rate';

    protected $primaryKey = 'rateID';

    public $timestamps = false;

    protected $fillable = [
        'shipment_request_id',
        'shipper_account_id',
        'shipper_account_slug',
        'shipper_account_description',
        'service_type',
        'service_name',
        'pickup_deadline',
        'booking_cut_off',
        'delivery_date',
        'transit_time',
        'error_message',
        'info_message',
        'charge_weight_value',
        'charge_weight_unit',
        'total_charge_amount',
        'total_charge_currency',
        'chosen',
        'detailed_charges',
        'past_chosen',
        'created_user_name',
    ];

    public function shipmentRequest()
    {
        return $this->belongsTo(ShipmentRequest::class, 'shipment_request_id', 'shipmentRequestID');
    }
}
