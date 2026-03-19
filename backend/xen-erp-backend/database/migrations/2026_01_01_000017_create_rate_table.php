<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('Rate', function (Blueprint $table) {
            $table->increments('rateID');
            $table->integer('shipment_request_id')->nullable()->index();
            $table->string('shipper_account_id')->nullable();
            $table->string('shipper_account_slug')->nullable();
            $table->string('shipper_account_description')->nullable();
            $table->string('service_type')->nullable();
            $table->string('service_name')->nullable();
            $table->dateTime('pickup_deadline')->nullable();
            $table->dateTime('booking_cut_off')->nullable();
            $table->dateTime('delivery_date')->nullable();
            $table->integer('transit_time')->nullable();
            $table->text('error_message')->nullable();
            $table->text('info_message')->nullable();
            $table->decimal('charge_weight_value', 10, 3)->nullable();
            $table->string('charge_weight_unit', 10)->nullable();
            $table->decimal('total_charge_amount', 15, 2)->nullable();
            $table->string('total_charge_currency', 10)->nullable();
            $table->boolean('chosen')->default(false);
            $table->text('detailed_charges')->nullable();
            $table->boolean('past_chosen')->default(false);
            $table->string('created_user_name')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('Rate');
    }
};
