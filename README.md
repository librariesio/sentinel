# Libraries.io Sentinel

Automated dependency updated.

## Supported Languages

 - Node.js

## Getting started

The easiest option is to deploy to heroku with the deploy button below:

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

Then add the url of your app to web hooks section for your repo on https://libraries.io

<hr>

Make sure you have the right engine installed, check the `.nvmrc`

```
$> nvm use
$> npm install
$> export TOKEN=<GitHub token with access to your repos>
$> npm start
```

Deploy Sentinel wherever you want and then point your Libraries.io Webhooks to it.
