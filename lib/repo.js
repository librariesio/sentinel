'use strict'

const Promise = require('bluebird')
const manifestUpdater = require('./manifest-updater')

class Repo {
  constructor(owner, repo, gh) {
    this.owner = owner
    this.repo = repo
    this.gh = gh
  }

  findOrCreateBranch(name) {
    return this.gh.get(`/repos/${this.owner}/${this.repo}/git/refs/heads/${name}`)
    .catch( (err) => {
      if (err.statusCode === 404) return this.createBranch(name)
      throw err
    })
  }

  updateBranch(branchRef, webhook) {


    // Get latest commit
    let sha = branchRef.object.sha
    return this.gh.get(`/repos/${this.owner}/${this.repo}/git/commits/${sha}`)

    // Get current tree from latest commit
    .then( (commit) => {
      let sha = commit.tree.sha
      return this.gh.get(`/repos/${this.owner}/${this.repo}/git/trees/${sha}`)

      // Create new tree
      .then( (tree) => {

        return manifestUpdater(this, webhook)
        .then( (updatedManifest) => {

          let newManifest = {
            path: updatedManifest.path,
            mode: "100644",
            content: updatedManifest.content
          }

          let newTree = {
            base_tree: tree.sha,
            tree: [newManifest]
          }

          return this.gh.post(`/repos/${this.owner}/${this.repo}/git/trees`, {}, newTree)

        })

      })

      // Commit to the new tree
      .then( (newTree) => {
        let newCommit = {
          message: 'Bump',
          author: {
            name: 'Mauro Pompilio',
            email: 'hackers.are.rockstars@gmail.com',
            date: new Date().toISOString().replace(/\.\d+/,'') // without ms
          },
          parents: [commit.sha],
          tree: newTree.sha
        }

        return this.gh.post(`/repos/${this.owner}/${this.repo}/git/commits`, {}, newCommit)
      })

      // Update new branch
      .then( (newCommit) => {
        let newRef = {
          sha: newCommit.sha
        }
        return this.gh.patch(`/repos/${this.owner}/${this.repo}/git/${branchRef.ref}`, {}, newRef)
      })
    })
  }

  createPullRequest(title, body, base, head) {
    let pr = {
      title:  title,
      body:   body,
      base:   base,
      head:   head
    }

    return this.gh.post(`/repos/${this.owner}/${this.repo}/pulls`, {}, pr)
  }

  createBranch(name) {
    return this.fetchDefaultBranch()
    .then( (branch) => {
      let newRef = {
        ref: `refs/heads/${name}`,
        sha: branch.commit.sha
      }
      return this.gh.post(`/repos/${this.owner}/${this.repo}/git/refs`, {}, newRef)
    })
  }

  fetchDefaultBranch() {
    return this.gh.get(`/repos/${this.owner}/${this.repo}`)
    .then( (repo) => {
      var branch = repo.default_branch
      return this.gh.get(`/repos/${this.owner}/${this.repo}/branches/${branch}`)
    })
  }

  fetchBlobs(manifests) {
    var fetchFiles = manifests.map( (m) => {
      return this.gh.get(`/repos/${this.owner}/${this.repo}/git/blobs/${m.sha}`)
    })
    
    return Promise.all(fetchFiles)
    .then( (blobs) => {
      blobs.forEach( (blob,i) => {
        manifests[i].blob = blob
      })

      return manifests
    })
  }

  checkIfUserIsCollaborator() {
    return this.gh.get(`/user`)
    .then( (user) => {
      return this.gh.get(`/repos/${this.owner}/${this.repo}/collaborators/${user.login}`)
    })
    .then( () => true )
    .catch( () => false )
  }

  fork() {
    return this.gh.post(`/repos/${this.owner}/${this.repo}/forks`)
    .then( (fork) => {
      var [owner, repo] = fork.full_name.split('/')
      let newRepo = new Repo(owner, repo, this.gh)

      return new Promise( (resolve, reject) => {
        function check() {
          newRepo.fetchDefaultBranch()
          .then( () => resolve(newRepo) )
          .catch( () => setTimeout(check, 150) )
        }
        check()

        function oops() { reject(new Error('Fork failed')) }
        setTimeout(oops, 1000 * 5)
      })
    })
  }

}

module.exports = Repo
