<?php

namespace App\Models\Logistic;

use Illuminate\Database\Eloquent\Model;

class ParcelBoxTypes extends Model
{
    protected $connection = 'sqlsrv';

    protected $table = 'Parcel_Box_Type'; // Table name

    protected $primaryKey = 'parcelBoxTypeID'; // Primary key

    public $incrementing = false; // Manual ID assignment

    protected $keyType = 'int'; // Primary key type

    public $timestamps = true; // Has created_at and updated_at

    const CREATED_AT = 'created_at';

    const UPDATED_AT = 'updated_at';

    protected $fillable = [
        'parcelBoxTypeID',
        'type',
        'box_type_name',
        'depth',
        'width',
        'height',
        'dimension_unit',
        'parcel_weight',
        'weight_unit',
        'remark',
        'active',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'depth' => 'float',
        'width' => 'float',
        'height' => 'float',
        'parcel_weight' => 'float',
        'active' => 'boolean',
    ];
}
