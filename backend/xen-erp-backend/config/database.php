<?php

use Illuminate\Support\Str;

// When DB_CONNECTION=sqlite (local dev), all logistic connections share the
// same SQLite file so migrations and models work without SQL Server.
$usingSqlite = env('DB_CONNECTION', 'sqlite') === 'sqlite';

$sqliteBase = [
    'driver'                  => 'sqlite',
    'database'                => database_path('database.sqlite'),
    'foreign_key_constraints' => env('DB_FOREIGN_KEYS', false),
    'prefix'                  => '',
    'prefix_indexes'          => true,
];

return [

    'default' => env('DB_CONNECTION', 'sqlite'),

    'connections' => [

        'sqlite' => [
            'driver'                  => 'sqlite',
            'database'                => env('DB_DATABASE', database_path('database.sqlite')),
            'foreign_key_constraints' => env('DB_FOREIGN_KEYS', false),
            'prefix'                  => '',
        ],

        'sqlsrv' => $usingSqlite ? $sqliteBase : [
            'driver'         => 'sqlsrv',
            'host'           => env('DB_HOST', 'localhost'),
            'port'           => env('DB_PORT', '1433'),
            'database'       => env('DB_DATABASE_LOGISTICS', 'Logistics'),
            'username'       => env('DB_USERNAME', ''),
            'password'       => env('DB_PASSWORD', ''),
            'charset'        => 'utf8',
            'prefix'         => '',
            'prefix_indexes' => true,
        ],

        'sqlsrv_mfg' => $usingSqlite ? $sqliteBase : [
            'driver'         => 'sqlsrv',
            'host'           => env('DB_HOST_MFG', 'localhost'),
            'port'           => env('DB_PORT', '1433'),
            'database'       => env('DB_DATABASE_MFG', 'MFG'),
            'username'       => env('DB_USERNAME', ''),
            'password'       => env('DB_PASSWORD', ''),
            'charset'        => env('DB_CHARSET', 'utf8'),
            'prefix'         => '',
            'prefix_indexes' => true,
        ],

        'sqlsrv_xenapi_mfg' => $usingSqlite ? $sqliteBase : [
            'driver'         => 'sqlsrv',
            'host'           => env('DB_HOST_XEN_API', 'localhost'),
            'port'           => env('DB_PORT_XEN_API', '1433'),
            'database'       => env('DB_DATABASE_XEN_API_MFG', 'MFG'),
            'username'       => env('DB_USERNAME_XEN_API', ''),
            'password'       => env('DB_PASSWORD_XEN_API', ''),
            'charset'        => env('DB_CHARSET', 'utf8'),
            'prefix'         => '',
            'prefix_indexes' => true,
        ],

        'sqlsrv_xen_db' => $usingSqlite ? $sqliteBase : [
            'driver'         => 'sqlsrv',
            'host'           => env('DB_HOST_XEN_DB', 'localhost'),
            'port'           => env('DB_PORT_XEN_DB', '1433'),
            'database'       => env('DB_DATABASE_XEN_DB', 'XEN'),
            'username'       => env('DB_USERNAME_XEN_DB', ''),
            'password'       => env('DB_PASSWORD_XEN_DB', ''),
            'charset'        => env('DB_CHARSET_XEN_DB', 'utf8'),
            'prefix'         => '',
            'prefix_indexes' => true,
            'options'        => [
                \PDO::ATTR_TIMEOUT => 30,
                ...(defined('PDO::SQLSRV_ATTR_QUERY_TIMEOUT') ? [\PDO::SQLSRV_ATTR_QUERY_TIMEOUT => 30] : []),
            ],
        ],
    ],

    'migrations' => [
        'table'                => 'migrations',
        'update_date_on_publish' => true,
    ],

    'redis' => [

        'client' => env('REDIS_CLIENT', 'phpredis'),

        'options' => [
            'cluster'    => env('REDIS_CLUSTER', 'redis'),
            'prefix'     => env('REDIS_PREFIX', Str::slug((string) env('APP_NAME', 'laravel')).'-database-'),
            'persistent' => env('REDIS_PERSISTENT', false),
        ],

        'default' => [
            'url'      => env('REDIS_URL'),
            'host'     => env('REDIS_HOST', '127.0.0.1'),
            'username' => env('REDIS_USERNAME'),
            'password' => env('REDIS_PASSWORD'),
            'port'     => env('REDIS_PORT', '6379'),
            'database' => env('REDIS_DB', '0'),
        ],

        'cache' => [
            'url'      => env('REDIS_URL'),
            'host'     => env('REDIS_HOST', '127.0.0.1'),
            'username' => env('REDIS_USERNAME'),
            'password' => env('REDIS_PASSWORD'),
            'port'     => env('REDIS_PORT', '6379'),
            'database' => env('REDIS_CACHE_DB', '1'),
        ],
    ],
];
