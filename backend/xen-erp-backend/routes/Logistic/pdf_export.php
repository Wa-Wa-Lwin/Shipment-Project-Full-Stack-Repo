<?php

use App\Http\Controllers\Logistic\PdfExportController;
use Illuminate\Support\Facades\Route;

Route::prefix('invoice_pdf')->group(function () {
    // Commercial Invoice PDF - Download (force download)
    Route::get('/download/{id}', [PdfExportController::class, 'downloadCommercialInvoice']);
});
