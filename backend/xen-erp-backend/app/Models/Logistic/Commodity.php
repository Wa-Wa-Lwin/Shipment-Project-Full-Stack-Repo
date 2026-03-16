<?php

namespace App\Models\Logistic;

use Illuminate\Database\Eloquent\Model;

class Commodity extends Model
{
    protected $connection = 'sqlsrv';

    protected $table = 'Commodity'; // Table name

    protected $primaryKey = 'commodityID'; // Primary key

    public $incrementing = true; // Auto-incrementing primary key

    protected $keyType = 'int'; // Primary key type

    public $timestamps = false; // No default timestamps (created_at, updated_at)

    protected $fillable = [
        'commodity_description',
        'description_thai',
        'hscode',
        'duty',
        'supplierID',
        'supplierCode',
        'Remark',
        'created_by_user_name',
        'created_by_user_id',
        'created_at',
        'updated_by_user_name',
        'updated_by_user_id',
        'updated_at',
    ];
}
