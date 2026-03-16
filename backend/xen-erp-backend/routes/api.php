<?php

use App\Http\Controllers\Logistic\DHLEcommerceDomesticRateListController;
use App\Http\Controllers\Logistic\FedEx\FedExController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// FedEx API Routes
Route::prefix('fedex')->group(function () {
    Route::post('/rate-quotes', [FedExController::class, 'getRateQuotes']);
    Route::post('/quick-rate', [FedExController::class, 'getQuickRate']);
    Route::get('/token', [FedExController::class, 'getToken']);
    Route::delete('/token', [FedExController::class, 'clearTokenCache']);
});

// DHL_Ecommerce_Domestic_Rate_List API Routes
Route::prefix('dhl_ecommerce_domestic_rate_list')->group(function () {
    Route::get('/', [DHLEcommerceDomesticRateListController::class, 'get_all']);
    Route::post('/create', [DHLEcommerceDomesticRateListController::class, 'create']);
    Route::put('/update/{id}', [DHLEcommerceDomesticRateListController::class, 'update']);
    Route::delete('/delete/{id}', [DHLEcommerceDomesticRateListController::class, 'delete']);
});
