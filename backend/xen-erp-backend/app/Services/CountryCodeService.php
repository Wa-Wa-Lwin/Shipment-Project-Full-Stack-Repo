<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

class CountryCodeService
{
    /**
     * Comprehensive mapping of ISO 3166-1 alpha-3 to alpha-2 country codes
     */
    private array $countryMapping = [
        'AFG' => 'AF', // Afghanistan
        'ALB' => 'AL', // Albania
        'DZA' => 'DZ', // Algeria
        'AND' => 'AD', // Andorra
        'AGO' => 'AO', // Angola
        'ARG' => 'AR', // Argentina
        'ARM' => 'AM', // Armenia
        'AUS' => 'AU', // Australia
        'AUT' => 'AT', // Austria
        'AZE' => 'AZ', // Azerbaijan
        'BHS' => 'BS', // Bahamas
        'BHR' => 'BH', // Bahrain
        'BGD' => 'BD', // Bangladesh
        'BRB' => 'BB', // Barbados
        'BLR' => 'BY', // Belarus
        'BEL' => 'BE', // Belgium
        'BLZ' => 'BZ', // Belize
        'BEN' => 'BJ', // Benin
        'BTN' => 'BT', // Bhutan
        'BOL' => 'BO', // Bolivia
        'BIH' => 'BA', // Bosnia and Herzegovina
        'BWA' => 'BW', // Botswana
        'BRA' => 'BR', // Brazil
        'BRN' => 'BN', // Brunei Darussalam
        'BGR' => 'BG', // Bulgaria
        'BFA' => 'BF', // Burkina Faso
        'BDI' => 'BI', // Burundi
        'KHM' => 'KH', // Cambodia
        'CMR' => 'CM', // Cameroon
        'CAN' => 'CA', // Canada
        'CHL' => 'CL', // Chile
        'CHN' => 'CN', // China
        'COL' => 'CO', // Colombia
        'COG' => 'CG', // Congo
        'CRI' => 'CR', // Costa Rica
        'HRV' => 'HR', // Croatia
        'CUB' => 'CU', // Cuba
        'CYP' => 'CY', // Cyprus
        'CZE' => 'CZ', // Czech Republic
        'DNK' => 'DK', // Denmark
        'DOM' => 'DO', // Dominican Republic
        'ECU' => 'EC', // Ecuador
        'EGY' => 'EG', // Egypt
        'SLV' => 'SV', // El Salvador
        'EST' => 'EE', // Estonia
        'ETH' => 'ET', // Ethiopia
        'FIN' => 'FI', // Finland
        'FRA' => 'FR', // France
        'GEO' => 'GE', // Georgia
        'DEU' => 'DE', // Germany
        'GRC' => 'GR', // Greece
        'HKG' => 'HK', // Hong Kong
        'HUN' => 'HU', // Hungary
        'ISL' => 'IS', // Iceland
        'IND' => 'IN', // India
        'IDN' => 'ID', // Indonesia
        'IRN' => 'IR', // Iran
        'IRQ' => 'IQ', // Iraq
        'IRL' => 'IE', // Ireland
        'ISR' => 'IL', // Israel
        'ITA' => 'IT', // Italy
        'JPN' => 'JP', // Japan
        'JOR' => 'JO', // Jordan
        'KAZ' => 'KZ', // Kazakhstan
        'KEN' => 'KE', // Kenya
        'KOR' => 'KR', // South Korea
        'KWT' => 'KW', // Kuwait
        'LAO' => 'LA', // Laos
        'LVA' => 'LV', // Latvia
        'LBN' => 'LB', // Lebanon
        'LTU' => 'LT', // Lithuania
        'LUX' => 'LU', // Luxembourg
        'MAC' => 'MO', // Macao
        'MDG' => 'MG', // Madagascar
        'MWI' => 'MW', // Malawi
        'MYS' => 'MY', // Malaysia
        'MDV' => 'MV', // Maldives
        'MLT' => 'MT', // Malta
        'MEX' => 'MX', // Mexico
        'MDA' => 'MD', // Moldova
        'MNG' => 'MN', // Mongolia
        'MAR' => 'MA', // Morocco
        'MMR' => 'MM', // Myanmar
        'NPL' => 'NP', // Nepal
        'NLD' => 'NL', // Netherlands
        'NZL' => 'NZ', // New Zealand
        'NGA' => 'NG', // Nigeria
        'NOR' => 'NO', // Norway
        'OMN' => 'OM', // Oman
        'PAK' => 'PK', // Pakistan
        'PAN' => 'PA', // Panama
        'PER' => 'PE', // Peru
        'PHL' => 'PH', // Philippines
        'POL' => 'PL', // Poland
        'PRT' => 'PT', // Portugal
        'QAT' => 'QA', // Qatar
        'ROU' => 'RO', // Romania
        'RUS' => 'RU', // Russia
        'SAU' => 'SA', // Saudi Arabia
        'SRB' => 'RS', // Serbia
        'SGP' => 'SG', // Singapore
        'SVK' => 'SK', // Slovakia
        'SVN' => 'SI', // Slovenia
        'ZAF' => 'ZA', // South Africa
        'ESP' => 'ES', // Spain
        'LKA' => 'LK', // Sri Lanka
        'SWE' => 'SE', // Sweden
        'CHE' => 'CH', // Switzerland
        'TWN' => 'TW', // Taiwan
        'TZA' => 'TZ', // Tanzania
        'THA' => 'TH', // Thailand
        'TUR' => 'TR', // Turkey
        'UGA' => 'UG', // Uganda
        'UKR' => 'UA', // Ukraine
        'ARE' => 'AE', // United Arab Emirates
        'GBR' => 'GB', // United Kingdom
        'USA' => 'US', // United States
        'URY' => 'UY', // Uruguay
        'UZB' => 'UZ', // Uzbekistan
        'VNM' => 'VN', // Vietnam
        'ZMB' => 'ZM', // Zambia
        'ZWE' => 'ZW', // Zimbabwe
    ];

    /**
     * Convert ISO 3166-1 alpha-3 (3-character) country code to alpha-2 (2-character)
     * Used for APIs that require 2-character country codes (e.g., FedEx API)
     *
     * @param  string|null  $iso3Code  3-character country code (e.g., 'THA', 'USA')
     * @return string 2-character country code (e.g., 'TH', 'US')
     */
    public function convertToISO2(?string $iso3Code): string
    {
        // Handle null or empty input
        if (empty($iso3Code)) {
            Log::warning('Empty country code provided to CountryCodeService');

            return '';
        }

        // Convert to uppercase for case-insensitive matching
        $iso3Code = strtoupper(trim($iso3Code));

        // Return as-is if already 2 characters
        if (strlen($iso3Code) === 2) {
            return $iso3Code;
        }

        // Return mapped code if found
        if (isset($this->countryMapping[$iso3Code])) {
            return $this->countryMapping[$iso3Code];
        }

        // If not found in mapping, log warning and return first 2 characters as fallback
        Log::warning('Country code not found in ISO3 to ISO2 mapping', [
            'iso3_code' => $iso3Code,
            'fallback' => substr($iso3Code, 0, 2),
        ]);

        return substr($iso3Code, 0, 2);
    }

    /**
     * Convert ISO 3166-1 alpha-2 (2-character) country code to alpha-3 (3-character)
     * Reverse lookup for when you need to convert back
     *
     * @param  string|null  $iso2Code  2-character country code (e.g., 'TH', 'US')
     * @return string|null 3-character country code (e.g., 'THA', 'USA') or null if not found
     */
    public function convertToISO3(?string $iso2Code): ?string
    {
        // Handle null or empty input
        if (empty($iso2Code)) {
            return null;
        }

        // Convert to uppercase for case-insensitive matching
        $iso2Code = strtoupper(trim($iso2Code));

        // Return as-is if already 3 characters
        if (strlen($iso2Code) === 3) {
            return $iso2Code;
        }

        // Reverse lookup
        $iso3Code = array_search($iso2Code, $this->countryMapping);

        if ($iso3Code !== false) {
            return $iso3Code;
        }

        // If not found in mapping, log warning
        Log::warning('Country code not found in ISO2 to ISO3 mapping', [
            'iso2_code' => $iso2Code,
        ]);

        return null;
    }

    /**
     * Check if a country code is valid (exists in mapping)
     *
     * @param  string|null  $countryCode  Country code to validate
     */
    public function isValidCountryCode(?string $countryCode): bool
    {
        if (empty($countryCode)) {
            return false;
        }

        $countryCode = strtoupper(trim($countryCode));

        // Check if it's a valid 3-character code
        if (strlen($countryCode) === 3) {
            return isset($this->countryMapping[$countryCode]);
        }

        // Check if it's a valid 2-character code
        if (strlen($countryCode) === 2) {
            return in_array($countryCode, $this->countryMapping);
        }

        return false;
    }

    /**
     * Get all supported country codes
     *
     * @return array ['iso3' => 'iso2', ...]
     */
    public function getAllCountryCodes(): array
    {
        return $this->countryMapping;
    }

    /**
     * Get country name by code (basic implementation)
     * Can be extended with a full country name mapping if needed
     *
     * @param  string  $countryCode  Either ISO2 or ISO3 code
     */
    public function getCountryName(string $countryCode): ?string
    {
        // This is a basic implementation
        // You can extend this with a full mapping of country names
        $countryCode = strtoupper(trim($countryCode));

        // Convert to ISO2 if needed
        if (strlen($countryCode) === 3) {
            $countryCode = $this->convertToISO2($countryCode);
        }

        // Basic country names (can be extended)
        $countryNames = [
            'TH' => 'Thailand',
            'US' => 'United States',
            'CN' => 'China',
            'JP' => 'Japan',
            'GB' => 'United Kingdom',
            'DE' => 'Germany',
            'FR' => 'France',
            // Add more as needed
        ];

        return $countryNames[$countryCode] ?? null;
    }
}
