# Image Service
It supports image resize and cache, there is a cron job that run every hour to remove cache folder in docker.
The cache folder locate in /tmp/yyyymmddhh , so every hour that has made a new folder in the /tmp.

# Run on Local Machine
## Install Nodejs
https://nodejs.org/en/

## Install Graphicsmagick
http://www.graphicsmagick.org/
In DockerFile I download the version of 1.3.29.

## Install Node Module:
npm install

## Nodejs Start :
node ./app.js

# Run on Docker
## Install Docker
https://www.docker.com/

## Build
docker build -t imagecache .
## Run
docker run -d -p 3000:3000 --name imagecache imagecache
## Remove
docker rm imagecache
## Stop
docker stop imagecache
## Start
docker start imagecache
## Log
docker logs imagecache
## Bash
docker exec -i -t imagecache /bin/bash

# Example:
* 1.no assign any size 

  `http://localhost:3000/url`

* 2.assign only width
  
  `http://localhost:3000/200/url`

* 3.assign width and height
  
  `http://localhost:3000/200x300/url`

* 4.assign only height
  
  `http://localhost:3000/x300/url`

# Port Setting
There is a property in the `.env `
`PORT=3010`

You also set envirement, ex:
`export PORT=3010`

# In the Front
ADD CDN servcie to accelerate your service, it's a best practice.