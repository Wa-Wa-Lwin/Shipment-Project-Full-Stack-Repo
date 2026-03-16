<?php

namespace App\Http\Controllers\Logistic;

use App\Http\Controllers\Controller;
use App\Models\Logistic\ParcelBoxTypes;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class ParcelBoxTypesController extends Controller
{
    /**
     * Get all parcel box types
     */
    public function getAllParcelBoxTypes()
    {
        try {
            $allParcelBoxTypes = ParcelBoxTypes::orderBy('parcelBoxTypeID', 'asc')->get();

            return response()->json([
                'status' => 'success',
                'data' => $allParcelBoxTypes,
                'count' => $allParcelBoxTypes->count(),
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve parcel box types',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get a single parcel box type by ID
     */
    public function getParcelBoxType($id)
    {
        try {
            $parcelBoxType = ParcelBoxTypes::find($id);

            if (! $parcelBoxType) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Parcel box type not found',
                ], 404);
            }

            return response()->json([
                'status' => 'success',
                'data' => $parcelBoxType,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve parcel box type',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Create a new parcel box type
     */
    public function createParcelBoxType(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'parcelBoxTypeID' => 'required|integer|unique:Parcel_Box_Type,parcelBoxTypeID',
            'type' => 'required|string|max:100',
            'box_type_name' => 'required|string|max:150',
            'depth' => 'required|numeric',
            'width' => 'required|numeric',
            'height' => 'required|numeric',
            'dimension_unit' => 'required|string|max:10',
            'parcel_weight' => 'required|numeric',
            'weight_unit' => 'required|string|max:10',
            'remark' => 'nullable|string|max:255',
            'active' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        DB::beginTransaction();

        try {
            $data = $validator->validated();
            $data['created_at'] = now();
            $data['updated_at'] = now();

            $parcelBoxType = ParcelBoxTypes::create($data);

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Parcel box type created successfully',
                'data' => $parcelBoxType,
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'status' => 'error',
                'message' => 'Failed to create parcel box type',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update an existing parcel box type
     */
    public function updateParcelBoxType(Request $request, $id)
    {
        $parcelBoxType = ParcelBoxTypes::find($id);

        if (! $parcelBoxType) {
            return response()->json([
                'status' => 'error',
                'message' => 'Parcel box type not found',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'type' => 'nullable|string|max:100',
            'box_type_name' => 'nullable|string|max:150',
            'depth' => 'nullable|numeric',
            'width' => 'nullable|numeric',
            'height' => 'nullable|numeric',
            'dimension_unit' => 'nullable|string|max:10',
            'parcel_weight' => 'nullable|numeric',
            'weight_unit' => 'nullable|string|max:10',
            'remark' => 'nullable|string|max:255',
            'active' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        DB::beginTransaction();

        try {
            $data = $validator->validated();
            $data['updated_at'] = now();

            $parcelBoxType->update($data);

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Parcel box type updated successfully',
                'data' => $parcelBoxType->fresh(),
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update parcel box type',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete a parcel box type
     */
    public function deleteParcelBoxType($id)
    {
        $parcelBoxType = ParcelBoxTypes::find($id);

        if (! $parcelBoxType) {
            return response()->json([
                'status' => 'error',
                'message' => 'Parcel box type not found',
            ], 404);
        }

        DB::beginTransaction();

        try {
            $parcelBoxType->delete();

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Parcel box type deleted successfully',
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'status' => 'error',
                'message' => 'Failed to delete parcel box type',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
