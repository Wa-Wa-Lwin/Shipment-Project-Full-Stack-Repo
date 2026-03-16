<?php

namespace App\Http\Controllers\Logistic;

use App\Http\Controllers\Controller;
use App\Models\Logistic\DHLEcommerceDomesticRateList;
use Illuminate\Http\Request;

class DHLEcommerceDomesticRateListController extends Controller
{
    public function get_all()
    {
        $data = DHLEcommerceDomesticRateList::get();

        return response()->json([
            'data' => $data,
            'count' => $data->count(),
        ], 200);
    }

    public function create(Request $request)
    {
        $request->validate([
            'min_weight_kg' => 'required|numeric',
            'max_weight_kg' => 'required|numeric',
            'bkk_charge_thb' => 'required|integer',
            'upc_charge_thb' => 'required|integer',
        ]);

        $rate = DHLEcommerceDomesticRateList::create($request->all());

        return response()->json([
            'message' => 'Created successfully',
            'data' => $rate,
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $rate = DHLEcommerceDomesticRateList::find($id);

        if (! $rate) {
            return response()->json([
                'message' => 'Not found',
            ], 404);
        }

        $rate->update($request->all());

        return response()->json([
            'message' => 'Updated successfully',
            'data' => $rate,
        ], 200);
    }

    public function delete($id)
    {
        $rate = DHLEcommerceDomesticRateList::find($id);

        if (! $rate) {
            return response()->json([
                'message' => 'Not found',
            ], 404);
        }

        $rate->delete();

        return response()->json([
            'message' => 'Deleted successfully',
        ], 200);
    }
}
