<?php

namespace App\Http\Controllers\SAPEnterpryze;

use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class SAPAuthenticationController
{
    private string $sapUrl;

    private string $sapCompanyDB;

    private int $sessionTimeout;

    private string $cacheKeyPrefix = 'sap_session_';

    public function __construct()
    {
        $this->sapUrl = config('services.sap.url', 'https://192.168.68.16:50000/b1s/v1');
        $this->sapCompanyDB = config('services.sap.company_db', '');
        $this->sessionTimeout = config('services.sap.session_timeout', 30); // Default 30 minutes
    }

    /**
     * Login to SAP Business One Service Layer
     * POST /api/sap/login
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function login(Request $request)
    {
        try {

            $username = 'manager';
            $password = 'Sap@xen22';
            $companyDB = 'XEN';

            // Check if valid session exists in cache
            $cacheKey = $this->getCacheKey($username, $companyDB);
            if (Cache::has($cacheKey)) {
                $cachedSession = Cache::get($cacheKey);
                Log::info('Using cached SAP session', [
                    'username' => $username,
                    'company_db' => $companyDB,
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Using existing SAP session',
                    'data' => $cachedSession,
                ], 200);
            }

            // // Login to SAP Business One Service Layer
            // Log::info('Attempting SAP B1 Service Layer login', [
            //     'username' => $username,
            //     'company_db' => $companyDB
            // ]);

            $response = Http::withOptions([
                'verify' => false, // Disable SSL verification for local server
            ])->post("{$this->sapUrl}/Login", [
                'CompanyDB' => $companyDB,
                'UserName' => $username,
                'Password' => $password,
            ]);

            if ($response->successful()) {
                $data = $response->json();

                // Extract session information
                $sessionId = $data['SessionId'] ?? null;
                $version = $data['Version'] ?? null;
                $sessionTimeout = $data['SessionTimeout'] ?? $this->sessionTimeout;

                if (! $sessionId) {
                    Log::error('SAP login successful but no SessionId returned', [
                        'response' => $data,
                    ]);

                    return response()->json([
                        'success' => false,
                        'message' => 'SAP login failed: No SessionId returned',
                        'data' => null,
                    ], 500);
                }

                // Extract cookies from response
                $cookies = $response->cookies();

                $sessionData = [
                    'session_id' => $sessionId,
                    'version' => $version,
                    'session_timeout' => $sessionTimeout,
                    'cookies' => $cookies->toArray(),
                    'username' => $username,
                    'company_db' => $companyDB,
                    'logged_in_at' => now()->toDateTimeString(),
                ];

                // Cache session for (timeout - 2) minutes to ensure refresh before expiration
                $cacheMinutes = max(1, $sessionTimeout - 2);
                Cache::put($cacheKey, $sessionData, now()->addMinutes($cacheMinutes));

                Log::info('SAP B1 Service Layer login successful', [
                    'username' => $username,
                    'session_id' => $sessionId,
                    'cache_duration' => $cacheMinutes.' minutes',
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'SAP login successful',
                    'data' => $sessionData,
                ], 200);
            }

            // Login failed
            Log::error('SAP B1 Service Layer login failed', [
                'status' => $response->status(),
                'body' => $response->body(),
                'username' => $username,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'SAP login failed',
                'error' => $response->json()['error']['message']['value'] ?? 'Authentication failed',
                'data' => null,
            ], $response->status());

        } catch (Exception $e) {
            Log::error('SAP login exception', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred during SAP login',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Logout from SAP Business One Service Layer
     * POST /api/sap/logout
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function logout(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'username' => 'required|string',
                'company_db' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $username = $request->input('username');
            $companyDB = $request->input('company_db', $this->sapCompanyDB);
            $cacheKey = $this->getCacheKey($username, $companyDB);

            // Get session from cache
            if (! Cache::has($cacheKey)) {
                return response()->json([
                    'success' => false,
                    'message' => 'No active SAP session found',
                    'data' => null,
                ], 404);
            }

            $sessionData = Cache::get($cacheKey);

            // Call SAP logout endpoint
            $response = Http::withOptions([
                'verify' => false,
            ])->withCookies(
                $sessionData['cookies'] ?? [],
                parse_url($this->sapUrl, PHP_URL_HOST)
            )->post("{$this->sapUrl}/Logout");

            // Clear cached session
            Cache::forget($cacheKey);

            Log::info('SAP B1 Service Layer logout successful', [
                'username' => $username,
                'company_db' => $companyDB,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'SAP logout successful',
                'data' => null,
            ], 200);

        } catch (Exception $e) {
            Log::error('SAP logout exception', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred during SAP logout',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get current SAP session information
     * GET /api/sap/session
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getSession(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'username' => 'required|string',
                'company_db' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $username = $request->input('username');
            $companyDB = $request->input('company_db', $this->sapCompanyDB);
            $cacheKey = $this->getCacheKey($username, $companyDB);

            if (Cache::has($cacheKey)) {
                $sessionData = Cache::get($cacheKey);

                return response()->json([
                    'success' => true,
                    'message' => 'Active SAP session found',
                    'data' => $sessionData,
                ], 200);
            }

            return response()->json([
                'success' => false,
                'message' => 'No active SAP session found',
                'data' => null,
            ], 404);

        } catch (Exception $e) {
            Log::error('SAP get session exception', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving session',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Validate and refresh SAP session if needed
     * POST /api/sap/validate-session
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function validateSession(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'username' => 'required|string',
                'password' => 'required|string',
                'company_db' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $username = $request->input('username');
            $companyDB = $request->input('company_db', $this->sapCompanyDB);
            $cacheKey = $this->getCacheKey($username, $companyDB);

            // If session exists and is valid, return it
            if (Cache::has($cacheKey)) {
                $sessionData = Cache::get($cacheKey);

                return response()->json([
                    'success' => true,
                    'message' => 'SAP session is valid',
                    'data' => $sessionData,
                ], 200);
            }

            // Session expired or doesn't exist, create new one
            return $this->login($request);

        } catch (Exception $e) {
            Log::error('SAP validate session exception', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while validating session',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Clear cached SAP session
     * POST /api/sap/clear-session
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function clearSession(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'username' => 'required|string',
                'company_db' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $username = $request->input('username');
            $companyDB = $request->input('company_db', $this->sapCompanyDB);
            $cacheKey = $this->getCacheKey($username, $companyDB);

            Cache::forget($cacheKey);

            Log::info('SAP session cache cleared', [
                'username' => $username,
                'company_db' => $companyDB,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'SAP session cache cleared successfully',
                'data' => null,
            ], 200);

        } catch (Exception $e) {
            Log::error('SAP clear session exception', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while clearing session',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Generate cache key for SAP session
     */
    private function getCacheKey(string $username, string $companyDB): string
    {
        return $this->cacheKeyPrefix.md5($username.'_'.$companyDB);
    }
}
