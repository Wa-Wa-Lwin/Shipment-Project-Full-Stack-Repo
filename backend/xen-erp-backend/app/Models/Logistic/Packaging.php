<?php

namespace App\Models\Logistic;

use Illuminate\Database\Eloquent\Model;

class Packaging extends Model
{
    protected $connection = 'sqlsrv';

    protected $table = 'Packaging'; // Table name

    protected $primaryKey = 'packageID'; // Primary key

    public $incrementing = true; // Auto-incrementing primary key

    protected $keyType = 'int'; // Primary key type

    public $timestamps = false; // No default timestamps (created_at, updated_at)

    protected $fillable = [
        'packageID',
        'package_type',
        'package_type_name',
        'package_purpose',
        'package_length',
        'package_width',
        'package_height',
        'package_dimension_unit',
        'package_weight',
        'package_weight_unit',
        'remark',
        'created_by_user_name',
        'created_by_user_id',
        'created_at',
        'updated_by_user_name',
        'updated_by_user_id',
        'updated_at', 'active',
    ];
}
