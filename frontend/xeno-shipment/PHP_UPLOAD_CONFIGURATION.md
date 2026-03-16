# PHP Upload Configuration for Large Files

## Issue
`ERR_CONNECTION_RESET` when uploading files (e.g., 2MB PDF) in shipment edit form.

## Root Cause
PHP has default limits that are often too small for file uploads. The connection resets when these limits are exceeded.

## Solution: Update PHP Configuration

### 1. Locate your `php.ini` file
```bash
# Find php.ini location
php --ini

# Or check in Laravel
php artisan tinker
phpinfo();
```

Common locations:
- Windows XAMPP: `C:\xampp\php\php.ini`
- Windows Laragon: `C:\laragon\bin\php\php8.x\php.ini`
- Linux: `/etc/php/8.x/apache2/php.ini` or `/etc/php/8.x/fpm/php.ini`
- macOS: `/usr/local/etc/php/8.x/php.ini`

### 2. Update These Settings

Open `php.ini` and modify these values:

```ini
; Maximum size of POST data that PHP will accept
post_max_size = 50M

; Maximum allowed size for uploaded files
upload_max_filesize = 50M

; Maximum number of files that can be uploaded via a single request
max_file_uploads = 20

; Maximum amount of memory a script may consume
memory_limit = 256M

; Maximum execution time of each script, in seconds
max_execution_time = 300

; Maximum amount of time each script may spend parsing request data
max_input_time = 300
```

### 3. Restart Web Server

After updating `php.ini`, restart your web server:

```bash
# For Apache
sudo service apache2 restart

# For Nginx + PHP-FPM
sudo service php8.1-fpm restart
sudo service nginx restart

# For XAMPP (Windows)
# Restart Apache from XAMPP Control Panel

# For Laragon (Windows)
# Restart from Laragon interface
```

### 4. Verify Changes

Create a temporary PHP file to verify:

```php
<?php
// test-upload-limits.php
phpinfo();
// Look for: post_max_size, upload_max_filesize, memory_limit
```

Or use Laravel:
```bash
php artisan tinker
echo ini_get('post_max_size');
echo ini_get('upload_max_filesize');
echo ini_get('memory_limit');
```

### 5. Additional: Nginx Configuration (if using Nginx)

If you're using Nginx, also update `/etc/nginx/nginx.conf` or your site config:

```nginx
http {
    client_max_body_size 50M;
}
```

Then restart Nginx:
```bash
sudo service nginx restart
```

### 6. Additional: Apache Configuration (if using .htaccess)

If using Apache and unable to edit `php.ini`, add to `.htaccess`:

```apache
php_value upload_max_filesize 50M
php_value post_max_size 50M
php_value memory_limit 256M
php_value max_execution_time 300
php_value max_input_time 300
```

## Recommended Values for Production

- **Small files (< 5MB)**: `post_max_size = 10M`, `upload_max_filesize = 10M`
- **Medium files (5-20MB)**: `post_max_size = 50M`, `upload_max_filesize = 50M`
- **Large files (> 20MB)**: `post_max_size = 100M`, `upload_max_filesize = 100M`

## Current Application Limit

The application currently validates:
- **Frontend**: 10MB max per file
- **Backend**: 10240 KB (10MB) as specified in validation rules

Make sure PHP limits are **higher than** these application limits.

## Testing

After configuration:
1. Restart web server
2. Clear browser cache
3. Try uploading a file again
4. Check browser console for FormData debug output
5. Check Laravel logs: `storage/logs/laravel.log`

## Still Not Working?

Check Laravel logs for more details:
```bash
tail -f storage/logs/laravel.log
```

Enable debug mode in `.env`:
```env
APP_DEBUG=true
```

Then try the upload again and check the error message.
