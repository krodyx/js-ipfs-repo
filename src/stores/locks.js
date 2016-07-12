'use strict'

exports = module.exports

exports.setUp = (basePath, BlobStore) => {
  const store = new BlobStore(basePath)
  const lockFile = 'repo.lock'

  return {
    lock () {
      return store
        .exists(lockFile)
        .filter((exists) => !exists)
        .mergeMap(() => store.write(lockFile))
        .defaultIfEmpty(null)
    },

    unlock (cb) {
      return store
        .exists(lockFile)
        .filter((exists) => exists)
        .mergeMap(() => store.remove(lockFile))
        .defaultIfEmpty(null)
    }
  }
}
