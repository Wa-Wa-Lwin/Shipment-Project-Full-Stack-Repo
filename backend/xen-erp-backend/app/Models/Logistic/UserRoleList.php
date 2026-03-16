<?php

namespace App\Models\Logistic;

use Illuminate\Database\Eloquent\Model;

class UserRoleList extends Model
{
    // Use the Logistics database connection
    protected $connection = 'sqlsrv';

    // Table name
    protected $table = 'User_Role_List';

    // Primary key
    protected $primaryKey = 'userRoleListID';

    public $incrementing = true;

    protected $keyType = 'int';

    // Disable automatic timestamps (table has custom created_at/updated_at)
    public $timestamps = false;

    // Mass assignable columns
    protected $fillable = [
        'Email',
        'Logistic',
        'Developer',
        'Approver',
        'Supervisor',
        'Warehouse',
        'created_user_email',
        'updated_user_email',
        'created_at',
        'updated_at',
    ];

    // Cast BIT fields to boolean
    protected $casts = [
        'Logistic' => 'boolean',
        'Developer' => 'boolean',
        'Approver' => 'boolean',
        'Supervisor' => 'boolean',
        'Warehouse' => 'boolean',
    ];
}
