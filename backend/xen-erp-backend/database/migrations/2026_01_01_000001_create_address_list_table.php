<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('Address_List', function (Blueprint $table) {
            $table->increments('addressID');
            $table->string('CardCode')->nullable();
            $table->string('company_name')->nullable();
            $table->string('CardType', 50)->nullable();
            $table->text('full_address')->nullable();
            $table->string('street1')->nullable();
            $table->string('street2')->nullable();
            $table->string('street3')->nullable();
            $table->string('city')->nullable();
            $table->string('state')->nullable();
            $table->string('country', 100)->nullable();
            $table->string('postal_code', 20)->nullable();
            $table->string('contact_name')->nullable();
            $table->string('contact')->nullable();
            $table->string('phone', 50)->nullable();
            $table->string('email')->nullable();
            $table->string('tax_id', 100)->nullable();
            $table->string('phone1', 50)->nullable();
            $table->string('website')->nullable();
            $table->string('active', 10)->nullable()->default('1');
            $table->integer('created_userID')->nullable();
            $table->dateTime('created_time')->nullable();
            $table->integer('updated_userID')->nullable();
            $table->dateTime('updated_time')->nullable();
            $table->string('created_user_name')->nullable();
            $table->string('updated_user_name')->nullable();
            $table->string('eori_number', 100)->nullable();
            $table->string('bind_incoterms', 100)->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('Address_List');
    }
};
