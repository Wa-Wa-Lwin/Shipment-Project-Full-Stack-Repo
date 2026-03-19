<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('Rate_Request', function (Blueprint $table) {
            $table->increments('rateRequestID');
            $table->integer('ship_from_id')->nullable();
            $table->integer('ship_to_id')->nullable();
            $table->text('service_options')->nullable();
            $table->string('status', 50)->nullable();
            $table->string('created_by_user_name')->nullable();
            $table->string('created_by_user_id')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('Rate_Request');
    }
};
