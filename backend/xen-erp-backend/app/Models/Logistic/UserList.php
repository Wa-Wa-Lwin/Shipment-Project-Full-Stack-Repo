<?php

namespace App\Models\Logistic;

use Illuminate\Database\Eloquent\Model;

class UserList extends Model
{
    // Use the MFG database connection
    protected $connection = 'sqlsrv_xenapi_mfg';
    // protected $connection = 'sqlsrv_mfg';

    // Table name
    protected $table = 'User_List';

    // Primary key
    protected $primaryKey = 'userID';

    public $incrementing = true;

    protected $keyType = 'int';

    // Disable timestamps
    public $timestamps = false;

    // Mass assignable columns
    protected $fillable = [
        'username',
        'password',
        'firstName',
        'lastName',
        'gender',
        'phone',
        'email',
        'departmentID',
        'section_index',
        'postitionID',
        'active',
        'role',
        'user_code',
        'supervisorID',
        'level',
        'headID',
        'logisticRole',
    ];

    // 🔹 Approver relationship (headID → userID)
    public function approver()
    {
        return $this->belongsTo(UserList::class, 'headID', 'userID');
    }

    // 🔹 Supervisor relationship (supervisorID → userID)
    public function supervisor()
    {
        return $this->belongsTo(UserList::class, 'supervisorID', 'userID');
    }
}
