<?php

namespace App\Http\Controllers\Logistic;

use Illuminate\Support\Facades\DB;

class GetAddressListFromXenDBController
{
    public function getAddressView()
    {
        try {
            // Test database connection first
            $connection = DB::connection('sqlsrv_xen_db');
            $connection->getPdo();

            // Execute query with reduced page size to avoid timeouts
            $data = $connection
                ->table('Address_View')
                ->paginate(10); // Reduced to 10 rows per page to avoid timeouts

            // Return same structure as SP
            return response()->json([
                'ret_obj' => [[
                    'ret' => 0,
                    'msg' => 'Return Address list',
                    'data' => $data,
                ]],
            ]);
        } catch (\PDOException $e) {
            return response()->json([
                'ret_obj' => [[
                    'ret' => 1,
                    'msg' => 'Database connection failed',
                    'error' => 'Cannot connect to XEN database: '.$e->getMessage(),
                ]],
            ], 503);
        } catch (\Exception $e) {
            return response()->json([
                'ret_obj' => [[
                    'ret' => 1,
                    'msg' => 'Failed to fetch address list',
                    'error' => $e->getMessage(),
                ]],
            ], 500);
        }
    }
}
