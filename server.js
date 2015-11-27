'use strict'

const Express          = require('express')
const bodyParser       = require('body-parser')
const serve_static     = require('serve-static')
const compression      = require('compression')
const env              = require('./config/environment')
const WebhooksHandler  = require('./handlers/webhooks')

const app = new Express()
app.use(compression())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))
app.use(serve_static('static'))

app.post('/webhooks', WebhooksHandler)

app.use(env.errorHandler)

app.listen(env.port, () => console.log('Ready: http://localhost:'+ env.port))
