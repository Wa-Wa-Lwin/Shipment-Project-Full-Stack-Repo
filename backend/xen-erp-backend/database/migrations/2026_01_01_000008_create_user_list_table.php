<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('User_List', function (Blueprint $table) {
            $table->increments('userID');
            $table->string('username')->unique();
            $table->string('password');
            $table->string('firstName')->nullable();
            $table->string('lastName')->nullable();
            $table->string('gender', 10)->nullable();
            $table->string('phone', 50)->nullable();
            $table->string('email')->nullable();
            $table->string('departmentID')->nullable();
            $table->string('section_index')->nullable();
            $table->string('postitionID')->nullable();  // note: matches model typo
            $table->string('active', 10)->default('1');
            $table->string('role', 50)->nullable();
            $table->string('user_code', 50)->nullable();
            $table->integer('supervisorID')->nullable();
            $table->string('level', 50)->nullable();
            $table->integer('headID')->nullable();
            $table->string('logisticRole', 100)->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('User_List');
    }
};
