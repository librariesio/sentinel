import Promise from 'bluebird'

const nodeManifest = 'package.json'

class Repo {
  constructor(owner, repo, gh) {
    this.owner = owner
    this.repo = repo
    this.gh = gh
  }

  findOrCreateBranch(name) {
    return this.gh.get(`/repos/${this.owner}/${this.repo}/git/refs/heads/${name}`)
    .then( (ref) => ref )
    .catch( (err) => {
      if (err.statusCode === 404) return this.createBranch(name)
      throw err
    })
  }

  updateManifest(branchRef, depName, depVersion) {

    // Get latest commit
    let sha = branchRef.object.sha
    return this.gh.get(`/repos/${this.owner}/${this.repo}/git/commits/${sha}`)

    // Get current tree from latest commit
    .then( (commit) => {
      let sha = commit.tree.sha
      return this.gh.get(`/repos/${this.owner}/${this.repo}/git/trees/${sha}`)

      // Create new tree
      .then( (tree) => {

        // FIXME abstract this for other langs
        return this.gh.get(`/repos/${this.owner}/${this.repo}/contents/${nodeManifest}`)
        .then( (file) => {
          let content = new Buffer(file.content, 'base64').toString('utf8')

          // FIXME be more defensive, can be invalid
          let manifest = JSON.parse(content)

          // FIXME 
          manifest.dependencies[depName] = depVersion
          
          let newManifest = {
            path: file.path,
            mode: "100644",
            content: JSON.stringify(manifest, null, 2)
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

}

module.exports = Repo
