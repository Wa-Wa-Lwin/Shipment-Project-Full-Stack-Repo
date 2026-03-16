<?php

namespace App\Models\Logistic;

use Illuminate\Database\Eloquent\Model;

class ShipmentRequestHistory extends Model
{
    protected $connection = 'sqlsrv';

    protected $table = 'Shipment_Request_History';

    protected $primaryKey = 'shipmentRequestHistoryID';

    public $incrementing = true;

    protected $keyType = 'int';

    public $timestamps = false;

    protected $fillable = [
        'shipment_request_created_date_time',
        'user_id',
        'user_name',
        'user_role',
        'status',
        'remark',
        'history_count',
        'shipment_request_id',
        'history_record_date_time',
    ];

    public function shipmentRequest()
    {
        return $this->belongsTo(ShipmentRequest::class, 'shipment_request_id', 'shipmentRequestID');
    }
}
