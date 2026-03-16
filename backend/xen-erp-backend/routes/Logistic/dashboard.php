<?php

use App\Http\Controllers\Logistic\DashboardController;
use Illuminate\Support\Facades\Route;

Route::group(['prefix' => 'dashboard'], function () {

    // New insightful dashboard endpoints
    Route::post('/overview', [DashboardController::class, 'action_get_dashboard_overview']);
    Route::post('/analytics', [DashboardController::class, 'action_get_analytics']);
    Route::post('/pending_actions', [DashboardController::class, 'action_get_pending_actions']);
    Route::post('/year_comparison', [DashboardController::class, 'action_get_year_comparison']);

    // Legacy endpoints (kept for backward compatibility)
    Route::post('/get_requests_per_month', [DashboardController::class, 'action_get_requests_per_month']);
    Route::post('/get_requests_per_year', [DashboardController::class, 'action_get_requests_per_year']);

});
