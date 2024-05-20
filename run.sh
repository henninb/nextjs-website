#!/bin/sh

echo npx create-next-app example-nextjs
echo 'http://localhost:3000'
#npm install
touch .env.local
npm install
npm run dev

exit 0
