'use strict'

const nodeManifest = 'package.json'

// TODO Figure out a nice API for this and generic manifest handling

function updater(repo, webhook) {
  var {name, version} = webhook

  return repo.gh.get(`/repos/${repo.owner}/${repo.repo}/contents/${nodeManifest}`)
  .then( (file) => {
    let content = new Buffer(file.content, 'base64').toString('utf8')

    let manifest = JSON.parse(content)

    if (manifest.dependencies[name])
      manifest.dependencies[name] = version

    if (manifest.devDependencies[name])
      manifest.devDependencies[name] = version

    return {
      path: file.path,
      content: JSON.stringify(manifest, null, 2)
    }
  })
}

module.exports = updater
