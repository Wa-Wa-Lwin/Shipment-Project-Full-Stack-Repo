<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('Commodity', function (Blueprint $table) {
            $table->increments('commodityID');
            $table->string('commodity_description')->nullable();
            $table->string('description_thai')->nullable();
            $table->string('hscode', 50)->nullable();
            $table->decimal('duty', 8, 2)->nullable();
            $table->string('supplierID')->nullable();
            $table->string('supplierCode')->nullable();
            $table->text('Remark')->nullable();
            $table->string('created_by_user_name')->nullable();
            $table->string('created_by_user_id')->nullable();
            $table->dateTime('created_at')->nullable();
            $table->string('updated_by_user_name')->nullable();
            $table->string('updated_by_user_id')->nullable();
            $table->dateTime('updated_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('Commodity');
    }
};
