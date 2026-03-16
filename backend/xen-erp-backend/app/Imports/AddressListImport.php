<?php

namespace App\Imports;

use App\Models\Logistic\AddressList;
use Illuminate\Support\Carbon;
use Maatwebsite\Excel\Concerns\SkipsErrors;
use Maatwebsite\Excel\Concerns\SkipsFailures;
use Maatwebsite\Excel\Concerns\SkipsOnError;
use Maatwebsite\Excel\Concerns\SkipsOnFailure;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;

class AddressListImport implements SkipsOnError, SkipsOnFailure, ToModel, WithHeadingRow, WithValidation
{
    use SkipsErrors, SkipsFailures;

    protected $userId;

    protected $userName;

    protected $importedCount = 0;

    protected $updatedCount = 0;

    protected $errors = [];

    protected $skippedRows = [];

    // Required columns that must be present in the Excel file
    public static $requiredColumns = [
        'card_code',
        'company_name',
        'card_type',
        'street_1',
        'street_2',
        'street_3',
        'city',
        'state',
        'country',
        'postal_code',
        'contact_name',
        'contact',
        'phone',
        'email',
        'tax_id',
        'phone_1',
        'website',
        'eori_number',
        'bind_incoterms',
    ];

    public function __construct($userId, $userName)
    {
        $this->userId = $userId;
        $this->userName = $userName;
    }

    /**
     * Validate that all required columns are present in the Excel file
     */
    public static function validateColumns(array $headers): array
    {
        $normalizedHeaders = array_map(function ($header) {
            return strtolower(trim(str_replace(' ', '_', $header)));
        }, $headers);

        $missingColumns = [];
        foreach (self::$requiredColumns as $required) {
            if (! in_array($required, $normalizedHeaders)) {
                // Convert back to readable format for error message
                $readableColumn = ucwords(str_replace('_', ' ', $required));
                $missingColumns[] = $readableColumn;
            }
        }

        return $missingColumns;
    }

    public function model(array $row)
    {
        $now = Carbon::now();

        // Check if address already exists by CardCode
        $existingAddress = AddressList::where('CardCode', $row['card_code'])->first();

        if ($existingAddress) {
            // Update existing address
            $existingAddress->update([
                'company_name' => $row['company_name'] ?? $existingAddress->company_name,
                'CardType' => $row['card_type'] ?? $existingAddress->CardType,
                'street1' => $row['street_1'] ?? $existingAddress->street1,
                'street2' => $row['street_2'] ?? null,
                'street3' => $row['street_3'] ?? null,
                'city' => $row['city'] ?? $existingAddress->city,
                'state' => $row['state'] ?? $existingAddress->state,
                'country' => $row['country'] ?? $existingAddress->country,
                'postal_code' => $row['postal_code'] ?? $existingAddress->postal_code,
                'contact_name' => $row['contact_name'] ?? null,
                'contact' => $row['contact'] ?? null,
                'phone' => $row['phone'] ?? null,
                'email' => $row['email'] ?? null,
                'tax_id' => $row['tax_id'] ?? null,
                'phone1' => $row['phone_1'] ?? null,
                'website' => $row['website'] ?? null,
                'eori_number' => $row['eori_number'] ?? null,
                'bind_incoterms' => $row['bind_incoterms'] ?? null,
                'updated_userID' => $this->userId,
                'updated_time' => $now,
                'updated_user_name' => $this->userName,
            ]);

            $this->updatedCount++;

            return null;
        }

        // Create new address
        $this->importedCount++;

        $fullAddress = trim(
            ($row['street_1'] ?? '').' '.
            ($row['street_2'] ?? '').' '.
            ($row['street_3'] ?? '').' '.
            ($row['city'] ?? '').' '.
            ($row['state'] ?? '').' '.
            ($row['country'] ?? '').' '.
            ($row['postal_code'] ?? '')
        );

        return new AddressList([
            'CardCode' => $row['card_code'],
            'company_name' => $row['company_name'],
            'CardType' => $row['card_type'] ?? 'C',
            'full_address' => $fullAddress,
            'street1' => $row['street_1'] ?? null,
            'street2' => $row['street_2'] ?? null,
            'street3' => $row['street_3'] ?? null,
            'city' => $row['city'] ?? null,
            'state' => $row['state'] ?? null,
            'country' => $row['country'] ?? null,
            'postal_code' => $row['postal_code'] ?? null,
            'contact_name' => $row['contact_name'] ?? null,
            'contact' => $row['contact'] ?? null,
            'phone' => $row['phone'] ?? null,
            'email' => $row['email'] ?? null,
            'tax_id' => $row['tax_id'] ?? null,
            'phone1' => $row['phone_1'] ?? null,
            'website' => $row['website'] ?? null,
            'eori_number' => $row['eori_number'] ?? null,
            'bind_incoterms' => $row['bind_incoterms'] ?? null,
            'active' => 1,
            'created_userID' => $this->userId,
            'created_time' => $now,
            'created_user_name' => $this->userName,
        ]);
    }

    public function rules(): array
    {
        return [
            'card_code' => 'required|string|max:255',
            'company_name' => 'required|string|max:255',
            'card_type' => 'nullable|string|max:10',
            'street_1' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'country' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:20',
            'email' => 'nullable|string|max:255',
        ];
    }

    public function getImportedCount()
    {
        return $this->importedCount;
    }

    public function getUpdatedCount()
    {
        return $this->updatedCount;
    }

    public function getErrors()
    {
        return array_merge($this->errors, $this->failures()->toArray());
    }

    public function onError(\Throwable $e)
    {
        $this->errors[] = $e->getMessage();
    }
}
