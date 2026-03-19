<?php

use App\Http\Controllers\Logistic\UserListController;
use Illuminate\Support\Facades\Route;

// User List Management Routes
Route::get('/get_all_user_data', [UserListController::class, 'getAllUsersWithRelations']);
Route::get('/get_user/{id}', [UserListController::class, 'getUser']);
Route::post('/create_user', [UserListController::class, 'createUser']);
Route::put('/update_user/{id}', [UserListController::class, 'updateUser']);
Route::patch('/activate_user/{id}', [UserListController::class, 'activateUser']);
Route::patch('/deactivate_user/{id}', [UserListController::class, 'deactivateUser']);
