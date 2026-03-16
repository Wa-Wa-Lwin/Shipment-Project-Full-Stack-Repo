<?php

use App\Http\Controllers\Logistic\LogisticsController;
use Illuminate\Support\Facades\Route;

Route::group(['prefix' => '/api/logistics'], function () {
    Route::get('address', [LogisticsController::class, 'address']);
    Route::post('assetList', [LogisticsController::class, 'assetList']);
    Route::post('getrates', [LogisticsController::class, 'getRates']);
    Route::post('calrates', [LogisticsController::class, 'calRates']);
    Route::post('calratesV2', [LogisticsController::class, 'calRatesV2']);

    require __DIR__.'/rate_request.php';
    require __DIR__.'/shipper_account.php';
    require __DIR__.'/action_shipment_request.php';
    require __DIR__.'/dashboard.php';
    require __DIR__.'/pdf_export.php';
    require __DIR__.'/common.php';
    require __DIR__.'/user_data.php';
    require __DIR__.'/address_from_xendb.php';
    require __DIR__.'/aftership.php';
    require __DIR__.'/address_from_logistic_database.php';
    require __DIR__.'/parcel_box_type.php';
    require __DIR__.'/sap_enterpryze.php';
    require __DIR__.'/user_role_list.php';

    Route::get('', function () {
        return phpinfo();
    });
});

// Route::get('/', [ShipmentRequestController::class, 'getAllShipmentRequests']);
// use Illuminate\Support\Facades\Route;
// use App\Http\Controllers\Logistic\PdfExportController;

// Route::prefix('invoice_pdf')->group(function () {
//     Route::get('/', [PdfExportController::class, 'exportInvoicePdf']);
//     Route::get('/invoice_pdf_view/{id}', [PdfExportController::class, 'showInvoice']);
// });
