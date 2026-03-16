<?php

namespace App\Services\FedEx;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FedExAPIClient
{
    public function __construct(protected FedExService $service) {}

    private function headers(): array
    {
        return [
            'Authorization' => 'Bearer '.$this->service->getAccessToken(),
            'Content-Type' => 'application/json',
            'X-locale' => 'en_US',
        ];
    }

    private function baseUrl(): string
    {
        return config('services.fedex.api_url', 'https://apis.fedex.com');
    }

    public function createShipment(array $payload)
    {
        $endpoint = '/ship/v1/shipments';
        Log::info('FedEx Request: '.$endpoint, $payload);

        return Http::withHeaders($this->headers())->post($this->baseUrl().$endpoint, $payload);
    }

    public function createPickup(array $payload)
    {
        $endpoint = '/pickup/v1/pickups';
        Log::info('FedEx Request: '.$endpoint, $payload);

        return Http::withHeaders($this->headers())->post($this->baseUrl().$endpoint, $payload);
    }
}
