--error 
    Internal Server Error
    Copy as Markdown

    Illuminate\Database\QueryException
    could not find driver (Connection: sqlsrv, SQL: select top 1 * from [sessions] where [id] = AZY4GaRTJLpq5uW8EzxXzfxeFrpb1zls1lgpdbXn)
-- 
sudo apt-get update
sudo apt-get install php8.3 php8.3-dev php8.3-cli php8.3-common php8.3-fpm unixodbc-dev gcc g++ make autoconf libc-dev pkg-config -y


sudo apt-get install unixodbc-dev gcc g++ make autoconf libc-dev pkg-config
sudo pecl install pdo_sqlsrv
sudo pecl install sqlsrv

--

/usr/bin/phpize8.3
./configure --with-php-config=/usr/bin/php-config8.3
make
sudo make install

-- 

-- adding sqlsrv to php.ini 
    -- go to php.ini 
    sudo nano /etc/php/8.3/cli/php.ini
    -- add the following at the bottom of php.ini file 
    extension=sqlsrv.so
    extension=pdo_sqlsrv.so
    -- run the line to check if sqlsrv already in the system 
    php -m | grep sqlsrv
    php -m | grep pdo_sqlsrv
-- 

sudo apt-get install unixodbc-dev
sudo pecl install sqlsrv
sudo pecl install pdo_sqlsrv

sudo systemctl restart php8.3-fpm
sudo systemctl restart nginx

php -m | grep sqlsrv

# 1. Edit both ini files and remove direct extension lines (if present)
sudo nano /etc/php/8.3/cli/php.ini
sudo nano /etc/php/8.3/fpm/php.ini
# (Remove or comment out any lines like: extension=sqlsrv.so and extension=pdo_sqlsrv.so)

# 2. Restart PHP and web server
sudo systemctl restart php8.3-fpm
sudo systemctl restart nginx
## go to line with -> ctrl + _ 

# 3. Verify extension loading
php -m | grep sqlsrv
php -m | grep pdo_sqlsrv
php -v