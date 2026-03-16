<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ExchangeRate;
use App\Services\ExchangeRateService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExchangeRateController extends Controller
{
    private ExchangeRateService $exchangeRateService;

    public function __construct(ExchangeRateService $exchangeRateService)
    {
        $this->exchangeRateService = $exchangeRateService;
    }

    /**
     * Get exchange rates in the format expected by frontend
     * Compatible with exchangerate-api.com format
     */
    public function getRates(Request $request): JsonResponse
    {
        $baseCurrency = $request->get('base', 'THB');

        // Get all rates from database
        $rates = ExchangeRate::where('base_currency', $baseCurrency)
            ->latest('last_updated_time')
            ->get()
            ->keyBy('currency_code');

        if ($rates->isEmpty()) {
            return response()->json([
                'error' => 'No exchange rates available',
                'message' => 'Please wait for rates to be updated',
            ], 404);
        }

        // Get the latest update info
        $latestRate = $rates->first();

        // Format response similar to exchangerate-api.com
        $response = [
            'provider' => config('app.url'),
            'base' => $baseCurrency,
            'date' => $latestRate->rate_date->format('Y-m-d'),
            'time_last_updated' => $latestRate->last_updated_time->timestamp,
            'conversion_rates' => [],
        ];

        // Convert rates for frontend (invert THB-based rates)
        foreach ($rates as $currencyCode => $rate) {
            if ($currencyCode === 'THB') {
                $response['conversion_rates'][$currencyCode] = 1.0;
            } else {
                // Frontend expects rates FROM THB, our DB stores rates TO THB
                $response['conversion_rates'][$currencyCode] = 1 / (float) $rate->rate;
            }
        }

        return response()->json($response);
    }

    /**
     * Get specific exchange rate
     */
    public function getSpecificRate(Request $request): JsonResponse
    {
        $from = $request->get('from', 'THB');
        $to = $request->get('to', 'USD');

        $rate = $this->exchangeRateService->getRate($from, $to);

        if ($rate === null) {
            return response()->json([
                'error' => 'Exchange rate not found',
                'from' => $from,
                'to' => $to,
            ], 404);
        }

        return response()->json([
            'from' => $from,
            'to' => $to,
            'rate' => $rate,
            'updated_at' => ExchangeRate::where('base_currency', $from)
                ->where('currency_code', $to)
                ->latest('last_updated_time')
                ->value('last_updated_time'),
        ]);
    }

    /**
     * Convert amount between currencies
     */
    public function convert(Request $request): JsonResponse
    {
        $request->validate([
            'amount' => 'required|numeric|min:0',
            'from' => 'required|string|size:3',
            'to' => 'required|string|size:3',
        ]);

        $amount = $request->get('amount');
        $from = strtoupper($request->get('from'));
        $to = strtoupper($request->get('to'));

        $convertedAmount = $this->exchangeRateService->convertAmount($amount, $from, $to);

        if ($convertedAmount === null) {
            return response()->json([
                'error' => 'Conversion not possible',
                'message' => "Exchange rate not available for {$from} to {$to}",
            ], 400);
        }

        return response()->json([
            'original_amount' => $amount,
            'from' => $from,
            'to' => $to,
            'converted_amount' => $convertedAmount,
            'rate' => $this->exchangeRateService->getRate($from, $to),
        ]);
    }

    /**
     * Force refresh exchange rates
     */
    public function refresh(): JsonResponse
    {
        $success = $this->exchangeRateService->fetchAndStoreRates();

        if ($success) {
            return response()->json([
                'message' => 'Exchange rates updated successfully',
                'updated_at' => Carbon::now(),
            ]);
        }

        return response()->json([
            'error' => 'Failed to update exchange rates',
            'message' => 'Please try again later',
        ], 500);
    }
}
