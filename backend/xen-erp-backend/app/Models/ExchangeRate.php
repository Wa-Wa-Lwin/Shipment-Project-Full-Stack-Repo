<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExchangeRate extends Model
{
    protected $fillable = [
        'base_currency',
        'currency_code',
        'rate',
        'provider',
        'rate_date',
        'last_updated_time',
    ];

    protected $casts = [
        'rate' => 'decimal:8',
        'rate_date' => 'datetime',
        'last_updated_time' => 'datetime',
    ];

    public static function getRate(string $fromCurrency = 'THB', string $toCurrency = 'USD'): ?float
    {
        $rate = self::where('base_currency', $fromCurrency)
            ->where('currency_code', $toCurrency)
            ->latest('last_updated_time')
            ->first();

        return $rate ? (float) $rate->rate : null;
    }

    public static function getAllRates(string $baseCurrency = 'THB'): array
    {
        return self::where('base_currency', $baseCurrency)
            ->latest('last_updated_time')
            ->pluck('rate', 'currency_code')
            ->toArray();
    }
}
