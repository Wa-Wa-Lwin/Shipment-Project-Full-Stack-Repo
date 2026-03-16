<?php

use App\Http\Controllers\Logistic\AfterShipController;
use Illuminate\Support\Facades\Route;

// AfterShip Label Management
Route::get('/aftership/labels', [AfterShipController::class, 'getAllLabels']);
Route::get('/aftership/labels/{labelId}', [AfterShipController::class, 'getLabel']);
Route::post('/aftership/cancel-label', [AfterShipController::class, 'cancelLabel']);
