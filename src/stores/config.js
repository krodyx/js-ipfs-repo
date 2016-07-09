'use strict'

exports = module.exports

exports.setUp = (basePath, BlobStore, locks) => {
  const store = new BlobStore(basePath)
  const configFile = 'config'

  return {
    get (cb) {
      store.read(configFile)
        .map((config) => config.toString())
        .map(JSON.parse)
        .subscribe((config) => cb(null, config), cb)
    },

    set (config, cb) {
      locks.lock((err) => {
        if (err) {
          return cb(err)
        }

        const done = (err) => locks.unlock(() => cb(err))
        store.write(configFile, JSON.stringify(config, null, 2))
          .subscribe(null, done, done)
      })
    }
  }
}
