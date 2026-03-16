<?php

namespace App\Http\Controllers\Logistic;

use App\Models\Logistic\RequestTopic;

class RequestTopicController
{
    public function getAllRequestTopics()
    {
        $requestTopics = RequestTopic::all();

        $requestTopicsCount = $requestTopics->count();

        foreach ($requestTopics as $reqTopic) {
            $reqTopic['request_topic_edited'] = ucwords($reqTopic['request_topic']);
        }

        $requestTopicsDesc = $requestTopics->reverse()->values();

        return response()->json([
            'request_topics_count' => $requestTopicsCount,
            'request_topics' => $requestTopics,
            'request_topics_desc' => $requestTopicsDesc,
        ], 200);
    }
}

// getAllRequestTopics RequestTopicController
