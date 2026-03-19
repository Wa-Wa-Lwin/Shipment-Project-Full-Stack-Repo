<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('Shipment_Request_History', function (Blueprint $table) {
            $table->increments('shipmentRequestHistoryID');
            $table->integer('shipment_request_id')->nullable()->index();
            $table->dateTime('shipment_request_created_date_time')->nullable();
            $table->string('user_id')->nullable();
            $table->string('user_name')->nullable();
            $table->string('user_role', 50)->nullable();
            $table->string('status', 50)->nullable();
            $table->text('remark')->nullable();
            $table->integer('history_count')->default(0);
            $table->dateTime('history_record_date_time')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('Shipment_Request_History');
    }
};
