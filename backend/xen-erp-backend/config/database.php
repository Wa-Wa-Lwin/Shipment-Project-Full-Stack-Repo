<?php

use Illuminate\Support\Str;

return [

    /*
    |--------------------------------------------------------------------------
    | Default Database Connection Name
    |--------------------------------------------------------------------------
    |
    | Here you may specify which of the database connections below you wish
    | to use as your default connection for database operations. This is
    | the connection which will be utilized unless another connection
    | is explicitly specified when you execute a query / statement.
    |
    */

    'default' => env('DB_CONNECTION', 'sqlite'),

    /*
    |--------------------------------------------------------------------------
    | Database Connections
    |--------------------------------------------------------------------------
    |
    | Below are all of the database connections defined for your application.
    | An example configuration is provided for each database system which
    | is supported by Laravel. You're free to add / remove connections.
    |
    */

    'connections' => [

        'sqlsrv' => [
            'driver' => 'sqlsrv',
            'host' => env('DB_HOST', 'localhost'),
            'port' => env('DB_PORT', '1433'),
            'database' => env('DB_DATABASE_LOGISTICS', 'Logistics'),
            'username' => env('DB_USERNAME', 'root'),
            'password' => env('DB_PASSWORD', ''),
            'charset' => 'utf8',
            'prefix' => '',
            'prefix_indexes' => true,
        ],

        'sqlsrv_mfg' => [
            'driver' => 'sqlsrv',
            'host' => env('DB_HOST_MFG', 'localhost'),
            'port' => env('DB_PORT', '1433'),
            'database' => env('DB_DATABASE_MFG', 'MFG'),
            'username' => env('DB_USERNAME', 'root'),
            'password' => env('DB_PASSWORD', ''),
            'charset' => env('DB_CHARSET', 'utf8'),
            'prefix' => '',
            'prefix_indexes' => true,
        ],

        'sqlsrv_xenapi_mfg' => [
            'driver' => 'sqlsrv',
            'host' => env('DB_HOST_XEN_API', 'localhost'),
            'port' => env('DB_PORT_XEN_API', '1433'),
            'database' => env('DB_DATABASE_XEN_API_MFG', 'MFG'),
            'username' => env('DB_USERNAME_XEN_API', 'root'),
            'password' => env('DB_PASSWORD_XEN_API', ''),
            'charset' => env('DB_CHARSET', 'utf8'),
            'prefix' => '',
            'prefix_indexes' => true,
        ],

        'sqlsrv_xen_db' => [
            'driver' => 'sqlsrv',
            'host' => env('DB_HOST_XEN_DB', 'localhost'),
            'port' => env('DB_PORT_XEN_DB', '1433'),
            'database' => env('DB_DATABASE_XEN_DB', 'XEN'),
            'username' => env('DB_USERNAME_XEN_DB', 'root'),
            'password' => env('DB_PASSWORD_XEN_DB', ''),
            'charset' => env('DB_CHARSET_XEN_DB', 'utf8'),
            'prefix' => '',
            'prefix_indexes' => true,
            'options' => [
                \PDO::ATTR_TIMEOUT => 30, // 30 seconds timeout
                ...(defined('PDO::SQLSRV_ATTR_QUERY_TIMEOUT') ? [\PDO::SQLSRV_ATTR_QUERY_TIMEOUT => 30] : []),
            ],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Migration Repository Table
    |--------------------------------------------------------------------------
    |
    | This table keeps track of all the migrations that have already run for
    | your application. Using this information, we can determine which of
    | the migrations on disk haven't actually been run on the database.
    |
    */

    'migrations' => [
        'table' => 'migrations',
        'update_date_on_publish' => true,
    ],

    /*
    |--------------------------------------------------------------------------
    | Redis Databases
    |--------------------------------------------------------------------------
    |
    | Redis is an open source, fast, and advanced key-value store that also
    | provides a richer body of commands than a typical key-value system
    | such as Memcached. You may define your connection settings here.
    |
    */

    'redis' => [

        'client' => env('REDIS_CLIENT', 'phpredis'),

        'options' => [
            'cluster' => env('REDIS_CLUSTER', 'redis'),
            'prefix' => env('REDIS_PREFIX', Str::slug((string) env('APP_NAME', 'laravel')).'-database-'),
            'persistent' => env('REDIS_PERSISTENT', false),
        ],

        'default' => [
            'url' => env('REDIS_URL'),
            'host' => env('REDIS_HOST', '127.0.0.1'),
            'username' => env('REDIS_USERNAME'),
            'password' => env('REDIS_PASSWORD'),
            'port' => env('REDIS_PORT', '6379'),
            'database' => env('REDIS_DB', '0'),
        ],

        'cache' => [
            'url' => env('REDIS_URL'),
            'host' => env('REDIS_HOST', '127.0.0.1'),
            'username' => env('REDIS_USERNAME'),
            'password' => env('REDIS_PASSWORD'),
            'port' => env('REDIS_PORT', '6379'),
            'database' => env('REDIS_CACHE_DB', '1'),
        ],

    ],

];
