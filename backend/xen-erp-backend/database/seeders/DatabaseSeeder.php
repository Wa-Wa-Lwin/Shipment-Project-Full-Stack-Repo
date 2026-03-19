<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ── User_List (demo user, used by the MFG / xenapi connection) ──────────
        DB::table('User_List')->insertOrIgnore([
            'username'     => 'admin',
            'password'     => bcrypt('12345'),
            'firstName'    => 'Demo',
            'lastName'     => 'Admin',
            'gender'       => 'M',
            'phone'        => '0000000000',
            'email'        => 'admin',
            'departmentID' => 'IT',
            'section_index'=> '1',
            'postitionID'  => '1',
            'active'       => '1',
            'role'         => 'admin',
            'user_code'    => 'ADM001',
            'supervisorID' => null,
            'level'        => '1',
            'headID'       => null,
            'logisticRole' => 'Logistic',
        ]);

        // ── User_Role_List ───────────────────────────────────────────────────────
        DB::table('User_Role_List')->insertOrIgnore([
            'Email'              => 'admin',
            'Logistic'           => true,
            'Developer'          => true,
            'Approver'           => true,
            'Supervisor'         => true,
            'Warehouse'          => true,
            'created_user_email' => 'admin',
            'created_at'         => now(),
            'updated_at'         => now(),
        ]);

        // ── Request topics ───────────────────────────────────────────────────────
        $topics = [
            'Export Shipment',
            'Import Shipment',
            'Domestic Delivery',
            'Return Shipment',
            'Sample Shipment',
            'Urgent Shipment',
        ];
        foreach ($topics as $topic) {
            DB::table('Request_Topic')->insertOrIgnore([
                'request_topic'      => $topic,
                'active'             => '1',
                'created_by_user_id' => 1,
                'created_at'         => now(),
            ]);
        }

        // ── Parcel Box Types ─────────────────────────────────────────────────────
        $boxTypes = [
            [1, 'standard', 'Small Box',   20, 15, 10],
            [2, 'standard', 'Medium Box',  30, 25, 20],
            [3, 'standard', 'Large Box',   40, 35, 30],
            [4, 'standard', 'XL Box',      60, 50, 40],
            [5, 'envelope', 'Envelope',    35,  5,  1],
            [6, 'tube',     'Tube',        100, 15, 15],
        ];
        foreach ($boxTypes as [$id, $type, $name, $d, $w, $h]) {
            DB::table('Parcel_Box_Type')->insertOrIgnore([
                'parcelBoxTypeID' => $id,
                'type'            => $type,
                'box_type_name'   => $name,
                'depth'           => $d,
                'width'           => $w,
                'height'          => $h,
                'dimension_unit'  => 'cm',
                'parcel_weight'   => 0,
                'weight_unit'     => 'kg',
                'active'          => true,
                'created_at'      => now(),
                'updated_at'      => now(),
            ]);
        }

        // ── Address List (sample addresses) ─────────────────────────────────────
        DB::table('Address_List')->insertOrIgnore([
            [
                'company_name'  => 'Xenoptics Co., Ltd.',
                'full_address'  => '123 Bangna-Trad Road, Bangna, Bangkok 10260',
                'street1'       => '123 Bangna-Trad Road',
                'city'          => 'Bangkok',
                'state'         => 'Bangkok',
                'country'       => 'TH',
                'postal_code'   => '10260',
                'contact_name'  => 'Logistics Team',
                'phone'         => '+66-2-000-0000',
                'email'         => 'logistics@xenoptics.com',
                'active'        => '1',
                'created_time'  => now(),
            ],
        ]);

        // ── DHL Ecommerce Domestic Rate List (sample rates) ──────────────────────
        $dhlRates = [
            [0.001, 0.500,  35.00,  45.00],
            [0.501, 1.000,  45.00,  55.00],
            [1.001, 2.000,  55.00,  65.00],
            [2.001, 3.000,  65.00,  75.00],
            [3.001, 5.000,  75.00,  90.00],
            [5.001, 10.000, 100.00, 120.00],
            [10.001,20.000, 150.00, 180.00],
        ];
        foreach ($dhlRates as [$min, $max, $bkk, $upc]) {
            DB::table('DHL_Ecommerce_Domestic_Rate_List')->insertOrIgnore([
                'min_weight_kg'  => $min,
                'max_weight_kg'  => $max,
                'bkk_charge_thb' => $bkk,
                'upc_charge_thb' => $upc,
            ]);
        }
    }
}
