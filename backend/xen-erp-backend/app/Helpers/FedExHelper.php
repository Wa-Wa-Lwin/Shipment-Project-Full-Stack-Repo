<?php

namespace App\Helpers;

use App\Services\CountryCodeService;
use App\Services\FedEx\FedExConstants;
use Carbon\Carbon;

class FedExHelper
{
    /**
     * Format address for FedEx API with proper street line truncation
     * FedEx requires max 35 characters per street line
     */
    public static function formatAddress($address, ?CountryCodeService $countryService = null): array
    {
        $countryService = $countryService ?? app(CountryCodeService::class);

        return [
            'streetLines' => self::truncateStreetLines([
                $address->street1,
                $address->street2,
                $address->street3,
            ]),
            'city' => $address->city,
            'stateOrProvinceCode' => $address->state,
            'postalCode' => $address->postal_code,
            'countryCode' => $countryService->convertToISO2($address->country),
            'residential' => false,
        ];
    }

    /**
     * Format contact information for FedEx API
     */
    public static function formatContact($address): array
    {
        return [
            'personName' => $address->contact_name,
            'companyName' => $address->company_name ?? $address->company,
            'phoneNumber' => $address->phone,
            'emailAddress' => $address->email,
        ];
    }

    /**
     * Truncate street lines to FedEx's character limit (35 chars per line)
     * Removes empty lines and enforces character limits
     *
     * @param  array  $streetLines  Array of street line strings
     * @return array Filtered and truncated street lines
     */
    public static function truncateStreetLines(array $streetLines): array
    {
        return array_values(array_filter(array_map(function ($line) {
            return ! empty($line) ? mb_substr($line, 0, FedExConstants::STREET_LINE_MAX_LENGTH, 'UTF-8') : null;
        }, $streetLines)));
    }

    /**
     * Combine date and time into ISO 8601 format with timezone
     * Used for pickup scheduling
     *
     * @param  Carbon  $date  The date
     * @param  Carbon  $time  The time
     * @param  string  $timezone  Timezone offset (default: +07:00 for Thailand)
     * @return string Formatted datetime string
     */
    public static function combineDateTime(Carbon $date, Carbon $time, string $timezone = FedExConstants::DEFAULT_TIMEZONE_OFFSET): string
    {
        return $date->format('Y-m-d').'T'.$time->format('H:i:s').$timezone;
    }

    /**
     * Map paper size to FedEx label stock type
     *
     * @param  string|null  $paperSize  User-specified paper size
     * @return string FedEx label stock type
     */
    public static function mapPaperSize(?string $paperSize): string
    {
        return FedExConstants::PAPER_SIZE_MAP[strtolower($paperSize ?? 'default')]
            ?? FedExConstants::PAPER_SIZE_MAP['default'];
    }

    /**
     * Map FedEx service type to carrier code
     * Returns FDXE for Express services, FDXG for Ground
     *
     * @param  string  $serviceType  FedEx service type
     * @return string Carrier code (FDXE or FDXG)
     */
    public static function mapServiceTypeToCarrierCode(string $serviceType): string
    {
        $serviceType = strtoupper($serviceType);

        // Check if this is an Express service
        foreach (FedExConstants::EXPRESS_SERVICES as $expressService) {
            if (strpos($serviceType, $expressService) !== false) {
                return FedExConstants::CARRIER_FEDEX_EXPRESS;
            }
        }

        // Default to Ground
        return FedExConstants::CARRIER_FEDEX_GROUND;
    }

    /**
     * Truncate string to specified length
     *
     * @param  string|null  $text  Text to truncate
     * @param  int  $maxLength  Maximum length
     * @param  string  $default  Default value if text is empty
     * @return string Truncated text
     */
    public static function truncate(?string $text, int $maxLength, string $default = ''): string
    {
        return ! empty($text) ? mb_substr(trim($text), 0, $maxLength, 'UTF-8') : $default;
    }
}
