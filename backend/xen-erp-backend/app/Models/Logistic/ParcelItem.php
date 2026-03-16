<?php

namespace App\Models\Logistic;

use Illuminate\Database\Eloquent\Model;

class ParcelItem extends Model
{
    protected $connection = 'sqlsrv';

    protected $table = 'Parcel_Item'; // Table name

    protected $primaryKey = 'parcelItemID'; // Updated primary key

    public $incrementing = true; // Auto-incrementing primary key

    protected $keyType = 'int'; // Primary key type

    public $timestamps = false; // No default timestamps (created_at, updated_at)

    protected $fillable = [
        'parcel_id',
        'description',
        'quantity',
        'price_currency',
        'price_amount',
        'item_id',
        'origin_country',
        'weight_unit',
        'weight_value',
        'sku',
        'material_code',
        'hs_code',
        'return_reason',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'price_amount' => 'float',
        'weight_value' => 'float',
    ];

    /**
     * Define the relationship with the Parcel model.
     */
    public function parcel()
    {
        return $this->belongsTo(Parcel::class, 'parcel_id', 'parcelID');
    }
}
