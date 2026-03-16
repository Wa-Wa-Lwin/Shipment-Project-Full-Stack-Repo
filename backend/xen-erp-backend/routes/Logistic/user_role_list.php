<?php

use App\Http\Controllers\Logistic\UserRoleListController;
use Illuminate\Support\Facades\Route;

Route::group(['prefix' => 'user_role_list'], function () {
    // Get all user roles
    Route::get('/', [UserRoleListController::class, 'getAllUserRoles']);

    // Get single user role by ID
    Route::get('/{id}', [UserRoleListController::class, 'getUserRole']);

    // Get user role by email
    Route::get('/email/{email}', [UserRoleListController::class, 'getUserRoleByEmail']);

    // Create new user role
    Route::post('/', [UserRoleListController::class, 'createUserRole']);

    // Update user role
    Route::put('/{id}', [UserRoleListController::class, 'updateUserRole']);

    // Delete user role
    Route::delete('/{id}', [UserRoleListController::class, 'deleteUserRole']);
});
