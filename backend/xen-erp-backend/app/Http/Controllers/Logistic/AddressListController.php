<?php

namespace App\Http\Controllers\Logistic;

use App\Http\Controllers\Controller;
use App\Models\Logistic\AddressList;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class AddressListController extends Controller
{
    // Get Address List
    public function getAddressList()
    {
        $allAddressList = AddressList::get();
        $allActiveAddressList = AddressList::where('active', 1)->get();
        $allInActiveAddressList = AddressList::where('active', 0)->get();

        $allAddressListCount = $allAddressList->count();

        return response()->json([
            'all_address_list' => $allAddressList,
            'all_active_address_list' => $allActiveAddressList,
            'all_inactive_address_list' => $allInActiveAddressList,
            'all_address_list_count' => $allAddressListCount,
        ], 200);
    }

    // Get Address by ID
    public function getAddressListById($id)
    {
        try {
            $address = AddressList::find($id);

            if (! $address) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Address not found.',
                ], 404);
            }

            return response()->json([
                'status' => 'success',
                'address' => $address,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch address.',
                'error_detail' => $e->getMessage(),
            ], 500);
        }
    }

    // Create Address
    public function createAddress(Request $request)
    {

        $validator = Validator::make($request->all(), [
            // Address
            'CardCode' => 'nullable|string|max:255',
            'company_name' => 'required|string|max:255',
            'CardType' => 'required|string|max:255',
            'full_address' => 'nullable|string|max:255',
            'street1' => 'required|string|max:255',
            'street2' => 'nullable|string|max:255',
            'street3' => 'nullable|string|max:255',
            'city' => 'required|string|max:255',
            'state' => 'required|string|max:255',
            'country' => 'required|string|max:255',
            'postal_code' => 'required|string|max:255',
            'contact_name' => 'required|string|max:255',
            'contact' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:255',
            'email' => 'nullable|string|max:255',
            'tax_id' => 'nullable|string|max:255',
            'phone1' => 'nullable|string|max:255',
            'website' => 'nullable|string|max:255',
            'active' => 'required|int',
            'user_id' => 'nullable|int',
            'user_name' => 'required|string|max:255',
            'eori_number' => 'nullable|string|max:255',
            'bind_incoterms' => 'nullable|string|max:50',
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

            $addressData = [
                'CardCode' => $validatedData['CardCode'],
                'company_name' => $validatedData['company_name'],
                'CardType' => $validatedData['CardType'],
                'full_address' => $validatedData['full_address'],
                'street1' => $validatedData['street1'],
                'street2' => $validatedData['street2'],
                'street3' => $validatedData['street3'],
                'city' => $validatedData['city'],
                'state' => $validatedData['state'],
                'country' => $validatedData['country'],
                'postal_code' => $validatedData['postal_code'],
                'contact_name' => $validatedData['contact_name'],
                'contact' => $validatedData['contact'],
                'phone' => $validatedData['phone'],
                'email' => $validatedData['email'],
                'tax_id' => $validatedData['tax_id'],
                'phone1' => $validatedData['phone1'],
                'website' => $validatedData['website'],
                'active' => 1,
                'created_userID' => $validatedData['user_id'],
                'created_time' => $time_now,
                'updated_userID' => $validatedData['user_id'],
                'updated_time' => $time_now,
                'created_user_name' => $validatedData['user_name'],
                'updated_user_name' => $validatedData['user_name'],
                'eori_number' => $validatedData['eori_number'],
                'bind_incoterms' => $validatedData['bind_incoterms'],
            ];

            $add_Address = AddressList::create($addressData);

            if (! $add_Address) {
                return response()->json(['message' => 'Failed to create address. '], 500);
            }

            $address = AddressList::find($add_Address->addressID);

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Address created successfully.',
                'address' => $address,
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'status' => 'error',
                'message' => 'Failed to create address.',
                'error_detail' => $e->getMessage(),
            ], 500);
        }
    }

    // Update Address
    public function updateAddress(Request $request, $id)
    {
        $address = AddressList::find($id);

        $validator = Validator::make($request->all(), [
            // Address
            'CardCode' => 'nullable|string|max:255',
            'company_name' => 'required|string|max:255',
            'CardType' => 'required|string|max:10',
            'full_address' => 'nullable|string|max:255',
            'street1' => 'required|string|max:255',
            'street2' => 'nullable|string|max:255',
            'street3' => 'nullable|string|max:255',
            'city' => 'required|string|max:255',
            'state' => 'required|string|max:255',
            'country' => 'required|string|max:255',
            'postal_code' => 'required|string|max:20',
            'contact_name' => 'required|string|max:255',
            'contact' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:255',
            'email' => 'nullable|string|max:255',
            'tax_id' => 'nullable|string|max:255',
            'phone1' => 'nullable|string|max:255',
            'website' => 'nullable|string|max:255',
            'eori_number' => 'nullable|string|max:255',
            'active' => 'required|int',
            'updated_userID' => 'required|int',
            'updated_user_name' => 'required|string|max:255',
            'bind_incoterms' => 'required|string|max:50',
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
            $address->CardCode = $validatedData['CardCode'];
            $address->company_name = $validatedData['company_name'];
            $address->CardType = $validatedData['CardType'];
            $address->full_address = $validatedData['full_address'];
            $address->street1 = $validatedData['street1'];
            $address->street2 = $validatedData['street2'];
            $address->street3 = $validatedData['street3'];
            $address->city = $validatedData['city'];
            $address->state = $validatedData['state'];
            $address->country = $validatedData['country'];
            $address->postal_code = $validatedData['postal_code'];
            $address->contact_name = $validatedData['contact_name'];
            $address->contact = $validatedData['contact'];
            $address->phone = $validatedData['phone'];
            $address->email = $validatedData['email'];
            $address->tax_id = $validatedData['tax_id'];
            $address->phone1 = $validatedData['phone1'];
            $address->website = $validatedData['website'];
            $address->active = $validatedData['active'];
            $address->eori_number = $validatedData['eori_number'];
            $address->bind_incoterms = $validatedData['bind_incoterms'];
            $address->updated_userID = $validatedData['updated_userID'];
            $address->updated_user_name = $validatedData['updated_user_name'];
            $address->updated_time = $time_now;
            $address->save();

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Address updated successfully.',
                'address' => $address,
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update address.',
                'error_detail' => $e->getMessage(),
            ], 500);
        }
    }

    // Inactivate Address
    public function inactiveOrActiveAddress(Request $request, $id)
    {
        $address = AddressList::find($id);
        $validator = Validator::make($request->all(), [
            'updated_userID' => 'required|int',
            'updated_user_name' => 'required|string|max:255',
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

        $active_status = ! $address->active;

        try {
            $address->active = $active_status;
            $address->updated_userID = $validatedData['updated_userID'];
            $address->updated_user_name = $validatedData['updated_user_name'];
            $address->updated_time = $time_now;
            $address->save();

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Address inactivated successfully.',
                'address' => $address,
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'status' => 'error',
                'message' => 'Failed to inactivate address.',
                'error_detail' => $e->getMessage(),
            ], 500);
        }
    }
}
