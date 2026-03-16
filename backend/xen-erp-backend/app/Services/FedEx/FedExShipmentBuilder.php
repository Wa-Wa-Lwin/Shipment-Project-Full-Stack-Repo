<?php

namespace App\Services\FedEx;

use App\Helpers\FedExHelper;
use App\Services\CountryCodeService;
use Illuminate\Support\Carbon;

class FedExShipmentBuilder
{
    public function __construct(
        protected ?CountryCodeService $countryCodeService = null
    ) {
        $this->countryCodeService = $countryCodeService ?? app(CountryCodeService::class);
    }

    /**
     * Build complete FedEx Create Shipment API payload from shipment request
     *
     * @param  mixed  $shipmentRequest  ShipmentRequest model with relations loaded
     * @param  mixed  $chosenRate  Rate model
     * @return array Complete shipment payload for FedEx API
     */
    public function buildShipmentPayload($shipmentRequest, $chosenRate): array
    {
        // Build shipper and recipient details
        $shipper = [
            'address' => FedExHelper::formatAddress($shipmentRequest->shipFrom, $this->countryCodeService),
            'contact' => FedExHelper::formatContact($shipmentRequest->shipFrom),
        ];

        $recipients = [[
            'address' => FedExHelper::formatAddress($shipmentRequest->shipTo, $this->countryCodeService),
            'contact' => FedExHelper::formatContact($shipmentRequest->shipTo),
        ]];

        // Build package line items from parcels
        $requestedPackageLineItems = $this->buildPackageLineItems($shipmentRequest);

        // Calculate total weight
        $totalWeight = $shipmentRequest->parcels->sum('weight_value');

        // Build main payload
        $payload = [
            // 'labelResponseOptions' => FedExConstants::LABEL_RESPONSE_URL_ONLY,
            'labelResponseOptions' => FedExConstants::LABEL_RESPONSE_LABEL_BASE64,
            'requestedShipment' => [
                'shipper' => $shipper,
                'recipients' => $recipients,
                'shipDatestamp' => $shipmentRequest->pick_up_date,
                'serviceType' => strtoupper($chosenRate->service_type),
                'packagingType' => FedExConstants::PACKAGING_YOUR_PACKAGING,
                'pickupType' => FedExConstants::PICKUP_USE_SCHEDULED,
                'totalWeight' => $totalWeight,
                'labelSpecification' => [
                    'imageType' => FedExConstants::IMAGE_TYPE_PDF,
                    'labelStockType' => FedExHelper::mapPaperSize($shipmentRequest->paper_size),
                ],
                'shippingChargesPayment' => [
                    'paymentType' => FedExConstants::PAYMENT_TYPE_SENDER,
                    'payor' => [
                        'responsibleParty' => [
                            'accountNumber' => [
                                'value' => config('services.fedex.account_number'),
                            ],
                            'address' => [
                                'countryCode' => $this->countryCodeService->convertToISO2($shipmentRequest->shipFrom->country),
                            ],
                        ],
                    ],
                ],
                'requestedPackageLineItems' => $requestedPackageLineItems,
            ],
            'accountNumber' => [
                'value' => config('services.fedex.account_number'),
            ],
        ];

        // Add customs information for international shipments
        if (! str_starts_with(strtolower($shipmentRequest->shipment_scope_type), strtolower(FedExConstants::SCOPE_DOMESTIC))) {
            $payload['requestedShipment']['customsClearanceDetail'] = [
                'dutiesPayment' => [
                    'paymentType' => FedExConstants::PAYMENT_TYPE_SENDER,
                ],
                'commodities' => $this->buildCommodities($shipmentRequest),
            ];
        }

        // Add pickup detail if needed
        if (! empty($shipmentRequest->pick_up_start_time) && ! empty($shipmentRequest->pick_up_end_time)) {
            $pickupDate = Carbon::parse($shipmentRequest->pick_up_date);
            $startTime = Carbon::parse($shipmentRequest->pick_up_start_time);
            $endTime = Carbon::parse($shipmentRequest->pick_up_end_time);

            $payload['requestedShipment']['pickupDetail'] = [
                'readyPickupDateTime' => FedExHelper::combineDateTime($pickupDate, $startTime),
                'latestPickupDateTime' => FedExHelper::combineDateTime($pickupDate, $endTime),
                'courierInstructions' => FedExHelper::truncate(
                    $shipmentRequest->pick_up_instructions ?? 'Please pickup',
                    FedExConstants::COURIER_INSTRUCTIONS_MAX_LENGTH
                ),
                'requestType' => FedExConstants::PICKUP_REQUEST_FUTURE_DAY,
                'requestSource' => FedExConstants::PICKUP_SOURCE_CUSTOMER,
            ];
        }

        return $payload;
    }

    /**
     * Build package line items array from parcels
     *
     * @param  mixed  $shipmentRequest  ShipmentRequest with parcels loaded
     * @return array Package line items for FedEx API
     */
    protected function buildPackageLineItems($shipmentRequest): array
    {
        $requestedPackageLineItems = [];
        $sequenceNumber = 1;

        foreach ($shipmentRequest->parcels as $parcel) {
            $packageItem = [
                'sequenceNumber' => (string) $sequenceNumber++,
                'weight' => [
                    'units' => strtoupper($parcel->weight_unit),
                    'value' => (float) $parcel->weight_value,
                ],
                'dimensions' => [
                    'length' => (int) $parcel->width,
                    'width' => (int) $parcel->height,
                    'height' => (int) $parcel->depth,
                    'units' => strtoupper($parcel->dimension_unit),
                ],
            ];

            // Add customer references if available
            if (! empty($shipmentRequest->invoice_no)) {
                $packageItem['customerReferences'] = [[
                    'customerReferenceType' => FedExConstants::REFERENCE_TYPE_INVOICE,
                    'value' => $shipmentRequest->invoice_no,
                ]];
            }

            // Add item description (FedEx limit: 50 characters)
            if (! empty($parcel->description)) {
                $packageItem['itemDescription'] = FedExHelper::truncate(
                    $parcel->description,
                    FedExConstants::ITEM_DESCRIPTION_MAX_LENGTH
                );
            }

            $requestedPackageLineItems[] = $packageItem;
        }

        return $requestedPackageLineItems;
    }

    /**
     * Build commodities array for customs declaration (international shipments)
     *
     * @param  mixed  $shipmentRequest  ShipmentRequest with parcels and items loaded
     * @return array Commodities array for FedEx API
     */
    protected function buildCommodities($shipmentRequest): array
    {
        $commodities = [];

        foreach ($shipmentRequest->parcels as $parcel) {
            foreach ($parcel->items as $item) {
                $commodities[] = [
                    'description' => FedExHelper::truncate(
                        $item->description ?? 'Commodity',
                        FedExConstants::COMMODITY_DESCRIPTION_MAX_LENGTH
                    ),
                    'weight' => [
                        'units' => strtoupper($item->weight_unit ?? 'KG'),
                        'value' => (float) ($item->weight_value ?? 1),
                    ],
                    'quantity' => (int) $item->quantity,
                    'quantityUnits' => FedExConstants::QUANTITY_UNITS_PCS,
                    'unitPrice' => [
                        'amount' => (float) $item->price_amount,
                        'currency' => $item->price_currency ?? 'USD',
                    ],
                    'customsValue' => [
                        'amount' => (float) $item->price_amount * (int) $item->quantity,
                        'currency' => $item->price_currency ?? 'USD',
                    ],
                    'countryOfManufacture' => $this->countryCodeService->convertToISO2($item->origin_country ?? 'TH'),
                    'harmonizedCode' => $item->hs_code ?? '',
                ];
            }
        }

        return $commodities;
    }
}
