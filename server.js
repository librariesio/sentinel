import Express          from 'express'
import bodyParser       from 'body-parser'
import serve_static     from 'serve-static'
import compression      from 'compression'
import env              from './config/environment'
import WebhooksHandler  from './handlers/webhooks'

const app = new Express()
app.use(compression())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))
app.use(serve_static('static'))

app.post('/webhooks', WebhooksHandler)

app.use(env.errorHandler)

app.listen(env.port, () => console.log('Ready: http://localhost:'+ env.port))
