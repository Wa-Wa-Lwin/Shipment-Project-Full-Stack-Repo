<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('Invoice_Data', function (Blueprint $table) {
            $table->increments('invoiceID');
            $table->integer('shipment_request_id')->nullable()->index();
            $table->string('invoice_number')->nullable();
            $table->string('beneficiary_bank')->nullable();
            $table->string('bank_swift_code', 20)->nullable();
            $table->string('bank_address')->nullable();
            $table->string('bank_account_no', 50)->nullable();
            $table->decimal('subtotal', 15, 2)->nullable();
            $table->decimal('freight', 15, 2)->nullable();
            $table->decimal('sales_tax', 15, 2)->nullable();
            $table->decimal('trade_discount', 15, 2)->nullable();
            $table->decimal('payment_credit_amount', 15, 2)->nullable();
            $table->decimal('balance_amount', 15, 2)->nullable();
            $table->string('balance_currency', 10)->nullable();
            $table->string('payment_terms')->nullable();
            $table->date('invoice_date')->nullable();
            $table->string('harmonized_code', 50)->nullable();
            $table->string('so_code')->nullable();
            $table->text('any_note')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('Invoice_Data');
    }
};
