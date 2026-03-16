<?php

use App\Http\Controllers\Logistic\AddressListController;
use App\Http\Controllers\Logistic\CommonLogisticsController;
use App\Http\Controllers\Logistic\PackagingController;
use App\Http\Controllers\Logistic\RequestTopicController;
use Illuminate\Support\Facades\Route;

Route::group(['prefix' => 'common'], function () {
    Route::get('/packaging', [CommonLogisticsController::class, 'getAllPackagings']);
    Route::get('/commodity', [CommonLogisticsController::class, 'getAllCommodities']);
    Route::get('/listReqBOM', [CommonLogisticsController::class, 'listForRequestBOM']);
    Route::get('/request_topic', [RequestTopicController::class, 'getAllRequestTopics']);

    // AddressList
    Route::get('/getAddresslist', [AddressListController::class, 'getAddressList']);
    Route::get('/getAddresslist/{id}', [AddressListController::class, 'getAddressListById']);
    Route::post('/createAddress', [AddressListController::class, 'createAddress']);
    Route::post('/updateAddress/{id}', [AddressListController::class, 'updateAddress']);
    Route::post('/inactiveOrActiveAddress/{id}', [AddressListController::class, 'inactiveOrActiveAddress']);

    // Packaging
    Route::get('/getAllPackaging', [PackagingController::class, 'getAllPackaging']);
    Route::post('/createPackaging', [PackagingController::class, 'createPackaging']);
    Route::put('/updatePackaging/{id}', [PackagingController::class, 'updatePackaging']);
    Route::put('/inactivePackaging/{id}', [PackagingController::class, 'inactivePackaging']);

    // View Invoice File
    Route::get('/invoice/{filename}', function ($filename) {
        // Sanitize filename to prevent directory traversal
        $filename = basename($filename);
        $path = public_path('uploads/invoices/'.$filename);

        if (! file_exists($path)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Invoice file not found',
                'filename' => $filename,
            ], 404);
        }

        // Get file mime type for proper content-type header
        $mimeType = mime_content_type($path);

        return response()->file($path, [
            'Content-Type' => $mimeType,
            'Content-Disposition' => 'inline; filename="'.basename($filename).'"',
        ]);
    })->where('filename', '.*')->name('api.invoice.view');
});
