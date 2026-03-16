<?php

use App\Http\Controllers\Logistic\GetAddressListFromXenDBController;
use Illuminate\Support\Facades\Route;

Route::get('/get_address_view', [GetAddressListFromXenDBController::class, 'getAddressView']);
