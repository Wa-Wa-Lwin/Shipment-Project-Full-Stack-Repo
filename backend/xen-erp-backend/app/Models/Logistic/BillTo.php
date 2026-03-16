<?php

namespace App\Models\Logistic;

use Illuminate\Database\Eloquent\Model;

class BillTo extends Model
{
    protected $table = 'Logistics.dbo.Bill_To_Address';

    protected $primaryKey = 'billToAddressID';

    public $incrementing = true;

    protected $keyType = 'int';

    public $timestamps = false;

    protected $fillable = [
        'shipment_request_id',
        'country',
        'contact_name',
        'phone',
        'fax',
        'email',
        'company_name',
        'company_url',
        'street1',
        'street2',
        'street3',
        'city',
        'state',
        'postal_code',
        'tax_id',
        'created_at',
        'created_by_user_name',
    ];

    public function shipmentRequest()
    {
        return $this->belongsTo(ShipmentRequest::class, 'shipment_request_id', 'shipmentRequestID');
    }
}
