<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('Parcel_Box_Type', function (Blueprint $table) {
            // Not auto-increment — IDs are assigned manually
            $table->integer('parcelBoxTypeID')->primary();
            $table->string('type', 50)->nullable();
            $table->string('box_type_name')->nullable();
            $table->decimal('depth', 10, 2)->nullable();
            $table->decimal('width', 10, 2)->nullable();
            $table->decimal('height', 10, 2)->nullable();
            $table->string('dimension_unit', 10)->nullable()->default('cm');
            $table->decimal('parcel_weight', 10, 3)->nullable();
            $table->string('weight_unit', 10)->nullable()->default('kg');
            $table->text('remark')->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('Parcel_Box_Type');
    }
};
