## find Tokenfile and add the api link into except field 
## find 
find . -name 'VerifyCsrfToken.php'
./vendor/laravel/framework/src/Illuminate/Foundation/Http/Middleware/VerifyCsrfToken.php    

## add to except field
protected $except = [
    'logistics/dashboard/get_requests_per_month',
];