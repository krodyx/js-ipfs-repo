'use strict'

const assert = require('assert')

const stores = require('./stores')

function Repo (repoPath, options) {
  if (!(this instanceof Repo)) {
    return new Repo(repoPath, options)
  }

  assert(options, 'missing options param')
  assert(options.stores, 'missing options.stores param')

  // If options.stores is an abstract-blob-store instead of a map, use it for
  // all stores.
  if (options.stores.prototype) {
    const store = options.stores
    options.stores = {
      keys: store,
      config: store,
      datastore: store,
      logs: store,
      locks: store,
      version: store
    }
  }

  this.path = repoPath

  this.locks = stores.locks.setUp(repoPath, options.stores.locks)

  const storeNames = [
    'version',
    'config',
    'keys',
    'datastore'
  ]

  storeNames.forEach((name) => {
    const config = options.stores[name]
    this[name] = stores[name].setUp(repoPath, config, this.locks, this.config)
  })

  this.exists = () => {
    return this.version.exists()
  }
}

exports = module.exports = Repo
