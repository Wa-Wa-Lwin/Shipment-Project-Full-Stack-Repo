<?php

namespace App\Models\Logistic;

use Illuminate\Database\Eloquent\Model;

class RateRequest extends Model
{
    protected $connection = 'sqlsrv';

    protected $table = 'Rate_Request';

    protected $primaryKey = 'rateRequestID';

    public $timestamps = true;

    protected $fillable = [
        'ship_from_id',
        'ship_to_id',
        'created_at',
        'updated_at',
        'service_options',
        'status',
        'created_by_user_name',
        'created_by_user_id',
    ];

    /**
     * Add a new rate request.
     */
    public function addRateRequest($data)
    {
        return self::create($data);
    }

    /**
     * Get all rate requests.
     */
    public function getAllRateRequests()
    {
        return self::all();
    }

    /**
     * Get a rate request by ID.
     */
    public function getRateRequestById($rateRequestId)
    {
        return self::find($rateRequestId);
    }

    /**
     * Update a rate request by ID.
     */
    public function updateRateRequest($rateRequestId, $data)
    {
        $rateRequest = self::find($rateRequestId);

        if ($rateRequest) {
            $rateRequest->update($data);

            return $rateRequest;
        }

        return null;
    }

    /**
     * Delete a rate request by ID.
     */
    public function deleteRateRequest($rateRequestId)
    {
        $rateRequest = self::find($rateRequestId);

        if ($rateRequest) {
            $rateRequest->delete();

            return true;
        }

        return false;
    }
}
