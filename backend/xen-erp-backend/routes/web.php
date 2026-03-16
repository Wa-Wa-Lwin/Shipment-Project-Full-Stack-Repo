<?php

use App\Http\Controllers\Api\ExchangeRateController;
use App\Http\Controllers\MicrosoftAuthController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect('/xeno-shipment/shipment');
    // return view('welcome');
});
//

require __DIR__.'/Logistic/logistics.php';

// Exchange Rate API Routes
Route::prefix('api/exchange-rates')->group(function () {
    Route::get('/rates', [ExchangeRateController::class, 'getRates']);
    Route::get('/rate', [ExchangeRateController::class, 'getSpecificRate']);
    Route::get('/convert', [ExchangeRateController::class, 'convert']);
    Route::post('/refresh', [ExchangeRateController::class, 'refresh']);
});

Route::post('/api/logistics/login/microsoft', [MicrosoftAuthController::class, 'login']);

// Serve uploaded invoice files
Route::get('/uploads/invoices/{filename}', function ($filename) {
    $path = public_path('uploads/invoices/'.$filename);

    if (! file_exists($path)) {
        abort(404, 'Invoice file not found');
    }

    // Get file mime type for proper content-type header
    $mimeType = mime_content_type($path);

    return response()->file($path, [
        'Content-Type' => $mimeType,
        'Content-Disposition' => 'inline; filename="'.basename($filename).'"',
    ]);
})->where('filename', '.*')->name('invoice.view');
