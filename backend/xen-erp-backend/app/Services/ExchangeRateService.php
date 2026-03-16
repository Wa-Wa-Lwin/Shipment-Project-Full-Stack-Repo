<?php

namespace App\Services;

use App\Models\ExchangeRate;
use Carbon\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ExchangeRateService
{
    private const API_URL = 'https://api.exchangerate-api.com/v4/latest/THB';

    private const BASE_CURRENCY = 'THB';

    public function fetchAndStoreRates(): bool
    {
        try {
            $response = Http::timeout(30)->get(self::API_URL);

            if (! $response->successful()) {
                Log::error('Exchange rate API request failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return false;
            }

            $data = $response->json();

            if (! isset($data['rates']) || ! is_array($data['rates'])) {
                Log::error('Invalid exchange rate API response format', ['data' => $data]);

                return false;
            }

            $this->storeRates($data);

            Log::info('Exchange rates updated successfully', [
                'rates_count' => count($data['rates']),
                'date' => $data['date'] ?? null,
            ]);

            return true;

        } catch (\Exception $e) {
            Log::error('Failed to fetch exchange rates', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return false;
        }
    }

    private function storeRates(array $data): void
    {
        $provider = $data['provider'] ?? null;
        $rateDate = isset($data['date']) ? Carbon::parse($data['date']) : Carbon::now();
        $lastUpdated = isset($data['time_last_updated'])
            ? Carbon::createFromTimestamp($data['time_last_updated'])
            : Carbon::now();

        foreach ($data['rates'] as $currencyCode => $rate) {
            ExchangeRate::updateOrCreate(
                [
                    'base_currency' => self::BASE_CURRENCY,
                    'currency_code' => $currencyCode,
                ],
                [
                    'rate' => $rate,
                    'provider' => $provider,
                    'rate_date' => $rateDate,
                    'last_updated_time' => $lastUpdated,
                ]
            );
        }
    }

    public function getRate(string $fromCurrency = 'THB', string $toCurrency = 'USD'): ?float
    {
        return ExchangeRate::getRate($fromCurrency, $toCurrency);
    }

    public function getAllRates(string $baseCurrency = 'THB'): array
    {
        return ExchangeRate::getAllRates($baseCurrency);
    }

    public function convertAmount(float $amount, string $fromCurrency = 'THB', string $toCurrency = 'USD'): ?float
    {
        $rate = $this->getRate($fromCurrency, $toCurrency);

        if ($rate === null) {
            return null;
        }

        return $amount * $rate;
    }
}
