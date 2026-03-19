<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('Parcel', function (Blueprint $table) {
            $table->increments('parcelID');
            $table->integer('shipment_request_id')->nullable()->index();
            $table->string('box_type_name')->nullable();
            $table->decimal('width', 10, 2)->nullable();
            $table->decimal('height', 10, 2)->nullable();
            $table->decimal('depth', 10, 2)->nullable();
            $table->string('dimension_unit', 10)->nullable()->default('cm');
            $table->decimal('weight_value', 10, 3)->nullable();
            $table->decimal('net_weight_value', 10, 3)->nullable();
            $table->decimal('parcel_weight_value', 10, 3)->nullable();
            $table->string('weight_unit', 10)->nullable()->default('kg');
            $table->text('description')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('Parcel');
    }
};
