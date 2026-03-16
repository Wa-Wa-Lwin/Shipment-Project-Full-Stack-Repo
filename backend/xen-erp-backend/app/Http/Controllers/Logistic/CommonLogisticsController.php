<?php

namespace App\Http\Controllers\Logistic;

use App\Models\Logistic\Commodity;
use Illuminate\Http\Request;

class CommonLogisticsController
{
    public function listForRequestBOM(Request $request)
    {
        $results = app('db')->select('EXEC [dbo].[Sp_Material_For_Request_Shipment]'); // Sp_Material_For_Request_BOM

        $results = json_decode($results[0]->ret_obj);
        // $results[0]->data = base64_encode(json_encode($results[0]->data[0]));
        $results = $results[0];

        return response()->json($results);
    }

    public function getAllCommodities()
    {
        $commodities = Commodity::all();

        return response()->json([
            'commodities' => $commodities,
        ], 200);
    }
}
