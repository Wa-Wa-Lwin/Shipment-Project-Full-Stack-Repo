<?php

namespace App\Http\Controllers\Logistic;

use Illuminate\Support\Facades\Log;

class NotUseFunctionsController
{
    public function __construct() {}

    private function cleanString($string)
    {
        $cleaned = iconv('UTF-8', 'UTF-8//IGNORE', $string);
        if ($cleaned !== $string) {
            // Log::warning("String cleaned: original=[$string] cleaned=[$cleaned]");
        }

        return $cleaned;
    }

    private function toUtf8Recursive($data)
    {
        if (is_string($data)) {
            return $this->cleanString($data);
        } elseif (is_array($data)) {
            foreach ($data as $key => $value) {
                unset($data[$key]);
                $cleanKey = $this->toUtf8Recursive($key);
                $data[$cleanKey] = $this->toUtf8Recursive($value);
            }
        } elseif (is_object($data)) {
            foreach ($data as $key => $value) {
                unset($data->$key);
                $cleanKey = $this->toUtf8Recursive($key);
                $data->$cleanKey = $this->toUtf8Recursive($value);
            }
        }

        return $data;
    }
}
