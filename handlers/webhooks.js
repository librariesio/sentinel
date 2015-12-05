'use strict'

const env    = require('../config/environment')
const GitHub = require('libhub')
const Repo   = require('../lib/repo')

function handler(req, res, next) {
  var [owner, repoName] = req.body.repository.split('/')
  var {name, version} = req.body

  let branchName = `update-${name}-to-${version}`

  const gh = new GitHub(env.token, {cache: env.cache})
  const repo = new Repo(owner, repoName, gh)

  return repo.checkIfUserIsCollaborator()
  .then( (isCollaborator) => {
    return isCollaborator ? repo : repo.fork()
  })
  .then( (repoOrFork) => {
    return repoOrFork.findOrCreateBranch(branchName)
    .then( (branchRef) => repoOrFork.updateBranch(branchRef, req.body) )
    .then( () => repo.fetchDefaultBranch() )
    .then( (defaultBranch) => {

      let title = `Update ${name} to ${version}`
      let body  = `Powered by [Libraries.io](https://libraries.io) \n\n :shipit:`
      let base  = defaultBranch.name
      let head  = repoOrFork.owner !== owner ? `${repoOrFork.owner}:${branchName}` : branchName

      return repo.createPullRequest(title, body, base, head)
    })
  })
  .then( (pr) => res.send(pr) )
  .catch(next)
}

module.exports = handler
