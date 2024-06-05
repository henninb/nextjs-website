#!/bin/sh


# eval "$(ssh-agent -s)"
echo ssh add ~/.ssh/google_compute_engine

TOKEN=$(cat token)
docker context create remote-webserver --docker "host=ssh://brianhenning@35.226.225.26"
export DOCKER_HOST=ssh://brianhenning@35.226.225.26

npm install
npm run build
docker build -t react-app .
docker save react-app | docker --context remote-webserver load

docker rm -f react-app
docker run --name=react-app -h react-app --restart unless-stopped -p 3001:3000 -d react-app

docker rm -f cloudflared
docker run -d --name cloudflared --restart=unless-stopped cloudflare/cloudflared:latest tunnel --no-autoupdate run --token ${TOKEN}
docker ps -a

echo gcloud compute firewall-rules create allow-react-app-rule --allow tcp:3001
echo gcloud compute ssh --zone "us-central1-b" "owasp-juice-shop-app" --project "sa-brian-henning"

exit 0
