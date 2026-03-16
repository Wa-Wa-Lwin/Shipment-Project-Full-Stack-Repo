<?php

namespace App\Http\Controllers\SAPEnterpryze;

use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SAPPurchaseOrderListController
{
    private string $sapUrl;

    private string $cacheKeyPrefix = 'sap_session_';

    public function __construct()
    {
        $this->sapUrl = config('services.sap.url', 'https://192.168.68.16:50000/b1s/v1');
    }

    /**
     * Get all Purchase Orders with pagination
     * GET /api/logistics/sap_enterpryze/get_all_pos?page=1&per_page=20
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getAllPOs(Request $request, int $retryCount = 0)
    {
        try {
            $page = max(1, (int) $request->query('page', 1));
            $perPage = min(100, max(1, (int) $request->query('per_page', 20)));
            $skip = ($page - 1) * $perPage;

            $session = $this->getValidSession();

            // Get total count
            $countResponse = Http::withOptions(['verify' => false])
                ->withCookies($session['cookies'], '192.168.68.16')
                ->get("{$this->sapUrl}/PurchaseOrders/\$count");

            $total = $countResponse->successful() ? (int) $countResponse->body() : 0;

            // Fetch page of POs (only fields needed for the list view)
            $response = Http::withOptions(['verify' => false])
                ->withCookies($session['cookies'], '192.168.68.16')
                ->get("{$this->sapUrl}/PurchaseOrders", [
                    '$select' => 'DocEntry,DocNum,CardCode,CardName,DocDate,DocDueDate,DocTotal,DocCurrency,DocumentStatus,NumAtCard',
                    '$orderby' => 'DocEntry desc',
                    '$top' => $perPage,
                    '$skip' => $skip,
                ]);

            if ($this->isSessionTimeout($response) && $retryCount < 1) {
                Log::warning('SAP session timeout on getAllPOs, retrying after re-login');
                $this->clearSessionCache();

                return $this->getAllPOs($request, $retryCount + 1);
            }

            if (! $response->successful()) {
                Log::error('SAP PurchaseOrders list fetch failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                    'page' => $page,
                    'per_page' => $perPage,
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Failed to fetch purchase orders from SAP',
                    'error' => $response->json()['error']['message']['value'] ?? $response->body(),
                    'data' => null,
                ], $response->status());
            }

            $data = $response->json();
            $items = array_map(fn ($po) => [
                'DocEntry' => $po['DocEntry'] ?? 0,
                'DocNum' => $po['DocNum'] ?? 0,
                'CardCode' => $po['CardCode'] ?? '',
                'CardName' => $po['CardName'] ?? '',
                'DocDate' => $po['DocDate'] ?? '',
                'DocDueDate' => $po['DocDueDate'] ?? '',
                'DocTotal' => $po['DocTotal'] ?? 0,
                'DocCurrency' => $po['DocCurrency'] ?? '',
                'DocumentStatus' => $po['DocumentStatus'] ?? '',
                'NumAtCard' => $po['NumAtCard'] ?? '',
            ], $data['value'] ?? []);

            $totalPages = $perPage > 0 ? (int) ceil($total / $perPage) : 1;

            Log::info('SAP PurchaseOrders list fetched', [
                'page' => $page,
                'per_page' => $perPage,
                'items_returned' => count($items),
                'total' => $total,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Purchase orders fetched successfully',
                'data' => [
                    'items' => $items,
                    'total' => $total,
                    'page' => $page,
                    'per_page' => $perPage,
                    'total_pages' => max(1, $totalPages),
                ],
            ]);

        } catch (Exception $e) {
            Log::error('SAP getAllPOs exception', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching purchase orders',
                'error' => $e->getMessage(),
                'data' => null,
            ], 500);
        }
    }

    /**
     * Get valid SAP session, login if needed
     *
     * @return array Session data with cookies
     *
     * @throws Exception
     */
    private function getValidSession(): array
    {
        $username = config('services.sap.username');
        $password = config('services.sap.password');
        $companyDB = config('services.sap.company_db');

        $cacheKey = $this->getCacheKey($username, $companyDB);

        if (Cache::has($cacheKey)) {
            Log::info('Using cached SAP session for API call');

            return Cache::get($cacheKey);
        }

        Log::info('No cached session, logging into SAP');

        $response = Http::withOptions(['verify' => false])
            ->post("{$this->sapUrl}/Login", [
                'CompanyDB' => $companyDB,
                'UserName' => $username,
                'Password' => $password,
            ]);

        if (! $response->successful()) {
            throw new Exception('SAP login failed: '.($response->json()['error']['message']['value'] ?? 'Unknown error'));
        }

        $data = $response->json();
        $sessionId = $data['SessionId'] ?? null;

        if (! $sessionId) {
            throw new Exception('SAP login successful but no SessionId returned');
        }

        $cookies = [];
        foreach ($response->cookies() as $cookie) {
            $cookies[$cookie->getName()] = $cookie->getValue();
        }

        $sessionData = [
            'session_id' => $sessionId,
            'cookies' => $cookies,
            'username' => $username,
            'company_db' => $companyDB,
            'logged_in_at' => now()->toDateTimeString(),
        ];

        Cache::put($cacheKey, $sessionData, now()->addMinutes(28));

        Log::info('SAP session created and cached', ['session_id' => $sessionId]);

        return $sessionData;
    }

    private function isSessionTimeout($response): bool
    {
        if ($response->successful()) {
            return false;
        }

        $json = $response->json();
        $errorMessage = $json['error']['message']['value']
            ?? $json['error']['message']
            ?? '';

        return str_contains($errorMessage, 'Invalid session')
            || str_contains($errorMessage, 'session already timeout');
    }

    private function clearSessionCache(): void
    {
        Cache::forget($this->getCacheKey(config('services.sap.username'), config('services.sap.company_db')));
        Log::info('SAP session cache cleared');
    }

    private function getCacheKey(string $username, string $companyDB): string
    {
        return $this->cacheKeyPrefix.md5($username.'_'.$companyDB);
    }
}
