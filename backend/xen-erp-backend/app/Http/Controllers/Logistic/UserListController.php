<?php

namespace App\Http\Controllers\Logistic;

use App\Models\Logistic\UserList;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class UserListController
{
    public function __construct() {}

    // Get all users with their approver & supervisor
    public function getAllUsersWithRelations()
    {
        try {
            $users = UserList::with(['approver', 'supervisor'])->get();

            if ($users->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No users found',
                    'data' => [],
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Users retrieved successfully',
                'data' => $users,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching users',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    // Get single user by ID
    public function getUser($id)
    {
        try {
            $user = UserList::with(['approver', 'supervisor'])->find($id);

            if (! $user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found',
                    'data' => null,
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'User retrieved successfully',
                'data' => $user,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching user',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    // Create new user
    public function createUser(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'username' => 'required|string|max:255',
                'password' => 'required|string|min:6',
                'firstName' => 'required|string|max:255',
                'lastName' => 'required|string|max:255',
                'gender' => 'nullable|string|max:10',
                'phone' => 'nullable|string|max:50',
                'email' => 'required|email|max:255|unique:sqlsrv_xenapi_mfg.User_List,email',
                'departmentID' => 'nullable|integer',
                'section_index' => 'nullable|integer',
                'postitionID' => 'nullable|integer',
                'active' => 'boolean',
                'role' => 'nullable|string|max:100',
                'user_code' => 'nullable|string|max:50',
                'supervisorID' => 'nullable|integer|exists:sqlsrv_xenapi_mfg.User_List,userID',
                'level' => 'nullable|integer',
                'headID' => 'nullable|integer|exists:sqlsrv_xenapi_mfg.User_List,userID',
                'logisticRole' => 'nullable|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $userData = $request->all();

            // Hash password before storing
            if (isset($userData['password'])) {
                $userData['password'] = bcrypt($userData['password']);
            }

            // Set active to true by default if not provided
            if (! isset($userData['active'])) {
                $userData['active'] = true;
            }

            $user = UserList::create($userData);

            return response()->json([
                'success' => true,
                'message' => 'User created successfully',
                'data' => $user,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while creating user',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    // Update user
    public function updateUser(Request $request, $id)
    {
        try {
            $user = UserList::find($id);

            if (! $user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found',
                    'data' => null,
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'username' => 'sometimes|required|string|max:255',
                'password' => 'sometimes|string|min:6',
                'firstName' => 'sometimes|required|string|max:255',
                'lastName' => 'sometimes|required|string|max:255',
                'gender' => 'nullable|string|max:10',
                'phone' => 'nullable|string|max:50',
                'email' => 'sometimes|required|email|max:255|unique:sqlsrv_xenapi_mfg.User_List,email,'.$id.',userID',
                'departmentID' => 'nullable|integer',
                'section_index' => 'nullable|integer',
                'postitionID' => 'nullable|integer',
                'active' => 'boolean',
                'role' => 'nullable|string|max:100',
                'user_code' => 'nullable|string|max:50',
                'supervisorID' => 'nullable|integer|exists:sqlsrv_xenapi_mfg.User_List,userID',
                'level' => 'nullable|integer',
                'headID' => 'nullable|integer|exists:sqlsrv_xenapi_mfg.User_List,userID',
                'logisticRole' => 'nullable|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $userData = $request->all();

            // Hash password if provided
            if (isset($userData['password'])) {
                $userData['password'] = bcrypt($userData['password']);
            }

            $user->update($userData);

            return response()->json([
                'success' => true,
                'message' => 'User updated successfully',
                'data' => $user->fresh(['approver', 'supervisor']),
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while updating user',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    // Activate user
    public function activateUser($id)
    {
        try {
            $user = UserList::find($id);

            if (! $user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found',
                    'data' => null,
                ], 404);
            }

            $user->update(['active' => true]);

            return response()->json([
                'success' => true,
                'message' => 'User activated successfully',
                'data' => $user,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while activating user',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    // Deactivate user
    public function deactivateUser($id)
    {
        try {
            $user = UserList::find($id);

            if (! $user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found',
                    'data' => null,
                ], 404);
            }

            $user->update(['active' => false]);

            return response()->json([
                'success' => true,
                'message' => 'User deactivated successfully',
                'data' => $user,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while deactivating user',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
