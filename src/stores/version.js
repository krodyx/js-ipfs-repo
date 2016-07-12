'use strict'

const Rx = require('rxjs/Rx')

exports = module.exports

exports.setUp = (basePath, BlobStore, locks) => {
  const store = new BlobStore(basePath)
  const versionFile = 'version'

  return {
    exists () {
      return store.exists(versionFile)
    },
    get () {
      return store.read(versionFile)
        .map((version) => version.toString('utf8'))
    },
    set (value) {
      return locks
        .lock()
        .mergeMap(() => store.write(versionFile, value))
        .catch((err) => {
          return locks.unlock()
            .mergeMap(() => Rx.Observable.throw(err))
        })
        .mergeMap(() => locks.unlock())
    }
  }
}
