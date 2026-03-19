<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('User_Role_List', function (Blueprint $table) {
            $table->increments('userRoleListID');
            $table->string('Email')->unique();
            $table->boolean('Logistic')->default(false);
            $table->boolean('Developer')->default(false);
            $table->boolean('Approver')->default(false);
            $table->boolean('Supervisor')->default(false);
            $table->boolean('Warehouse')->default(false);
            $table->string('created_user_email')->nullable();
            $table->string('updated_user_email')->nullable();
            $table->dateTime('created_at')->nullable();
            $table->dateTime('updated_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('User_Role_List');
    }
};
