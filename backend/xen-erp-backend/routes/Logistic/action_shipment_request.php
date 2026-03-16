<?php

use App\Http\Controllers\Logistic\ApprovalController;
use App\Http\Controllers\Logistic\CancelRequestController;
use App\Http\Controllers\Logistic\CreateLabelController;
use App\Http\Controllers\Logistic\CreatePickupController;
use App\Http\Controllers\Logistic\EmailTemplateController;
use App\Http\Controllers\Logistic\FedEx\CancelLabelViaFedExController;
use App\Http\Controllers\Logistic\FedEx\FedExController;
use App\Http\Controllers\Logistic\FedEx\FedExShipmentController;
use App\Http\Controllers\Logistic\ShipmentRequestController;
use App\Http\Controllers\Logistic\SubmitRequestController;
use App\Http\Controllers\Logistic\UpdateRequestController;
use App\Services\ScheduleLabelCreationService;
use Illuminate\Support\Facades\Route;

Route::group(['prefix' => 'shipment_request'], function () {

    Route::get('/', [ShipmentRequestController::class, 'getAllShipmentRequests']);
    Route::get('/id/{id}', [ShipmentRequestController::class, 'getShipmentRequestById']);

    Route::post('/new', [SubmitRequestController::class, 'submitRequest']);

    Route::post('/update/{id}', [UpdateRequestController::class, 'updateRequest']);
    Route::put('/logistic_update/{id}', [UpdateRequestController::class, 'logisticUpdateRequest']);

    Route::put('/action_approver/{id}', [ApprovalController::class, 'actionApprover']);

    Route::put('/change_pickup_datetime/{id}', [UpdateRequestController::class, 'changePickupDateTime']);

    Route::put('/change_invoice_data/{id}', [UpdateRequestController::class, 'changeInvoiceData']);

    Route::put('/change_tracking_number/{id}', [UpdateRequestController::class, 'changeTrackingNumber']);

    Route::put('/cancel/{id}', [CancelRequestController::class, 'cancelRequest']);

    Route::put('/change_testing_status/{id}', [UpdateRequestController::class, 'changeTestingStatus']);
});

Route::post('/warehouse_notification/{id}', [EmailTemplateController::class, 'warehouseNotification']);

Route::post('/requestor_requested_mail/{id}', [EmailTemplateController::class, 'requestorRequestedMail']);

// validate shipment payload before creating label
Route::post('/validate_shipment_payload/{id}', [CreateLabelController::class, 'validateShipmentPayload']);

// create label in Aftership - with automatic pickup creation
Route::post('/create_label/{id}', [CreateLabelController::class, 'createLabel']);

// create pickup in Aftership - if automatic pickup creation is failed, then logistic can do manual pickup creation
Route::post('/create_pickup/{id}', [CreatePickupController::class, 'createPickup']);

// automated FedEx pickup scheduling for tomorrow (FedEx only allows booking for today and tomorrow)
// This is automatically run daily at 10 AM via Laravel scheduler
// Manual trigger endpoint for testing or manual execution
Route::post('/automate_schedule_pickup', [CreateLabelController::class, 'automateSchedulePickup']);

// automated FedEx label creation scheduling for shipments with ship_date > 10 days
// This is automatically run daily at 08:00 AM via Laravel scheduler
// Manual trigger endpoint for testing or manual execution
Route::post('/automate_schedule_label_creation', function () {
    $service = app(ScheduleLabelCreationService::class);

    return $service->automateScheduleLabelCreation();
});

Route::group(['prefix' => 'fedex_api'], function () {

    // Get all FedEx shipment requests
    Route::get('/get_all', [FedExShipmentController::class, 'getAll']);

    // Get one FedEx shipment request by ID
    Route::get('/get_one/{id}', [FedExShipmentController::class, 'getOne']);

    // Validate FedEx shipment payload
    Route::post('/validate_shipment_payload/{id}', [FedExController::class, 'validateShipmentPayloadFedEx']);

    Route::post('/create_label_via_fedex_api_direct/{id}', [FedExShipmentController::class, 'createLabelViaFedex']);
    Route::post('/create_pickup_via_fedex_api_direct/{id}', [FedExShipmentController::class, 'createPickupViaFedex']);

    Route::post('/cancel_with_shipment_request_id/{id}', [CancelLabelViaFedExController::class, 'cancelShipmentViaFedex_with_shipment_request_id']);
    Route::post('/cancel_with_FedexApiId/{id}', [CancelLabelViaFedExController::class, 'cancelShipmentViaFedex_with_FedexApiId']);
});
