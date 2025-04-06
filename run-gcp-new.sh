#!/bin/sh

# Optionally start the ssh-agent if needed
# eval "$(ssh-agent -s)"
echo "Adding ssh key"
ssh-add ~/.ssh/id_rsa_gcp

# Exit if the token file does not exist or is empty
if [ ! -s token ]; then
    echo "Error: Cloudflare tunnel Token file is missing or empty."
    exit 1
fi

echo "Cloudflare tunnel token exists"

CLOUDFLARE_TOKEN=$(cat token)
docker context create remote-webserver --docker "host=ssh://brianhenning@34.170.214.18"
export DOCKER_HOST=ssh://brianhenning@34.170.214.18
# Note: The next line will override the above DOCKER_HOST.
# Uncomment only if you intend to use this host.
# export DOCKER_HOST=ssh://gcp

# Check Docker connection
if ! docker info > /dev/null 2>&1; then
    echo "Error: Unable to connect to Docker."
    exit 1
fi

echo "Docker connection is successful."

# Install dependencies and build before pruning devDependencies.
npm install
npm run build
npm prune --production

docker system prune -af
docker build -t react-app .

# docker save react-app | docker --context remote-webserver load

docker rm -f react-app
docker run --name=react-app -h react-app --restart unless-stopped -p 3001:3000 -d react-app

docker rm -f cloudflared
docker run -d --name cloudflared --restart=unless-stopped cloudflare/cloudflared:latest tunnel --no-autoupdate run --token ${CLOUDFLARE_TOKEN}
docker system prune -af
docker ps -a
echo "gcloud compute firewall-rules create allow-react-app-rule --allow tcp:3001"
echo "gcloud compute ssh --zone 'us-central1-b' 'www-bhenning-com' --project 'sa-brian-henning'"
curl 'http://34.170.214.18/'

exit 0
