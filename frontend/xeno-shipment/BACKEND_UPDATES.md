# Backend Updates Required

## File: `app/Imports/AddressListImport.php`

Add these properties and method to the `AddressListImport` class:

```php
<?php

namespace App\Imports;

use App\Models\Logistic\AddressList;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Maatwebsite\Excel\Concerns\SkipsOnError;
use Maatwebsite\Excel\Concerns\SkipsErrors;
use Maatwebsite\Excel\Concerns\SkipsOnFailure;
use Maatwebsite\Excel\Concerns\SkipsFailures;
use Illuminate\Support\Carbon;

class AddressListImport implements ToModel, WithHeadingRow, WithValidation, SkipsOnError, SkipsOnFailure
{
    use SkipsErrors, SkipsFailures;

    protected $userId;
    protected $userName;
    protected $importedCount = 0;
    protected $updatedCount = 0;

    // ADD THIS: Required columns list
    public static $requiredColumns = [
        'card_code',
        'company_name',
        'card_type',
        'street_1',
        'city',
        'state',
        'country',
        'postal_code',
        'contact_name'
    ];

    public function __construct($userId, $userName)
    {
        $this->userId = $userId;
        $this->userName = $userName;
    }

    // ADD THIS: Column validation method
    public static function validateColumns(array $headings): array
    {
        $missingColumns = [];

        foreach (self::$requiredColumns as $required) {
            if (!in_array($required, $headings)) {
                $missingColumns[] = ucwords(str_replace('_', ' ', $required));
            }
        }

        return $missingColumns;
    }

    public function model(array $row)
    {
        // ... rest of the existing code
    }

    // ... rest of the existing code
}
```

## Notes:
- The `$requiredColumns` property lists all mandatory Excel columns
- The `validateColumns()` method checks if all required columns are present
- Returns an array of missing column names (empty if all present)
