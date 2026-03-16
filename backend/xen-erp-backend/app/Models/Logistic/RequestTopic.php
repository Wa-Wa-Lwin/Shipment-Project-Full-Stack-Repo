<?php

namespace App\Models\Logistic;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RequestTopic extends Model
{
    use HasFactory;

    protected $connection = 'sqlsrv';

    // Table name
    protected $table = 'Request_Topic';

    // Primary key
    protected $primaryKey = 'reqTopicID';

    public $incrementing = true;

    protected $keyType = 'int';

    // Timestamps
    public $timestamps = false; // since you're manually storing created_at/updated_at with datetimeoffset

    // Fillable columns
    protected $fillable = [
        'request_topic',
        'active',
        'remark',
        'created_by_user_id',
        'created_at',
        'updated_by_user_id',
        'updated_at',
    ];
}
