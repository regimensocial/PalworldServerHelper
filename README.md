# PalworldServerHelper
Palworld's server is a half baked mess which I don't personally trust to save properly. It has memory leaks, which means it can crash at any time.

This is a little script to force an autosave, autobackup, and autorestart.

This follows on from before "Setup a service to automize the management of the server" of [this](https://github.com/A1RM4X/HowTo-Palworld). Thank you to A1RM4X for the original guide.

This will run the instance of Palworld Server for you, through Node.js. It works on Debian 12, untested on others.

## Guide

Change `RCONEnabled=False` to `RCONEnabled=True` in your config, and set an admin password if not already. Make sure to remember this!
```
nano ~/.steam/steam/steamapps/common/PalServer/Pal/Saved/Config/LinuxServer/PalWorldSettings.ini # Change these here
```

Installing Node.js (ignore if you've already got it)
```
sudo apt update # If needed
sudo apt install nodejs npm # If needed
```

Going to the home directory.
```
cd /home/steam # Or wherever you'd like
```

Clone this repo.
```
sudo apt install git # If needed
git clone https://github.com/regimensocial/PalworldServerHelper.git
cd PalworldServerHelper
```

Download ARRCON, unzip it, and make it executable.
```
sudo apt install zip unzip # If needed
wget https://github.com/radj307/ARRCON/releases/download/3.3.7/ARRCON-3.3.7-Linux.zip
rm ARRCON-3.3.7-Linux.zip
chmod +x ARRCON
```

Download all the NPM packages needed.
```
npm i
```

Edit the config to be how you'd like it, mainly just change the passwords.
```
nano config.json
```

```
    "adminPassword": "password", # This should be the same as in your PalWorldSettings.ini
    "serverPassword": "password", # You can choose to make this the same, or different. It will be used to access the web panel
```

At this point, running it will work. If not, your config might need adjusting depending on how much you've deviated from A1RM4X's tutorial. Config file is explained at the end. Additionally, if you've done some steps with root, you might have issues with permissions. If you're using Debian and following this tutorial, you probably know how to sort those out (`chown -R steam:steam /home/steam/PalworldServerHelper`).
```
sudo -u steam bash # Make sure you're on the right user
node index.js # Run it like so for now
```

You'll know it's sort of working when 
```
[2024-01-27T01:42:43.570Z] Server is likely ready (or will be in a moment)!
```
appears.

Now go to a web browser, and go to `http://[SERVER HOSTING IT]:8081/`, and enter your server password.

Click `Save Server`, and check the console to make sure it saves right. It should look like this:

```
[2024-01-27T01:42:43.570Z] Server is likely ready (or will be in a moment)!
[2024-01-27T01:43:42.655Z] RCON@127.0.0.1> broadcast Saving...
Broadcasted: Saving...

[2024-01-27T01:43:42.759Z] RCON@127.0.0.1> save
Complete Save

[2024-01-27T01:43:42.801Z] RCON@127.0.0.1> broadcast Saved!
Broadcasted: Saved!
```

**Don't use the panel like this, please put it behind an Apache or Nginx proxy with a TLS certificate. Additionally, you should likely be using UFW or another tool already!**

## Config file explained

```
{
    "arrconLocation": "./ARRCON", # This should point to ARRCON to allow us to communicate with the server
    "serverLocation": "/home/steam/.steam/steam/steamapps/common/PalServer/Pal/Binaries/Linux/PalServer-Linux-Test", # This should be the actual binary executable of the server
    "serverArguments": "-useperfthreads -NoAsyncLoadingThread -UseMultithreadForDS", # These are some arguments provided in the original tutorial
    "port": 8081, # This is the port the web server will listen to, you should probably change it and hide it with a firewall, and then use a web proxy.
    "rconPort": 25575, # RCON port of your server.
    "adminPassword": "password", # The Admin Password of your server, as set in PalWorldSettings.ini
    "serverPassword": "password", # The password you want to use to access the web panel.
    "maxMemoryUsageInBytesBeforeRestart": 14000000000, # How much memory should your server use at maximum before saving and restarting? This is 14GB, as my server only has 16GB of RAM.
    "saveEveryXMinutes": 15, # How often should we autosave? Every 15 minutes
    "restartEveryXHours": 6, # How often should we restart? Every 6 hours
    "backupEveryXHours": 12, # How often should a backup occur? Every 12 hours, set to 0 to disable backups
    "backupWhatLocation": "/home/steam/.steam/steam/steamapps/common/PalServer/Pal/Saved", # What should we actually backup?
    "backupsLocation": "./backups", # Where should we put the backups?
    "maxBackupsBeforeDeletingOld": 4 # How many backups should we store before deleting old ones?
}
```

## Apache Web Proxy Guide
This is probably not needed for this README, but I might as well put it.

This will let you use HTTPS with the web panel, as long as you own a domain for it.

```
sudo apt update
sudo apt install apache2 snapd

sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
sudo certbot certonly --apache # Follow this through with your domain

sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod ssl
```

```
nano /etc/apache2/sites-available/palworld-server-helper.conf
```

Put this in it, changing whats needed.

```
<IfModule mod_ssl.c>
<VirtualHost *:443>

        ServerAdmin webmaster@localhost

        ProxyRequests Off
        # Make sure the port matches your configuration
        ProxyPass / http://localhost:8081/ 
        ProxyPassReverse / http://localhost:8081/ 

        ErrorLog ${APACHE_LOG_DIR}/error.log
        CustomLog ${APACHE_LOG_DIR}/access.log combined

        ServerName [YOUR DOMAIN]
        # Make sure the domain matches your configuration
        SSLCertificateFile /etc/letsencrypt/live/[YOUR DOMAIN]/fullchain.pem 
        SSLCertificateKeyFile /etc/letsencrypt/live/[YOUR DOMAIN]/privkey.pem
        Include /etc/letsencrypt/options-ssl-apache.conf
</VirtualHost>
</IfModule>
```

```
cd /etc/apache2/sites-available
a2ensite palworld-server-helper.conf
service apache2 restart
```

It should be working now when you go to your domain, securely.

All that is left is making the Node script run as a service.

```
nano /etc/systemd/system/palworld.service # You'll use this instead of what A1RM4X provides
```

Then put this in it... Your `node` location could be different, check using `which node`.
```
[Unit]
Description=Palworld Server
Wants=network-online.target
After=network-online.target

[Service]
User=steam
Group=steam
ExecStart=/usr/bin/node /home/steam/PalworldServerHelper/index.js
WorkingDirectory=/home/steam/PalworldServerHelper
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Then run it using
```
systemctl enable palworld.service
systemctl daemon-reload
systemctl start palworld.service
```
