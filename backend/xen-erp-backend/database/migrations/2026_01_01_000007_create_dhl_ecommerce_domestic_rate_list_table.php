<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('DHL_Ecommerce_Domestic_Rate_List', function (Blueprint $table) {
            $table->increments('dhlEcommerceDomesticRateListID');
            $table->decimal('min_weight_kg', 8, 3);
            $table->decimal('max_weight_kg', 8, 3);
            $table->decimal('bkk_charge_thb', 10, 2)->nullable();
            $table->decimal('upc_charge_thb', 10, 2)->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('DHL_Ecommerce_Domestic_Rate_List');
    }
};
