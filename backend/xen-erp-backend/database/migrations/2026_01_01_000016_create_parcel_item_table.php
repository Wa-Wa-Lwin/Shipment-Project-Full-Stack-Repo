<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('Parcel_Item', function (Blueprint $table) {
            $table->increments('parcelItemID');
            $table->integer('parcel_id')->nullable()->index();
            $table->string('description')->nullable();
            $table->integer('quantity')->nullable()->default(1);
            $table->string('price_currency', 10)->nullable();
            $table->decimal('price_amount', 15, 2)->nullable();
            $table->string('item_id')->nullable();
            $table->string('origin_country', 5)->nullable();
            $table->string('weight_unit', 10)->nullable()->default('kg');
            $table->decimal('weight_value', 10, 3)->nullable();
            $table->string('sku')->nullable();
            $table->string('material_code')->nullable();
            $table->string('hs_code', 50)->nullable();
            $table->string('return_reason')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('Parcel_Item');
    }
};
