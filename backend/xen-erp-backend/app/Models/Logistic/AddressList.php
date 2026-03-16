<?php

namespace App\Models\Logistic;

use Illuminate\Database\Eloquent\Model;

class AddressList extends Model
{
    protected $connection = 'sqlsrv';

    protected $table = 'Address_List';

    protected $primaryKey = 'addressID';

    public $incrementing = true;

    protected $keyType = 'int';

    public $timestamps = false;

    protected $fillable = [
        'addressID', 'CardCode', 'company_name', 'CardType', 'full_address', 'street1', 'street2', 'street3', 'city', 'state', 'country', 'postal_code', 'contact_name', 'contact', 'phone', 'email', 'tax_id', 'phone1', 'website', 'active', 'created_userID', 'created_time', 'updated_userID', 'updated_time', 'created_user_name', 'updated_user_name', 'eori_number', 'bind_incoterms',
    ];
}
