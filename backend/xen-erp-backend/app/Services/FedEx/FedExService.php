<?php

namespace App\Services\FedEx;

use Exception;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FedExService
{
    private string $tokenUrl;

    private string $clientId;

    private string $clientSecret;

    private string $cacheKey = 'fedex_oauth_token';

    public function __construct()
    {
        $this->tokenUrl = config('services.fedex.token_url', 'https://apis.fedex.com/oauth/token');
        $this->clientId = config('services.fedex.client_id');
        $this->clientSecret = config('services.fedex.client_secret');
    }

    /**
     * Get OAuth token from FedEx with automatic caching and refresh
     * Token is cached for 55 minutes to ensure it's refreshed before expiration
     *
     * @param  bool  $forceRefresh  Force a new token request
     */
    public function getAccessToken(bool $forceRefresh = false): ?string
    {
        // Return cached token if available and not forcing refresh
        if (! $forceRefresh && Cache::has($this->cacheKey)) {
            $cachedToken = Cache::get($this->cacheKey);
            Log::info('Using cached FedEx token');

            return $cachedToken;
        }

        // Request new token from FedEx
        try {
            Log::info('Requesting new FedEx token');

            $response = Http::asForm()->post($this->tokenUrl, [
                'grant_type' => 'client_credentials',
                'client_id' => $this->clientId,
                'client_secret' => $this->clientSecret,
            ]);

            if ($response->successful()) {
                $data = $response->json();
                $accessToken = $data['access_token'] ?? null;

                if ($accessToken) {
                    // Cache token for 55 minutes (token expires in 1 hour)
                    // This ensures we refresh before expiration
                    Cache::put($this->cacheKey, $accessToken, now()->addMinutes(55));

                    Log::info('FedEx token cached successfully', [
                        'expires_in' => '55 minutes',
                    ]);

                    return $accessToken;
                }
            }

            Log::error('FedEx Token Request Failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return null;
        } catch (Exception $e) {
            Log::error('FedEx Token Exception', [
                'message' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * Clear the cached token (useful for debugging or forcing refresh)
     */
    public function clearCachedToken(): void
    {
        Cache::forget($this->cacheKey);
        Log::info('FedEx token cache cleared');
    }
}
