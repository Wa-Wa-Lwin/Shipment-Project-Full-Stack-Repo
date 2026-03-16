## How to run so everyone from local server can access it 
php artisan serve --host=0.0.0.0 --port=8000


## Check nginx error log 
sudo tail -n 30 /var/log/nginx/error.log 
-n 30 => last update 30 lines 
-f => first lines 

## check available sites 
cd /etc/nginx/sites-available
xenoptics@logistics1:/etc/nginx/sites-available$ ls
default  test.conf  xen_erp_backend  xen_erp_backendes

# Set ownership to www-data (Nginx user)
sudo chown -R www-data:www-data /home/xenoptics/xen_erp_backend

# Set directory permissions
sudo find /home/xenoptics/xen_erp_backend -type d -exec chmod 755 {} \;

# Set file permissions
sudo find /home/xenoptics/xen_erp_backend -type f -exec chmod 644 {} \;


## change ownership 
sudo chown -R xenoptics:xenoptics /home/xenoptics/xen_erp_backend
sudo chown -R www-data:www-data /home/xenoptics/xen_erp_backend

## give ownership to both xenoptics and www-data 
sudo chgrp -R www-data /home/xenoptics/xen_erp_backend/storage
sudo chgrp -R www-data /home/xenoptics/xen_erp_backend/bootstrap/cache
sudo chmod -R 775 /home/xenoptics/xen_erp_backend/storage
sudo chmod -R 775 /home/xenoptics/xen_erp_backend/bootstrap/cache

## reload nginx 
## restart nginx 
sudo systemctl reload nginx
sudo systemctl restart nginx

## git push 
git push --set-upstream origin master

## create ssh key 
    ssh-keygen -t rsa -b 4096 -C "wawa@xenoptics.com"
    xenoptics@logistics1:~/xen_erp_backend$ ssh-keygen -t rsa -b 4096 -C "wawa@xenoptics.com"
    Generating public/private rsa key pair.
    Enter file in which to save the key (/home/xenoptics/.ssh/id_rsa): 
    Enter passphrase (empty for no passphrase): 
    Enter same passphrase again: 
    Your identification has been saved in /home/xenoptics/.ssh/id_rsa
    Your public key has been saved in /home/xenoptics/.ssh/id_rsa.pub
    The key fingerprint is:
    SHA256:6PFEX91aIN0lzoa/c9Ptl7gc0Gj7EAJNWd4MpGn/1SA wawa@xenoptics.com
    The key's randomart image is:
    +---[RSA 4096]----+
    |         .++..o.o|
    |        o.+ +*.+.|
    |       ..= .Eo* o|
    |       oo...o+ +.|
    |      o S..* .o..|
    |     . +  o = ..o|
    |      . .  o o+.=|
    |            +..=o|
    |             +. o|
    +----[SHA256]-----+
## Add ssh key to git-lab profile -> preference -> ssh keys 

## check ssh key with 
    xenoptics@logistics1:~/xen_erp_backend$ cat ~/.ssh/id_rsa.pub
    ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQC1TrO6GydmNSh/6VLkoQ6A8tgUXzyNNA7SEtfJcu3ip90fne9rnU8BYVj+Ew+MscqNKaT9/ocaf8IZtBhv0KKhu5IlXqONsHKSufpyiLpqCZG6Rf4ka183eiOws37gbufsmlajnX6BZPbmd5dqyMpnOPi+MSkP/l/bYUQ4+7gbEjKHRMA5jsLr0z6D9WpiSuZNsXCxYBkhU+HEkMwIl5NFMmm767A8iMXNsJQXnhlnNJh2EBamxY0j7QN67ZlazD5A0QRQZDkRJ7j4OvY+VE94RM/+vGbiqzyP4gL5q8Uo/+3CDlLYHadstqmiPzVK6rTm1WKPHz5L99r3iIYJMIKATF9JXPQwZoewMS39MfqbX+Jh+UnnovMmfAGYTnWXEoOBTzxoJ5c0AKfjiGyhHl+NWfESnC5axXG0WMzolx1Cc5mFE87Mq9nHNtHeVzEkfmt2VaZSuMjEBe5rgfRcei4Gxm9Rdvj6n3L6XDcADzLYzO5LX5RtopcXc3CfXdc6zRc3UowsNP1Hl9Uht2rMiEti1PsXImHzBd7wVt0iC/wasIyOAlOfrPtRQzcF7beTJzlvqMjFZSSEJTHwq1Nyg19mifDKp/53HvB+b70E4Mtqr32h3cuAGiEHIG3Xl6eCE0NNLwZb0ppthu2at2m4zhT3YNwPStgyQr0VcSwNs60qEw== wawa@xenoptics.com
##

## For local git folder 
1 - clone git 
2 - set up .env file 
3 - composer install 
4 - php artisan serve  

# Clear Cach if got 403 ERROR while login 
php artisan config:clear
php artisan cache:clear

# INFO  Configuration cache clear
● Bash(php artisan config:clear && php artisan route:clear && php artisan cache:clear && composer dump-autoload)

# lan not working but ip address is working
shipment.xeno.lan is not showing the updated code , with 192.168.60.31, we can see 

    -- in /home/xenoptics/xen_erp_backend/config/cors.php , add 'https://shipment.xeno.lan' to 'allowed_origins' and changing 'supports_credentials' to true 

        'allowed_origins' => [
            'http://xenlogistics',
            'http://localhost:5173',
            'https://shipment.xeno.lan',
        ],
        'supports_credentials' => true,

    -- in sudo nano /etc/nginx/sites-available/default, add CORS HEADERS and Preflight inside /api/ {}

        location /api/ {

            # CORS HEADERS
            add_header Access-Control-Allow-Origin https://shipment.xeno.lan always;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
            add_header Access-Control-Allow-Headers "Origin, Content-Type, Accept, Authorization" always;
            add_header Access-Control-Allow-Credentials true always;

            # Preflight
            if ($request_method = OPTIONS) {
                return 204;
            }

            try_files $uri $uri/ /index.php?$query_string;
        }

    -- refresh both php artisan and nginx

    sudo nginx -t
    sudo nginx -s reload

    php artisan config:clear
    php artisan cache:clear
    php artisan optimize:clear
