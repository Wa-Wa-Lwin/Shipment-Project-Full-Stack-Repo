<?php

namespace App\Http\Controllers\Logistic;

use App\Models\Logistic\UserList;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class FrontEndLoginController
{
    public function __construct() {}

    public function getUserDataWithLoginEmail(Request $request)
    {
        $validator = Validator::make($request->all(), [
            // details //history will come from details
            'email' => 'required|string|max:255',
        ]);
        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()], 400);
        }

        $email = $request->input('email');

        $user = UserList::where('email', $email)->first();
        $approver = UserList::where('userID', $user->headID)->first();
        $supervisor = UserList::where('userID', $user->supervisorID)->first();

        if (! $user) {
            return response()->json(['error' => 'User not found'], 404);
        }

        if (! $approver) {
            return response()->json(['error' => 'Approver not found'], 404);
        }

        return response()->json([
            'user' => $user,
            'approver' => $approver,
            'supervisor' => $supervisor,
        ], 200);
    }
}
