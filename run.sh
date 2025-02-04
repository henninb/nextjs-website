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

  echo docker
  docker build -t nextjs-website:latest .
  #docker run -d -p 3000:3000 --name nextjs-website nextjs-website:latest
  exit 0

fi

echo npx create-next-app example-nextjs
echo 'http://localhost:3000'
echo npx npm-check-updates -u
#npm install
touch .env.local
npm run prettier
npm install
npm run dev

exit 0
