'use strict'

const Promise = require('bluebird')
const memjs   = require('memjs')

const envName = process.env.NODE_ENV || 'development'
const port    = process.env.PORT || 5000
const token   = process.env.TOKEN

// Express error handler

function errorHandler(err, req, res, next) {
  res.status(500)
  if (envName === 'development') {
    console.log('Err:', err)
    res.send({error: err, stack: err.stack})
  } else {
    res.send({error: 'Something went wrong :('})
  }
}

// Cache

const servers =  process.env.MEMCACHEDCLOUD_SERVERS || '127.0.0.1:11211'
const user    = process.env.MEMCACHEDCLOUD_USERNAME
const pass    = process.env.MEMCACHEDCLOUD_PASSWORD

const client = memjs.Client.create(servers, {username: user, password: pass})

let get = Promise.promisify(client.get, {context: client})
let set = Promise.promisify(client.set, {context: client})

// Env

var env = {
  development:  envName === 'development',
  production:   envName === 'production',
  test:         envName === 'test',
  port:         port,
  token:        token,
  errorHandler: errorHandler,
  cache:        {set: set, get: get}
}

module.exports = env;
