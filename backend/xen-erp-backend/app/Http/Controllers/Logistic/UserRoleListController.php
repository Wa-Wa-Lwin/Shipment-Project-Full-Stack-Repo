<?php

namespace App\Http\Controllers\Logistic;

use App\Models\Logistic\UserRoleList;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class UserRoleListController
{
    public function __construct() {}

    // Get all user roles
    public function getAllUserRoles()
    {
        try {
            $userRoles = UserRoleList::all();

            if ($userRoles->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No user roles found',
                    'data' => [],
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'User roles retrieved successfully',
                'data' => $userRoles,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching user roles',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    // Get single user role by ID (No)
    public function getUserRole($id)
    {
        try {
            $userRole = UserRoleList::find($id);

            if (! $userRole) {
                return response()->json([
                    'success' => false,
                    'message' => 'User role not found',
                    'data' => null,
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'User role retrieved successfully',
                'data' => $userRole,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching user role',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    // Get user role by email
    public function getUserRoleByEmail($email)
    {
        try {
            $userRole = UserRoleList::where('Email', $email)->first();

            if (! $userRole) {
                return response()->json([
                    'success' => false,
                    'message' => 'User role not found for this email',
                    'data' => null,
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'User role retrieved successfully',
                'data' => $userRole,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching user role',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    // Create new user role
    public function createUserRole(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'Email' => 'required|email|max:255|unique:sqlsrv.User_Role_List,Email',
                'Logistic' => 'boolean',
                'Developer' => 'boolean',
                'Approver' => 'boolean',
                'Supervisor' => 'boolean',
                'Warehouse' => 'boolean',
                'created_user_email' => 'required|email|max:255',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $userRoleData = $request->only([
                'Email',
                'Logistic',
                'Developer',
                'Approver',
                'Supervisor',
                'Warehouse',
                'created_user_email',
            ]);

            // Set default values for boolean fields if not provided
            $userRoleData['Logistic'] = $request->input('Logistic', false);
            $userRoleData['Developer'] = $request->input('Developer', false);
            $userRoleData['Approver'] = $request->input('Approver', false);
            $userRoleData['Supervisor'] = $request->input('Supervisor', false);
            $userRoleData['Warehouse'] = $request->input('Warehouse', false);

            // Set created_at timestamp
            $userRoleData['created_at'] = now();

            $userRole = UserRoleList::create($userRoleData);

            return response()->json([
                'success' => true,
                'message' => 'User role created successfully',
                'data' => $userRole,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while creating user role',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    // Update user role
    public function updateUserRole(Request $request, $id)
    {
        try {
            $userRole = UserRoleList::find($id);

            if (! $userRole) {
                return response()->json([
                    'success' => false,
                    'message' => 'User role not found',
                    'data' => null,
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'Email' => 'sometimes|required|email|max:255|unique:sqlsrv.User_Role_List,Email,'.$id.',userRoleListID',
                'Logistic' => 'boolean',
                'Developer' => 'boolean',
                'Approver' => 'boolean',
                'Supervisor' => 'boolean',
                'Warehouse' => 'boolean',
                'updated_user_email' => 'required|email|max:255',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $userRoleData = $request->only([
                'Email',
                'Logistic',
                'Developer',
                'Approver',
                'Supervisor',
                'Warehouse',
                'updated_user_email',
            ]);

            // Set updated_at timestamp
            $userRoleData['updated_at'] = now();

            $userRole->update($userRoleData);

            return response()->json([
                'success' => true,
                'message' => 'User role updated successfully',
                'data' => $userRole->fresh(),
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while updating user role',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    // Delete user role
    public function deleteUserRole($id)
    {
        try {
            $userRole = UserRoleList::find($id);

            if (! $userRole) {
                return response()->json([
                    'success' => false,
                    'message' => 'User role not found',
                    'data' => null,
                ], 404);
            }

            $userRole->delete();

            return response()->json([
                'success' => true,
                'message' => 'User role deleted successfully',
                'data' => null,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while deleting user role',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
