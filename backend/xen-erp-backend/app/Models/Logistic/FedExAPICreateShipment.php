<?php

namespace App\Models\Logistic;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FedExAPICreateShipment extends Model
{
    use HasFactory;

    protected $connection = 'sqlsrv';

    // Table name
    protected $table = 'FedExAPICreateShipment';

    // Primary key
    protected $primaryKey = 'fedExApiShipmentID';

    // Disable Laravel's timestamps (created_at, updated_at)
    public $timestamps = false;

    // Fillable fields
    protected $fillable = [
        'transactionId',
        'masterTrackingNumber',
        'serviceType',
        'shipDatestamp',
        'serviceName',
        'serviceCategory',
        'trackingNumber',
        'additionalChargesDiscount',
        'netRateAmount',
        'netChargeAmount',
        'netDiscountAmount',
        'currency',
        'codcollectionAmount',
        'baseRateAmount',
        'packageDocument_url',
        'packageDocument_contentType',
        'packageDocument_docType',
        'packageDocument_copiesToPrint',
        'customerReferenceType',
        'customerReferenceValue',
        'carrierCode',
        'serviceId',
        'serviceCode',
        'description',
        'packagingDescription',
        'packagingCode',
        'originLocationId',
        'destinationLocationId',
        'originServiceArea',
        'destinationServiceArea',
        'postalCode',
        'countryCode',
        'airportId',
        'astraPlannedServiceLevel',
        'rateType',
        'rateScale',
        'rateZone',
        'ratedWeightMethod',
        'dimDivisor',
        'fuelSurchargePercent',
        'totalBillingWeight',
        'totalBaseCharge',
        'totalSurcharges',
        'totalNetFedExCharge',
        'totalNetCharge',
        'surchargeType',
        'surchargeDescription',
        'surchargeAmount',
        'pickup_readyPickupDateTime',
        'pickup_latestPickupDateTime',
        'pickup_courierInstructions',
        'pickup_requestType',
        'pickup_requestSource',
        'shipper_personName',
        'shipper_companyName',
        'shipper_emailAddress',
        'shipper_phoneNumber',
        'shipper_streetLines',
        'shipper_city',
        'shipper_stateOrProvinceCode',
        'shipper_postalCode',
        'shipper_countryCode',
        'recipient_personName',
        'recipient_companyName',
        'recipient_emailAddress',
        'recipient_phoneNumber',
        'recipient_streetLines',
        'recipient_city',
        'recipient_stateOrProvinceCode',
        'recipient_postalCode',
        'recipient_countryCode',
        'paymentType',
        'payorAccountNumber',
        'sequenceNumber',
        'weight_value',
        'weight_units',
        'dimensions_length',
        'dimensions_width',
        'dimensions_height',
        'dimensions_units',
        'itemDescription',
        'accountNumber',
        'labelResponseOptions',
        'raw_json',
        'createdAt',
        'created_status',
        'shipment_request_id',
    ];

    // Casts for proper data handling
    protected $casts = [
        'transactionId' => 'string',
        'shipDatestamp' => 'date',
        'pickup_readyPickupDateTime' => 'datetime',
        'pickup_latestPickupDateTime' => 'datetime',
        'createdAt' => 'datetime',
    ];

    // Relationship: each FedEx shipment belongs to one Shipment Request
    public function shipmentRequest()
    {
        return $this->belongsTo(ShipmentRequest::class, 'shipment_request_id', 'shipmentRequestID');
    }
}
