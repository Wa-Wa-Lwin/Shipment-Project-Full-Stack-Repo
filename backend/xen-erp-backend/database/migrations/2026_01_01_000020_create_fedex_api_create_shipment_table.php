<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('FedExAPICreateShipment', function (Blueprint $table) {
            $table->increments('fedExApiShipmentID');
            $table->integer('shipment_request_id')->nullable()->index();
            $table->string('transactionId')->nullable();
            $table->string('masterTrackingNumber')->nullable();
            $table->string('serviceType', 50)->nullable();
            $table->date('shipDatestamp')->nullable();
            $table->string('serviceName')->nullable();
            $table->string('serviceCategory', 50)->nullable();
            $table->string('trackingNumber')->nullable();

            // Charges
            $table->decimal('additionalChargesDiscount', 15, 2)->nullable();
            $table->decimal('netRateAmount', 15, 2)->nullable();
            $table->decimal('netChargeAmount', 15, 2)->nullable();
            $table->decimal('netDiscountAmount', 15, 2)->nullable();
            $table->string('currency', 10)->nullable();
            $table->decimal('codcollectionAmount', 15, 2)->nullable();
            $table->decimal('baseRateAmount', 15, 2)->nullable();

            // Package document
            $table->text('packageDocument_url')->nullable();
            $table->string('packageDocument_contentType')->nullable();
            $table->string('packageDocument_docType', 50)->nullable();
            $table->integer('packageDocument_copiesToPrint')->nullable();

            // Customer reference
            $table->string('customerReferenceType', 50)->nullable();
            $table->string('customerReferenceValue')->nullable();

            // Carrier/service
            $table->string('carrierCode', 20)->nullable();
            $table->string('serviceId')->nullable();
            $table->string('serviceCode', 20)->nullable();
            $table->string('description')->nullable();
            $table->string('packagingDescription')->nullable();
            $table->string('packagingCode', 50)->nullable();

            // Location
            $table->string('originLocationId')->nullable();
            $table->string('destinationLocationId')->nullable();
            $table->string('originServiceArea')->nullable();
            $table->string('destinationServiceArea')->nullable();
            $table->string('postalCode', 20)->nullable();
            $table->string('countryCode', 5)->nullable();
            $table->string('airportId', 10)->nullable();
            $table->string('astraPlannedServiceLevel')->nullable();

            // Rate
            $table->string('rateType', 50)->nullable();
            $table->string('rateScale')->nullable();
            $table->string('rateZone')->nullable();
            $table->string('ratedWeightMethod', 50)->nullable();
            $table->integer('dimDivisor')->nullable();
            $table->decimal('fuelSurchargePercent', 8, 4)->nullable();
            $table->decimal('totalBillingWeight', 10, 3)->nullable();
            $table->decimal('totalBaseCharge', 15, 2)->nullable();
            $table->decimal('totalSurcharges', 15, 2)->nullable();
            $table->decimal('totalNetFedExCharge', 15, 2)->nullable();
            $table->decimal('totalNetCharge', 15, 2)->nullable();

            // Surcharge
            $table->string('surchargeType', 50)->nullable();
            $table->string('surchargeDescription')->nullable();
            $table->decimal('surchargeAmount', 15, 2)->nullable();

            // Pickup
            $table->dateTime('pickup_readyPickupDateTime')->nullable();
            $table->dateTime('pickup_latestPickupDateTime')->nullable();
            $table->text('pickup_courierInstructions')->nullable();
            $table->string('pickup_requestType', 50)->nullable();
            $table->string('pickup_requestSource', 50)->nullable();

            // Shipper
            $table->string('shipper_personName')->nullable();
            $table->string('shipper_companyName')->nullable();
            $table->string('shipper_emailAddress')->nullable();
            $table->string('shipper_phoneNumber', 50)->nullable();
            $table->string('shipper_streetLines')->nullable();
            $table->string('shipper_city')->nullable();
            $table->string('shipper_stateOrProvinceCode', 10)->nullable();
            $table->string('shipper_postalCode', 20)->nullable();
            $table->string('shipper_countryCode', 5)->nullable();

            // Recipient
            $table->string('recipient_personName')->nullable();
            $table->string('recipient_companyName')->nullable();
            $table->string('recipient_emailAddress')->nullable();
            $table->string('recipient_phoneNumber', 50)->nullable();
            $table->string('recipient_streetLines')->nullable();
            $table->string('recipient_city')->nullable();
            $table->string('recipient_stateOrProvinceCode', 10)->nullable();
            $table->string('recipient_postalCode', 20)->nullable();
            $table->string('recipient_countryCode', 5)->nullable();

            // Payment
            $table->string('paymentType', 50)->nullable();
            $table->string('payorAccountNumber', 50)->nullable();

            // Package
            $table->integer('sequenceNumber')->nullable();
            $table->decimal('weight_value', 10, 3)->nullable();
            $table->string('weight_units', 10)->nullable();
            $table->decimal('dimensions_length', 10, 2)->nullable();
            $table->decimal('dimensions_width', 10, 2)->nullable();
            $table->decimal('dimensions_height', 10, 2)->nullable();
            $table->string('dimensions_units', 10)->nullable();
            $table->string('itemDescription')->nullable();

            // Misc
            $table->string('accountNumber', 50)->nullable();
            $table->string('labelResponseOptions', 50)->nullable();
            $table->text('raw_json')->nullable();
            $table->dateTime('createdAt')->nullable();
            $table->string('created_status', 50)->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('FedExAPICreateShipment');
    }
};
