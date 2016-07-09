'use strict'

const Rx = require('rxjs/Rx')

exports = module.exports

exports.setUp = (basePath, BlobStore) => {
  const store = new BlobStore(basePath)
  const lockFile = 'repo.lock'

  return {
    lock (cb) {
      store.exists(lockFile)
        .mergeMap((exists) => {
          if (exists) return Rx.Observable.empty()

          return store.write(lockFile)
        })
        .subscribe(null, cb, cb)
    },

    unlock (cb) {
      store.exists(lockFile)
        .mergeMap((exists) => {
          if (!exists) return Rx.Observable.empty()

          return store.remove(lockFile)
        })
        .subscribe(null, cb, cb)
    }
  }
}
