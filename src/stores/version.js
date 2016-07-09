'use strict'

exports = module.exports

exports.setUp = (basePath, BlobStore, locks) => {
  const store = new BlobStore(basePath)
  const versionFile = 'version'

  return {
    exists (cb) {
      store.exists(versionFile)
        .subscribe((exists) => cb(null, exists), cb)
    },
    get (cb) {
      store.read(versionFile)
        .map((version) => version.toString('utf8'))
        .subscribe((version) => cb(null, version), cb)
    },
    set (value, cb) {
      locks.lock((err) => {
        if (err) {
          return cb(err)
        }

        store.write(versionFile, value)
          .subscribe(null, cb, () => {
            locks.unlock(cb)
          })
      })
    }
  }
}
