<?php

use App\Http\Controllers\Logistic\ParcelBoxTypesController;
use Illuminate\Support\Facades\Route;

Route::group(['prefix' => 'parcel-box-types'], function () {
    // Get all parcel box types
    Route::get('/', [ParcelBoxTypesController::class, 'getAllParcelBoxTypes']);

    // Get single parcel box type by ID
    Route::get('/{id}', [ParcelBoxTypesController::class, 'getParcelBoxType']);

    // Create new parcel box type
    Route::post('/', [ParcelBoxTypesController::class, 'createParcelBoxType']);

    // Update parcel box type
    Route::put('/{id}', [ParcelBoxTypesController::class, 'updateParcelBoxType']);

    // Delete parcel box type
    Route::delete('/{id}', [ParcelBoxTypesController::class, 'deleteParcelBoxType']);
});
