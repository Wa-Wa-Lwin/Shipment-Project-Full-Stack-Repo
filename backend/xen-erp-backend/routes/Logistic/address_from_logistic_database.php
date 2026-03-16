<?php

use App\Http\Controllers\Logistic\AddressListExportImportController;
use Illuminate\Support\Facades\Route;

// AddressList Export/Import
Route::get('/exportAddresses', [AddressListExportImportController::class, 'exportAddresses']);
Route::get('/exportAddressTemplate', [AddressListExportImportController::class, 'exportTemplate']);
Route::get('/getAddressListForExport', [AddressListExportImportController::class, 'getAddressList']);

Route::post('/importAddresses', [AddressListExportImportController::class, 'importAddresses']);
