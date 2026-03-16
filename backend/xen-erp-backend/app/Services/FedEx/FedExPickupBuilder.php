<?php

namespace App\Services\FedEx;

use App\Helpers\FedExHelper;
use App\Services\CountryCodeService;
use Illuminate\Support\Carbon;

class FedExPickupBuilder
{
    public function __construct(
        protected ?CountryCodeService $countryCodeService = null
    ) {
        $this->countryCodeService = $countryCodeService ?? app(CountryCodeService::class);
    }

    /**
     * Build FedEx Pickup API payload from shipment request
     *
     * @param  mixed  $shipmentRequest  ShipmentRequest model
     * @param  mixed  $chosenRate  Rate model
     * @return array Complete pickup payload for FedEx API
     */
    public function buildPickupPayload($shipmentRequest, $chosenRate): array
    {
        // Parse pickup times
        $pickupDate = Carbon::parse($shipmentRequest->pick_up_date);
        $readyTime = Carbon::parse($shipmentRequest->pick_up_start_time)->format('H:i:s');
        $closeTime = Carbon::parse($shipmentRequest->pick_up_end_time)->format('H:i:s');

        // Build pickup location address
        $pickupLocation = [
            'contact' => FedExHelper::formatContact($shipmentRequest->shipFrom),
            'address' => FedExHelper::formatAddress($shipmentRequest->shipFrom, $this->countryCodeService),
            'accountNumber' => [
                'value' => config('services.fedex.account_number'),
            ],
        ];

        // Build the main payload
        $payload = [
            'associatedAccountNumber' => [
                'value' => config('services.fedex.account_number'),
            ],
            'originDetail' => [
                'pickupLocation' => $pickupLocation,
                'readyDateTimestamp' => $pickupDate->format('Y-m-d').'T'.$readyTime,
                'customerCloseTime' => $closeTime,
                'pickupDateType' => FedExConstants::PICKUP_REQUEST_SAME_DAY,
                'packageLocation' => FedExConstants::PICKUP_LOCATION_FRONT,
                'buildingPartCode' => FedExConstants::PICKUP_BUILDING_ROOM,
                'buildingPartDescription' => FedExHelper::truncate(
                    $shipmentRequest->pick_up_instructions ?? 'Front desk',
                    FedExConstants::BUILDING_DESCRIPTION_MAX_LENGTH
                ),
            ],
            'packageDetails' => [
                'packageCount' => $shipmentRequest->parcels->count(),
                'totalWeight' => [
                    'units' => strtoupper($shipmentRequest->parcels->first()->weight_unit ?? 'KG'),
                    'value' => (float) $shipmentRequest->parcels->sum('weight_value'),
                ],
            ],
            'carrierCode' => FedExHelper::mapServiceTypeToCarrierCode($chosenRate->service_type),
        ];

        // Add remarks if available
        if (! empty($shipmentRequest->pick_up_instructions)) {
            $payload['remarks'] = FedExHelper::truncate(
                $shipmentRequest->pick_up_instructions,
                FedExConstants::REMARKS_MAX_LENGTH
            );
        }

        return $payload;
    }
}
