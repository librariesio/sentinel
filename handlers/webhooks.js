'use strict'

const env    = require('../config/environment')
const GitHub = require('libhub')
const Repo   = require('../lib/repo')

function handler(req, res, next) {
  var [owner, repoName] = req.body.repository.split('/')
  var {name, version} = req.body

  const gh = new GitHub(env.token, {cache: env.cache})
  const repo = new Repo(owner, repoName, gh)

  let branchName = `update-${name}-to-${version}`

  return repo.findOrCreateBranch(branchName)
  .then( (branchRef) => {
    return Promise.all([
      repo.updateManifest(branchRef, name, version),
      repo.fetchDefaultBranch()
    ])
  })
  .then( ([newCommit, defaultBranch]) => {

    let title = `Update ${name} to ${version}`
    let body  = `Powered by [Libraries.io](https://libraries.io) \n\n :shipit:`
    let base  = defaultBranch.name
    let head  = branchName

    return repo.createPullRequest(title, body, base, head)
  })
  .then( (pr) => {
    return res.send(pr)
  })
  .catch(next)
}

module.exports = handler
