<?php

namespace App\Models\Logistic;

use Illuminate\Database\Eloquent\Model;

/**
 * ShipTo Model
 *
 * @property int $shippingToAddressID
 * @property int|null $shipment_request_id
 * @property string|null $country
 * @property string|null $contact_name
 * @property string|null $phone
 * @property string|null $fax
 * @property string|null $email
 * @property string|null $company_name
 * @property string|null $company_url
 * @property string|null $street1
 * @property string|null $street2
 * @property string|null $street3
 * @property string|null $city
 * @property string|null $state
 * @property string|null $postal_code
 * @property string|null $tax_id
 * @property string|null $eori_number
 * @property string|null $created_at
 * @property string|null $created_by_user_name
 * @property-read ShipmentRequest|null $shipmentRequest
 */
class ShipTo extends Model
{
    protected $connection = 'sqlsrv';

    protected $table = 'Shipping_To_Address';

    protected $primaryKey = 'shippingToAddressID';

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
        'eori_number',
        'created_at',
        'created_by_user_name',
    ];

    public function shipmentRequest()
    {
        return $this->belongsTo(ShipmentRequest::class, 'shipment_request_id', 'shipmentRequestID');
    }
}
