<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('Packaging', function (Blueprint $table) {
            $table->increments('packageID');
            $table->string('package_type', 50)->nullable();
            $table->string('package_type_name')->nullable();
            $table->string('package_purpose', 50)->nullable();
            $table->decimal('package_length', 10, 2)->nullable();
            $table->decimal('package_width', 10, 2)->nullable();
            $table->decimal('package_height', 10, 2)->nullable();
            $table->string('package_dimension_unit', 10)->nullable()->default('cm');
            $table->decimal('package_weight', 10, 3)->nullable();
            $table->string('package_weight_unit', 10)->nullable()->default('kg');
            $table->text('remark')->nullable();
            $table->string('created_by_user_name')->nullable();
            $table->string('created_by_user_id')->nullable();
            $table->dateTime('created_at')->nullable();
            $table->string('updated_by_user_name')->nullable();
            $table->string('updated_by_user_id')->nullable();
            $table->dateTime('updated_at')->nullable();
            $table->string('active', 10)->default('1');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('Packaging');
    }
};
