#!/bin/bash

mkdir faketor && cd faketor || return
npm init -y
npm install express --save

npm i body-parser compression cors dotenv pg
npm audit fix --force
npm i -D @types/body-parser @types/morgan @types/compression @types/cookie-parser @types/cors @types/express @types/pg @types/node nodemon ts-node typescript
npm install --g eslint
npm install --save-dev eslint
npm install @typescript-eslint/parser @typescript-eslint/eslint-plugin --save-dev
npm i --save-dev @types/debug
npm i -D debug

# Generate a tsconfig.json file
npx tsc --init



echo "{
  \"watch\": [\"src\"],
  \"ext\": \"ts\",
  \"exec\": \"ts-node ./index.ts\",
  \"ignore\": [\"src/**/*.spec.ts\"]
}" > nodemon.json

npx nodemon