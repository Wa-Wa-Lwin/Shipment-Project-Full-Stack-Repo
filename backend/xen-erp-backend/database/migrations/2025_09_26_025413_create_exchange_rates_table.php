<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('exchange_rates', function (Blueprint $table) {
            $table->id();
            $table->string('base_currency', 3)->default('THB');
            $table->string('currency_code', 3);
            $table->decimal('rate', 15, 8);
            $table->string('provider')->nullable();
            $table->timestamp('rate_date');
            $table->timestamp('last_updated_time');
            $table->timestamps();

            $table->unique(['base_currency', 'currency_code']);
            $table->index('currency_code');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('exchange_rates');
    }
};
