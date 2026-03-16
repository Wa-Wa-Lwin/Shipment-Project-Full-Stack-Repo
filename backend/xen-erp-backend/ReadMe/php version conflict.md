--uninstall all php version from server - nginx 

sudo apt purge 'php*'
sudo apt autoremove
sudo apt autoclean

--Add PHP 8.3 Repository

sudo apt install software-properties-common
sudo add-apt-repository ppa:ondrej/php
sudo apt update

--Install PHP 8.3 and Required Extensions
sudo apt install php8.3 php8.3-fpm php8.3-cli php8.3-mysql php8.3-curl php8.3-mbstring php8.3-xml php8.3-zip

--if fail the following line
fastcgi_pass unix:/run/php/php8.3-fpm.sock;
--run 
sudo nano /etc/nginx/sites-available/default
--find 
        # pass PHP scripts to FastCGI server
        #
        location ~ \.php$ {
                include snippets/fastcgi-php.conf;

                # With php-fpm (or other unix sockets):
                fastcgi_pass unix:/run/php/php8.3-fpm.sock;
                # With php-cgi (or other tcp sockets):
                #fastcgi_pass 127.0.0.1:9000;
        }
--uncomment and fix necessary php version and uncomment only one fastcgi 

--confirm the following ok 
sudo nginx -t

--restart server 

sudo systemctl restart php8.3-fpm
sudo systemctl restart nginx

php -v

systemctl status php8.3-fpm

--check anything is still using other verison 
grep -R "php8.4" /etc/nginx 

xenoptics@logistics1:/var/log$ grep -R "php8.4" /etc/nginx 
/etc/nginx/sites-available/xen_erp_backend:        fastcgi_pass unix:/var/run/php/php8.4-fpm.sock; # Adjust PHP version if needed
/etc/nginx/sites-enabled/xen_erp_backend:        fastcgi_pass unix:/var/run/php/php8.4-fpm.sock; # Adjust PHP version if needed

-- go to that file and change php version 
sudo nano /etc/nginx/sites-available/xen_erp_backend
cat nano /etc/nginx/sites-available/xen_erp_backend

--reload nginx config 
sudo nginx -t

--find error logs 
/var/log/nginx/error.log 
/var/log/php8.3-fpm.log or /var/log/php8.3-fpm/error.log

