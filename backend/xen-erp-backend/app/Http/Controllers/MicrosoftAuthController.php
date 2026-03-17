<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class MicrosoftAuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|string',
            'password' => 'required|string',
        ]);

        // Demo user bypass — no Azure AD call required
        if ($request->email === 'admin' && $request->password === '12345') {
            return response()->json([
                'id'           => 'demo-user-001',
                'name'         => 'Demo Admin',
                'email'        => 'admin',
                'access_token' => 'demo-access-token',
            ]);
        }

        // Domain restriction
        $emailParts = explode('@', $request->email);
        if (count($emailParts) < 2 || $emailParts[1] !== env('ALLOWED_DOMAIN')) {
            return response()->json(['error' => 'Invalid email domain'], 403);
        }

        $tokenEndpoint = 'https://login.microsoftonline.com/'.env('AZURE_TENANT_ID').'/oauth2/v2.0/token';

        $response = Http::asForm()->post($tokenEndpoint, [
            'client_id' => env('AZURE_CLIENT_ID'),
            'scope' => 'https://graph.microsoft.com/.default',
            'username' => $request->email,
            'password' => $request->password,
            'grant_type' => 'password',
            'client_secret' => env('AZURE_CLIENT_SECRET'),
        ]);

        // if ($response->failed()) {
        //     return response()->json(['error' => 'Login failed'], 401);
        // }
        if ($response->failed()) {
            return response()->json([
                'error' => 'Login failed',
                'details' => $response->body(), // <-- see Azure error
            ], 401);
        }

        $data = $response->json();

        // Optional: Fetch user profile from Graph API
        $userResponse = Http::withToken($data['access_token'])
            ->get('https://graph.microsoft.com/v1.0/me');

        $user = $userResponse->json();

        return response()->json([
            'id' => $user['id'] ?? null,
            'name' => $user['displayName'] ?? null,
            'email' => $user['userPrincipalName'] ?? null,
            'access_token' => $data['access_token'],
        ]);
    }
}
