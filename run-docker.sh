#!/bin/sh

TOKEN=$(cat token)
docker context create remote-webserver-ssh --docker "host=ssh://henninb@192.168.10.15"
docker context create remote-webserver-tcp --docker "host=tcp://192.168.10.15:2375"
#npm install
mkdir -p ssl
npm run build
docker build -t nextjs-website .

# export DOCKER_HOST=tcp://192.168.10.15:2375
docker rm -f nextjs-website
docker run --name=nextjs-website -h nextjs-website --restart unless-stopped -p 3000:3000 -d nextjs-website
docker ps -a

# docker rm -f cloudflared
# docker run -d --name cloudflared --restart=unless-stopped cloudflare/cloudflared:latest tunnel --no-autoupdate run --token ${TOKEN}

# docker save -o nextjs-website.tar nextjs-website
# scp nextjs-website.tar 192.168.10.15:/home/henninb/nextjs-website.tar
# echo docker load -i nextjs-website.tar

exit 0
