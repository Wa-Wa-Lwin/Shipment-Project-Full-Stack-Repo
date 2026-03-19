<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('Shipper_Account', function (Blueprint $table) {
            // String primary key, not auto-increment
            $table->string('shipperAccountID')->primary();
            $table->string('description')->nullable();
            $table->string('slug')->nullable();
            $table->string('status', 50)->nullable();
            $table->string('timezone', 100)->nullable();
            $table->string('type', 50)->nullable();
            $table->decimal('account_balance', 15, 2)->nullable();
            $table->text('settings')->nullable();         // JSON
            $table->boolean('enabled')->default(true);
            $table->text('extra_info')->nullable();      // JSON
            $table->string('address_country', 5)->nullable();
            $table->string('address_contact_name')->nullable();
            $table->string('address_phone', 50)->nullable();
            $table->string('address_fax', 50)->nullable();
            $table->string('address_email')->nullable();
            $table->string('address_company_name')->nullable();
            $table->string('address_company_url')->nullable();
            $table->string('address_street1')->nullable();
            $table->string('address_street2')->nullable();
            $table->string('address_street3')->nullable();
            $table->string('address_city')->nullable();
            $table->string('address_state')->nullable();
            $table->string('address_postal_code', 20)->nullable();
            $table->string('address_type', 50)->nullable();
            $table->string('address_tax_id', 100)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('Shipper_Account');
    }
};
