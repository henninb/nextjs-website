#!/bin/sh

date=$(date '+%Y-%m-%d')
ENV=$1
APP=nextjs-website
# export NODE_OPTIONS=--openssl-legacy-provider
# export BROWSER=browser-start

if [ $# -ne 1 ]; then
  echo "Usage: $0 <prod|dev>"
  exit 1
fi

if [ "$ENV" = "prod" ]; then
  if ! npm run build; then
    echo "npm build failed"
    exit 1
  fi

  docker build -t nextjs-website:latest .
  kubectl delete pod nextjs-website-pod -n test-ns
  kubectl delete deployment nextjs-website-deployment -n test-ns
  kubectl apply -f nextjs-website-pod.yml
  kubectl get pods -n test-ns -o wide
  #docker run -d -p 3000:3000 --name nextjs-website nextjs-website:latest
  exit 0

fi

echo npx create-next-app example-nextjs
echo 'http://localhost:3000'
echo npx npm-check-updates -u
#npm install
touch .env.local
npm run prettier
npx npm-check-updates
npm install
netstat -tlnp | grep :3000
npm run dev

exit 0
