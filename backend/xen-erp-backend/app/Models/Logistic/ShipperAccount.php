<?php

namespace App\Models\Logistic;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ShipperAccount extends Model
{
    use HasFactory;

    protected $connection = 'sqlsrv';

    protected $table = 'Shipper_Account';

    protected $primaryKey = 'shipperAccountID';

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = true;

    protected $fillable = [
        'shipperAccountID',
        'description',
        'slug',
        'status',
        'timezone',
        'type',
        'created_at',
        'updated_at',
        'account_balance',
        'settings',
        'enabled',
        'extra_info',
        'address_country',
        'address_contact_name',
        'address_phone',
        'address_fax',
        'address_email',
        'address_company_name',
        'address_company_url',
        'address_street1',
        'address_street2',
        'address_street3',
        'address_city',
        'address_state',
        'address_postal_code',
        'address_type',
        'address_tax_id',
    ];

    protected $casts = [
        'shipperAccountID' => 'string',
        'account_balance' => 'decimal:2',
        'enabled' => 'boolean',
        'settings' => 'array',
        'extra_info' => 'array',
    ];
}
