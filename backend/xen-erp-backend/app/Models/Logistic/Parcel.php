<?php

namespace App\Models\Logistic;

use Illuminate\Database\Eloquent\Model;

class Parcel extends Model
{
    protected $connection = 'sqlsrv';

    protected $table = 'Parcel'; // Table name

    protected $primaryKey = 'parcelID'; // Primary key

    public $incrementing = true; // Auto-incrementing primary key

    protected $keyType = 'int'; // Primary key type

    public $timestamps = false; // No default timestamps (created_at, updated_at)

    protected $fillable = [
        'shipment_request_id',
        'box_type_name',
        'width',
        'height',
        'depth',
        'dimension_unit',
        'weight_value',
        'net_weight_value',
        'parcel_weight_value',
        'weight_unit',
        'description',
    ];

    protected $casts = [
        'width' => 'float',
        'height' => 'float',
        'depth' => 'float',
        'weight_value' => 'float',
        'net_weight_value' => 'float',
        'parcel_weight_value' => 'float',
    ];

    public function shipmentRequest()
    {
        return $this->belongsTo(ShipmentRequest::class, 'shipment_request_id', 'shipmentRequestID');
    }

    public function items()
    {
        return $this->hasMany(ParcelItem::class, 'parcel_id', 'parcelID');
    }
}
