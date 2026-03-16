<?php

namespace App\Http\Controllers\Logistic;

use App\Http\Controllers\Controller;
use App\Models\Logistic\Packaging;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class PackagingController extends Controller
{
    // ParcelBoxTypes
    public function getAllPackaging()
    {
        $allPackaging = Packaging::get();
        $allActivePackaging = Packaging::where('active', 1)->get();
        $allInActivePackaging = Packaging::where('active', 0)->get();

        $allPackagingCount = $allPackaging->count();

        return response()->json([
            'all_Packaging' => $allPackaging,
            'all_active_Packaging' => $allActivePackaging,
            'all_inactive_Packaging' => $allInActivePackaging,
            'all_Packaging_count' => $allPackagingCount,
        ], 200);
    }

    // Create Packaging
    public function createPackaging(Request $request)
    {

        $validator = Validator::make($request->all(), [
            // Packaging
            'package_type' => 'required|string|max:255',
            'package_type_name' => 'required|string|max:255',
            'package_purpose' => 'required|string|max:255',
            'package_length' => 'required|integer',
            'package_width' => 'required|integer',
            'package_height' => 'required|integer',
            'package_dimension_unit' => 'required|string|max:255',
            'package_weight' => 'required|integer',
            'package_weight_unit' => 'required|string|max:255',
            'remark' => 'nullable|string|max:255',
            'user_name' => 'nullable|string|max:255',
            'user_id' => 'required|integer',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $validatedData = $validator->validated();
        $time_now = \Illuminate\Support\Carbon::now();
        DB::beginTransaction();

        try {

            $packagingData = [
                'package_type' => $validatedData['package_type'],
                'package_type_name' => $validatedData['package_type_name'],
                'package_purpose' => $validatedData['package_purpose'],
                'package_length' => $validatedData['package_length'],
                'package_width' => $validatedData['package_width'],
                'package_height' => $validatedData['package_height'],
                'package_dimension_unit' => $validatedData['package_dimension_unit'],
                'package_weight' => $validatedData['package_weight'],
                'package_weight_unit' => $validatedData['package_weight_unit'],
                'remark' => $validatedData['remark'],
                'created_by_user_name' => $validatedData['user_name'],
                'created_by_user_id' => $validatedData['user_id'],
                'created_at' => $time_now,
                'updated_by_user_name' => $validatedData['user_name'],
                'updated_by_user_id' => $validatedData['user_id'],
                'updated_at' => $time_now,
                'active' => 1,
            ];

            $add_Packaging = Packaging::create($packagingData);

            if (! $add_Packaging) {
                return response()->json(['message' => 'Failed to create packaging. '], 500);
            }

            $packaging = Packaging::find($add_Packaging->packageID);

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Packaging created successfully.',
                'packaging' => $packaging,
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'status' => 'error',
                'message' => 'Failed to create packaging.',
                'error_detail' => $e->getMessage(),
            ], 500);
        }
    }

    // Update Packaging
    public function updatePackaging(Request $request, $id)
    {
        $packaging = Packaging::find($id);

        $validator = Validator::make($request->all(), [
            // Packaging
            'package_type' => 'required|string|max:255',
            'package_type_name' => 'required|string|max:255',
            'package_purpose' => 'required|string|max:255',
            'package_length' => 'required|integer',
            'package_width' => 'required|integer',
            'package_height' => 'required|integer',
            'package_dimension_unit' => 'required|string|max:255',
            'package_weight' => 'required|integer',
            'package_weight_unit' => 'required|string|max:255',
            'remark' => 'nullable|string|max:255',
            'user_name' => 'nullable|string|max:255',
            'user_id' => 'required|integer',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $validatedData = $validator->validated();
        $time_now = \Illuminate\Support\Carbon::now();
        DB::beginTransaction();

        try {
            $packaging->package_type = $validatedData['package_type'];
            $packaging->package_type_name = $validatedData['package_type_name'];
            $packaging->package_purpose = $validatedData['package_purpose'];
            $packaging->package_length = $validatedData['package_length'];
            $packaging->package_width = $validatedData['package_width'];
            $packaging->package_height = $validatedData['package_height'];
            $packaging->package_dimension_unit = $validatedData['package_dimension_unit'];
            $packaging->package_weight = $validatedData['package_weight'];
            $packaging->package_weight_unit = $validatedData['package_weight_unit'];
            $packaging->remark = $validatedData['remark'];
            $packaging->updated_by_user_id = $validatedData['user_id'];
            $packaging->updated_by_user_name = $validatedData['user_name'];
            $packaging->updated_at = $time_now;
            $packaging->save();

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Packaging updated successfully.',
                'packaging' => $packaging,
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update packaging.',
                'error_detail' => $e->getMessage(),
            ], 500);
        }

    }

    // Inactivate Packaging
    public function inactivePackaging(Request $request, $id)
    {
        $packaging = Packaging::find($id);
        $validator = Validator::make($request->all(), [
            // Packaging
            'active' => 'required|int', 'updated_userID' => 'required|int', 'updated_user_name' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $validatedData = $validator->validated();
        $time_now = \Illuminate\Support\Carbon::now();
        DB::beginTransaction();

        try {
            $packaging->active = $validatedData['active'];
            $packaging->updated_by_user_id = $validatedData['updated_userID'];
            $packaging->updated_by_user_name = $validatedData['updated_user_name'];
            $packaging->updated_at = $time_now;
            $packaging->save();

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Packaging inactivated successfully.',
                'packaging' => $packaging,
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'status' => 'error',
                'message' => 'Failed to inactivate packaging.',
                'error_detail' => $e->getMessage(),
            ], 500);
        }
    }
}
