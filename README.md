﻿# PalworldServerHelper
Palworld's server is a half baked mess which I don't personally trust to save properly. It has memory leaks, which means it can crash at any time.

This is a little script to force an autosave, autobackup, and autorestart.

This follows on from before "Setup a service to automize the management of the server" of [this](https://github.com/A1RM4X/HowTo-Palworld).

This will run the instance of Palworld Server for you, through Node.js. It works on Debian 12, untested on others.

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
sudo apt install zip # If needed
git clone https://github.com/regimensocial/PalworldServerHelper.git
cd PalworldServerHelper
```

Download ARRCON and unzip it.
```
sudo apt install zip unzip # If needed
wget https://github.com/radj307/ARRCON/releases/download/3.3.7/ARRCON-3.3.7-Linux.zip
rm ARRCON-3.3.7-Linux.zip
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

At this point, running it will work. If not, your config might need adjusting depending on how much you've deviated from A1RM4X's tutorial. Config file is explained at the end.
```
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

Don't use the panel like this, please put it behind an Apache or Nginx proxy with a TLS certificate.

Config file explained in depth

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

