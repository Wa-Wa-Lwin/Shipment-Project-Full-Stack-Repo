<?php

namespace App\Http\Controllers\Logistic;

use App\Http\Controllers\Controller;
use App\Models\Logistic\ShipmentRequest;
use Illuminate\Http\Request;

class ShipmentRequestController extends Controller
{
    public function getAllShipmentRequests()
    {
        $shipmentRequests = ShipmentRequest::with([
            'shipmentRequestHistories',
            'parcels.items',
            'shipTo',
            'shipFrom',
            'rates',
            'invoiceDatas',
        ])->get();

        $shipmentRequestsCount = $shipmentRequests->count();

        $shipmentRequestsDesc = $shipmentRequests->reverse()->values();

        return response()->json([
            'shipment_requests_count' => $shipmentRequestsCount,
            'shipment_requests' => $shipmentRequests,
            'shipment_requests_desc' => $shipmentRequestsDesc,
        ], 200);
    }

    public function getShipmentRequestById($id)
    {
        $shipmentRequest = ShipmentRequest::with(
            'shipmentRequestHistories',
            'parcels', 'parcels.items',
            'shipTo',
            'shipFrom',
            'rates',
            'invoiceDatas'
        )->find($id);

        if (! $shipmentRequest) {
            return response()->json(['message' => 'Shipment Request not found'], 404);
        }

        return response()->json([
            'shipment_request' => $shipmentRequest,
        ], 200);
    }

    public function postShipmentRequestWithFilters(Request $request)
    {
        $query = ShipmentRequest::with(
            'shipmentRequestHistories',
            'parcels',
            'parcels.items',
            'shipTo',
            'shipFrom',
            'rates',
            'invoiceDatas'
        )->orderBy('shipmentRequestID', 'desc');

        $user_id = $request->input('user_id');
        $status = $request->input('status');
        $pagination_number = $request->input('pagination_number', 10);
        $page_number = $request->input('page_number', 1);
        $search_text = $request->input('search_text');

        if ($user_id !== null) {
            $query->where('created_user_id', $user_id);
        }

        if ($status !== null) {
            $query->where('request_status', $status);
        }

        // Clone query before pagination
        $countQuery = clone $query;
        $shipmentRequestsCount = $countQuery->count();

        // Calculate offset
        $offset = max(($page_number - 1) * $pagination_number, 0);

        $shipmentRequests = $query->skip($offset)->take($pagination_number)->get();

        if ($shipmentRequests->isEmpty()) {
            return response()->json(['message' => 'No Shipment Requests found'], 404);
        }

        return response()->json([
            'pagination_number' => $pagination_number,
            'shipment_requests_count' => $shipmentRequestsCount,
            'shipment_requests' => $shipmentRequests,
        ], 200);
    }
}
