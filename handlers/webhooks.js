import env    from '../config/environment'
import GitHub from '../lib/github'
import Repo   from '../lib/repo'

function handler(req, res, next) {
  let [owner, repoName] = req.body.repository.split('/')
  let {name, version} = req.body

  const gh = new GitHub(env.token, {cache: env.cache})
  const repo = new Repo(owner, repoName, gh)

  let branchName = `update-${name}`

  return repo.findOrCreateBranch(branchName)
  .then( (branchRef) => {
    return repo.updateManifest(branchRef, name, version)
  })
  .then( () => {
    let title = `Update ${name}`
    let body  = `Update ${name} to ${version} :shipit:`
    let base  = 'master'
    let head  = branchName

    return repo.createPullRequest(title, body, base, head)
  })
  .then( (pr) => {
    return res.send(pr)
  })
  .catch(next)

}

export default handler
