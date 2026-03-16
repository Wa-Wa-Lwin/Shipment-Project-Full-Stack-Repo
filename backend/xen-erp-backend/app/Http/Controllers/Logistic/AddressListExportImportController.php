<?php

namespace App\Http\Controllers\Logistic;

use App\Exports\AddressListExport;
use App\Exports\AddressListTemplateExport;
use App\Http\Controllers\Controller;
use App\Imports\AddressListImport;
use App\Imports\HeadingRowImport;
use App\Models\Logistic\AddressList;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class AddressListExportImportController extends Controller
{
    /**
     * Export all active addresses to Excel
     */
    public function exportAddresses()
    {
        try {
            $filename = 'address_list_'.date('Y-m-d_His').'.xlsx';

            return Excel::download(new AddressListExport, $filename);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to export addresses',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Export empty template for address import
     */
    public function exportTemplate()
    {
        try {
            $filename = 'address_list_template_'.date('Y-m-d_His').'.xlsx';

            return Excel::download(new AddressListTemplateExport, $filename);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to export template',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Import addresses from Excel file
     */
    public function importAddresses(Request $request)
    {
        $request->validate([
            'file' => 'required|mimes:xlsx,xls|max:10240',
        ]);

        try {
            $file = $request->file('file');

            // Read the header row to validate columns
            $data = Excel::toArray(new HeadingRowImport, $file);
            $headings = $data[0][0] ?? [];

            // Validate that all required columns are present
            $missingColumns = AddressListImport::validateColumns($headings);

            if (! empty($missingColumns)) {
                $missingList = implode(', ', $missingColumns);

                return response()->json([
                    'status' => 'error',
                    'message' => 'Import file is missing required columns: '.$missingList,
                    'missing_columns' => $missingColumns,
                    'required_columns' => array_map(function ($col) {
                        return ucwords(str_replace('_', ' ', $col));
                    }, AddressListImport::$requiredColumns),
                ], 422);
            }

            // Get user information from request or use default
            $userId = $request->input('user_id', 0);
            $userName = $request->input('user_name', 'System');

            $import = new AddressListImport($userId, $userName);
            Excel::import($import, $file);

            $failures = $import->failures();
            $errors = $import->getErrors();
            $importedCount = $import->getImportedCount();
            $updatedCount = $import->getUpdatedCount();
            $totalProcessed = $importedCount + $updatedCount;

            // If nothing was imported/updated and there are failures, return error
            if ($totalProcessed === 0 && count($failures) > 0) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Import failed: All rows have validation errors',
                    'imported_count' => $importedCount,
                    'updated_count' => $updatedCount,
                    'failures' => $failures,
                    'errors' => $errors,
                ], 422);
            }

            // If some rows were processed but others failed, return partial success
            if ($totalProcessed > 0 && count($failures) > 0) {
                return response()->json([
                    'status' => 'partial_success',
                    'message' => "Partially imported: {$totalProcessed} successful, ".count($failures).' failed',
                    'imported_count' => $importedCount,
                    'updated_count' => $updatedCount,
                    'failures' => $failures,
                    'errors' => $errors,
                ], 200);
            }

            // Full success
            return response()->json([
                'status' => 'success',
                'message' => 'Addresses imported successfully',
                'imported_count' => $importedCount,
                'updated_count' => $updatedCount,
                'failures' => $failures,
                'errors' => $errors,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to import addresses',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get address list for preview before export
     */
    public function getAddressList()
    {
        try {
            $addresses = AddressList::where('active', 1)->get();

            return response()->json([
                'status' => 'success',
                'data' => $addresses,
                'count' => $addresses->count(),
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve addresses',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
