<?php

use App\Http\Controllers\SAPEnterpryze\SAPController;
use App\Http\Controllers\SAPEnterpryze\SAPPurchaseOrderListController;
use App\Http\Controllers\SAPEnterpryze\SAPSalesController;
use App\Http\Controllers\SAPEnterpryze\SAPSalesInvoiceListController;
use Illuminate\Support\Facades\Route;

// SAP Enterpryze API Routes
Route::prefix('sap_enterpryze')->group(function () {
    Route::get('/login', [SAPController::class, 'login']);
    Route::get('/getpo_alldata', [SAPController::class, 'getpo_alldata']);
    Route::get('/getpoNext20_alldata', [SAPController::class, 'getpoNext20_alldata']);
    Route::get('/getpo_numbers', [SAPController::class, 'getpo_numbers']);
    Route::get('/getpoNext20_numbers', [SAPController::class, 'getpoNext20_numbers']);
    Route::post('/getpo', [SAPController::class, 'getpo']);
    Route::post('/getpo_by_number', [SAPController::class, 'getpo_by_number']);
    Route::put('/update/{id}', [SAPController::class, 'update']);
    Route::delete('/delete/{id}', [SAPController::class, 'delete']);

    // Purchase Order List (paginated)
    Route::get('/get_all_pos', [SAPPurchaseOrderListController::class, 'getAllPOs']);

    // Sales Invoice Routes
    Route::get('/get_all_sales_invoices', [SAPSalesInvoiceListController::class, 'getAllSalesInvoices']);
    Route::post('/getsalesinv_by_number', [SAPSalesController::class, 'getsalesinv_by_number']);
    Route::post('/getsalesinv_by_number_raw_response', [SAPSalesController::class, 'getsalesinv_by_number_raw_response']);

    // Test SQL Query
    Route::get('/getTop10po_query', [SAPController::class, 'getTop10po_query']);

});
