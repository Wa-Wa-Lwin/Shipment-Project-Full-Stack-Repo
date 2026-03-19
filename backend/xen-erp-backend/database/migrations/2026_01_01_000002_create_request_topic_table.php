<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('Request_Topic', function (Blueprint $table) {
            $table->increments('reqTopicID');
            $table->string('request_topic');
            $table->string('active', 10)->default('1');
            $table->text('remark')->nullable();
            $table->integer('created_by_user_id')->nullable();
            $table->dateTime('created_at')->nullable();
            $table->integer('updated_by_user_id')->nullable();
            $table->dateTime('updated_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('Request_Topic');
    }
};
