<?php

namespace App\Services\FedEx;

use App\Models\Logistic\FedExAPICreateShipment;
use App\Models\Logistic\ShipmentRequest;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

class FedExShipmentRepository
{
    /**
     * Get all FedEx API shipments with shipment request relation
     *
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getAllFedExApiShipments()
    {
        return FedExAPICreateShipment::with('shipmentRequest')
            ->orderBy('fedExApiShipmentID', 'desc')
            ->get();
    }

    /**
     * Find FedEx API shipment by ID with shipment request relation
     *
     * @param  int  $id  FedEx API Shipment ID
     */
    public function findFedExApiShipment(int $id): ?FedExAPICreateShipment
    {
        return FedExAPICreateShipment::with('shipmentRequest')->find($id);
    }

    /**
     * Get all shipment requests with relations
     *
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getAllShipments()
    {
        return ShipmentRequest::with([
            'shipmentRequestHistories',
            'parcels',
            'parcels.items',
            'shipTo',
            'shipFrom',
            'rates',
            'invoiceDatas',
        ])->get();
    }

    /**
     * Find shipment request with all necessary relations loaded
     *
     * @param  int  $id  Shipment request ID
     */
    public function findWithRelations(int $id): ?ShipmentRequest
    {
        return ShipmentRequest::with([
            'shipmentRequestHistories',
            'parcels',
            'parcels.items',
            'shipTo',
            'shipFrom',
            'rates',
            'invoiceDatas',
        ])->find($id);
    }

    /**
     * Save comprehensive FedEx API shipment data to database for record keeping
     * Extracts 100+ fields from both request payload and API response
     *
     * @param  mixed  $shipmentRequest  ShipmentRequest model
     * @param  array  $responseBody  FedEx API response body
     * @param  array  $payload  Original request payload
     * @param  bool  $isSuccess  Whether the request was successful
     */
    public function saveShipmentRecord($shipmentRequest, $responseBody, $payload, $isSuccess): void
    {
        try {
            $data = [
                'shipment_request_id' => $shipmentRequest->shipmentRequestID,
                'created_status' => $isSuccess ? 'success' : 'failed',
                'createdAt' => Carbon::now(),
                'raw_json' => json_encode([
                    'request' => $payload,
                    'response' => $responseBody,
                ]),
            ];

            // Extract data from payload (request)
            $data = array_merge($data, $this->extractPayloadData($payload));

            // Extract data from response (only if success)
            if ($isSuccess && ! empty($responseBody['output']['transactionShipments'][0])) {
                $data = array_merge($data, $this->extractResponseData($responseBody));
            }

            // Create the record
            FedExAPICreateShipment::create($data);

            Log::info('FedEx API Shipment record saved', [
                'shipment_request_id' => $shipmentRequest->shipmentRequestID,
                'status' => $data['created_status'],
            ]);

        } catch (\Exception $e) {
            // Log the error but don't throw - we don't want to break the main flow
            Log::error('Failed to save FedEx API Shipment record', [
                'shipment_request_id' => $shipmentRequest->shipmentRequestID,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Extract data from request payload
     *
     * @param  array  $payload  Original request payload
     * @return array Extracted data
     */
    protected function extractPayloadData(array $payload): array
    {
        $data = [];

        if (empty($payload['requestedShipment'])) {
            return $data;
        }

        $requestedShipment = $payload['requestedShipment'];

        // Service information
        $data['serviceType'] = $requestedShipment['serviceType'] ?? null;
        $data['shipDatestamp'] = $requestedShipment['shipDatestamp'] ?? null;
        $data['labelResponseOptions'] = $payload['labelResponseOptions'] ?? null;
        $data['accountNumber'] = $payload['accountNumber']['value'] ?? null;

        // Payment information
        if (! empty($requestedShipment['shippingChargesPayment'])) {
            $data['paymentType'] = $requestedShipment['shippingChargesPayment']['paymentType'] ?? null;
            $data['payorAccountNumber'] = $requestedShipment['shippingChargesPayment']['payor']['responsibleParty']['accountNumber']['value'] ?? null;
        }

        // Shipper information
        if (! empty($requestedShipment['shipper'])) {
            $shipper = $requestedShipment['shipper'];
            $data['shipper_personName'] = $shipper['contact']['personName'] ?? null;
            $data['shipper_companyName'] = $shipper['contact']['companyName'] ?? null;
            $data['shipper_emailAddress'] = $shipper['contact']['emailAddress'] ?? null;
            $data['shipper_phoneNumber'] = $shipper['contact']['phoneNumber'] ?? null;
            $data['shipper_streetLines'] = isset($shipper['address']['streetLines']) ? implode(', ', $shipper['address']['streetLines']) : null;
            $data['shipper_city'] = $shipper['address']['city'] ?? null;
            $data['shipper_stateOrProvinceCode'] = $shipper['address']['stateOrProvinceCode'] ?? null;
            $data['shipper_postalCode'] = $shipper['address']['postalCode'] ?? null;
            $data['shipper_countryCode'] = $shipper['address']['countryCode'] ?? null;
        }

        // Recipient information
        if (! empty($requestedShipment['recipients'][0])) {
            $recipient = $requestedShipment['recipients'][0];
            $data['recipient_personName'] = $recipient['contact']['personName'] ?? null;
            $data['recipient_companyName'] = $recipient['contact']['companyName'] ?? null;
            $data['recipient_emailAddress'] = $recipient['contact']['emailAddress'] ?? null;
            $data['recipient_phoneNumber'] = $recipient['contact']['phoneNumber'] ?? null;
            $data['recipient_streetLines'] = isset($recipient['address']['streetLines']) ? implode(', ', $recipient['address']['streetLines']) : null;
            $data['recipient_city'] = $recipient['address']['city'] ?? null;
            $data['recipient_stateOrProvinceCode'] = $recipient['address']['stateOrProvinceCode'] ?? null;
            $data['recipient_postalCode'] = $recipient['address']['postalCode'] ?? null;
            $data['recipient_countryCode'] = $recipient['address']['countryCode'] ?? null;
        }

        // Pickup information
        if (! empty($requestedShipment['pickupDetail'])) {
            $pickupDetail = $requestedShipment['pickupDetail'];
            $data['pickup_readyPickupDateTime'] = $pickupDetail['readyPickupDateTime'] ?? null;
            $data['pickup_latestPickupDateTime'] = $pickupDetail['latestPickupDateTime'] ?? null;
            $data['pickup_courierInstructions'] = $pickupDetail['courierInstructions'] ?? null;
            $data['pickup_requestType'] = $pickupDetail['requestType'] ?? null;
            $data['pickup_requestSource'] = $pickupDetail['requestSource'] ?? null;
        }

        // Package information (using first package)
        if (! empty($requestedShipment['requestedPackageLineItems'][0])) {
            $package = $requestedShipment['requestedPackageLineItems'][0];
            $data['sequenceNumber'] = $package['sequenceNumber'] ?? null;
            $data['weight_value'] = $package['weight']['value'] ?? null;
            $data['weight_units'] = $package['weight']['units'] ?? null;
            $data['dimensions_length'] = $package['dimensions']['length'] ?? null;
            $data['dimensions_width'] = $package['dimensions']['width'] ?? null;
            $data['dimensions_height'] = $package['dimensions']['height'] ?? null;
            $data['dimensions_units'] = $package['dimensions']['units'] ?? null;
            $data['itemDescription'] = $package['itemDescription'] ?? null;

            // Customer reference
            if (! empty($package['customerReferences'][0])) {
                $data['customerReferenceType'] = $package['customerReferences'][0]['customerReferenceType'] ?? null;
                $data['customerReferenceValue'] = $package['customerReferences'][0]['value'] ?? null;
            }
        }

        return $data;
    }

    /**
     * Extract comprehensive data from FedEx API response
     * This extracts 100+ fields from the deeply nested response structure
     *
     * @param  array  $responseBody  FedEx API response
     * @return array Extracted data
     */
    protected function extractResponseData(array $responseBody): array
    {
        $data = [];
        $transactionShipment = $responseBody['output']['transactionShipments'][0];

        // Transaction details
        $data['transactionId'] = $responseBody['transactionId'] ?? null;
        $data['masterTrackingNumber'] = $transactionShipment['masterTrackingNumber'] ?? null;
        $data['serviceName'] = $transactionShipment['serviceName'] ?? null;
        $data['serviceCategory'] = $transactionShipment['serviceCategory'] ?? null;

        // Piece response (package level)
        if (! empty($transactionShipment['pieceResponses'][0])) {
            $pieceResponse = $transactionShipment['pieceResponses'][0];
            $data['trackingNumber'] = $pieceResponse['trackingNumber'] ?? null;
            $data['additionalChargesDiscount'] = $pieceResponse['additionalChargesDiscount'] ?? null;
            $data['codcollectionAmount'] = $pieceResponse['codcollectionAmount'] ?? null;

            // Package document
            if (! empty($pieceResponse['packageDocuments'][0])) {
                $doc = $pieceResponse['packageDocuments'][0];
                // $data['packageDocument_url'] = $doc['url'] ?? null; //LABEL_RESPONSE_URL_ONLY
                $data['packageDocument_url'] = $doc['encodedLabel'] ?? null; // LABEL_RESPONSE_LABEL_BASE64
                $data['packageDocument_contentType'] = $doc['contentType'] ?? null;
                $data['packageDocument_docType'] = $doc['docType'] ?? null;
                $data['packageDocument_copiesToPrint'] = $doc['copiesToPrint'] ?? null;
            }

            // Pricing information
            $data['netRateAmount'] = $pieceResponse['netRateAmount'] ?? null;
            $data['currency'] = $pieceResponse['currency'] ?? null;
            $data['netChargeAmount'] = $pieceResponse['netChargeAmount'] ?? null;
            $data['netDiscountAmount'] = $pieceResponse['netDiscountAmount'] ?? null;
            $data['baseRateAmount'] = $pieceResponse['baseRateAmount'] ?? null;
        }

        // Completed shipment detail
        if (! empty($transactionShipment['completedShipmentDetail'])) {
            $completedDetail = $transactionShipment['completedShipmentDetail'];

            // Carrier information
            $data['carrierCode'] = $completedDetail['carrierCode'] ?? null;
            $data['packagingDescription'] = $completedDetail['packagingDescription'] ?? null;

            // Service description
            if (! empty($completedDetail['serviceDescription'])) {
                $serviceDesc = $completedDetail['serviceDescription'];
                $data['serviceId'] = $serviceDesc['serviceId'] ?? null;
                $data['serviceCode'] = $serviceDesc['code'] ?? null;
                $data['description'] = $serviceDesc['description'] ?? null;
                $data['astraDescription'] = $serviceDesc['astraDescription'] ?? null;
            }

            // Operational detail
            if (! empty($completedDetail['operationalDetail'])) {
                $operationalDetail = $completedDetail['operationalDetail'];
                $data['packagingCode'] = $operationalDetail['packagingCode'] ?? null;
                $data['originLocationId'] = $operationalDetail['originLocationId'] ?? null;
                $data['destinationLocationId'] = $operationalDetail['destinationLocationId'] ?? null;
                $data['originServiceArea'] = $operationalDetail['originServiceArea'] ?? null;
                $data['destinationServiceArea'] = $operationalDetail['destinationServiceArea'] ?? null;
                $data['postalCode'] = $operationalDetail['postalCode'] ?? null;
                $data['countryCode'] = $operationalDetail['countryCode'] ?? null;
                $data['airportId'] = $operationalDetail['airportId'] ?? null;
                $data['astraPlannedServiceLevel'] = $operationalDetail['astraPlannedServiceLevel'] ?? null;
            }
        }

        // Shipment rating details (nested inside completedShipmentDetail)
        if (! empty($transactionShipment['completedShipmentDetail']['shipmentRating']['shipmentRateDetails'][0])) {
            $rateDetail = $transactionShipment['completedShipmentDetail']['shipmentRating']['shipmentRateDetails'][0];

            // Rate type and zone information
            $data['rateType'] = $rateDetail['rateType'] ?? null;
            $data['rateScale'] = $rateDetail['rateScale'] ?? null;
            $data['rateZone'] = $rateDetail['rateZone'] ?? null;
            $data['ratedWeightMethod'] = $rateDetail['ratedWeightMethod'] ?? null;
            $data['dimDivisor'] = $rateDetail['dimDivisor'] ?? null;
            $data['fuelSurchargePercent'] = $rateDetail['fuelSurchargePercent'] ?? null;

            // Totals and charges
            $data['totalBillingWeight'] = $rateDetail['totalBillingWeight']['value'] ?? null;
            $data['totalBaseCharge'] = $rateDetail['totalBaseCharge'] ?? null;
            $data['totalSurcharges'] = $rateDetail['totalSurcharges'] ?? null;
            $data['totalNetFedExCharge'] = $rateDetail['totalNetFedExCharge'] ?? null;
            $data['totalNetCharge'] = $rateDetail['totalNetCharge'] ?? null;

            // Surcharges (using first surcharge if available)
            if (! empty($rateDetail['surcharges'][0])) {
                $surcharge = $rateDetail['surcharges'][0];
                $data['surchargeType'] = $surcharge['surchargeType'] ?? null;
                $data['surchargeDescription'] = $surcharge['description'] ?? null;
                $data['surchargeAmount'] = $surcharge['amount'] ?? null;
            }
        }

        return $data;
    }
}
