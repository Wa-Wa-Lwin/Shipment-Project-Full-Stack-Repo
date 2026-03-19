<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('Bill_To_Address', function (Blueprint $table) {
            $table->increments('billToAddressID');
            $table->integer('shipment_request_id')->nullable()->index();
            $table->string('country', 5)->nullable();
            $table->string('contact_name')->nullable();
            $table->string('phone', 50)->nullable();
            $table->string('fax', 50)->nullable();
            $table->string('email')->nullable();
            $table->string('company_name')->nullable();
            $table->string('company_url')->nullable();
            $table->string('street1')->nullable();
            $table->string('street2')->nullable();
            $table->string('street3')->nullable();
            $table->string('city')->nullable();
            $table->string('state')->nullable();
            $table->string('postal_code', 20)->nullable();
            $table->string('tax_id', 100)->nullable();
            $table->dateTime('created_at')->nullable();
            $table->string('created_by_user_name')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('Bill_To_Address');
    }
};
