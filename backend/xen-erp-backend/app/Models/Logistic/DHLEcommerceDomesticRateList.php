<?php

namespace App\Models\Logistic;

use Illuminate\Database\Eloquent\Model;

class DHLEcommerceDomesticRateList extends Model
{
    protected $connection = 'sqlsrv';

    protected $table = 'DHL_Ecommerce_Domestic_Rate_List';

    protected $primaryKey = 'dhlEcommerceDomesticRateListID';

    public $incrementing = true;

    protected $keyType = 'int';

    public $timestamps = false;

    protected $fillable = [
        'min_weight_kg', 'max_weight_kg', 'bkk_charge_thb', 'upc_charge_thb',
    ];
}
