<?php

return [
    // Comma-separated lists can be set in .env, e.g.
    // WAREHOUSE_EMAILS="wawa@xenoptics.com,susu@xenoptics.com"
    'warehouse_emails' => array_filter(
        array_map(
            'trim',
            explode(',', env('WAREHOUSE_EMAILS', ''))
        )
    ),

    // Logistic team emails
    'logistic_team_emails' => array_filter(
        array_map(
            'trim',
            explode(',', env('LOGISTIC_TEAM_EMAILS', ''))
        )
    ),

    // General approver fallback list (optional)
    'approver_emails' => array_filter(
        array_map(
            'trim',
            explode(',', env('APPROVER_EMAILS', ''))
        )
    ),

    // Developer testing: when requestor is this email, all notifications go only to them
    // Set to null or empty string to disable this feature
    'developer_test_email' => env('DEVELOPER_TEST_EMAIL', null),
];
