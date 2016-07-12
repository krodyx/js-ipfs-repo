'use strict'

const Rx = require('rxjs/Rx')

exports = module.exports

exports.setUp = (basePath, BlobStore, locks) => {
  const store = new BlobStore(basePath)
  const configFile = 'config'

  return {
    get () {
      return store.read(configFile)
        .map((config) => config.toString())
        .map(JSON.parse)
    },

    set (config) {
      return locks.lock()
        .mergeMap(() => store.write(
          configFile,
          JSON.stringify(config, null, 2)
        ))
        .catch((err) => {
          return locks.unlock()
            .mergeMap(() => Rx.Observable.throw(err))
        })
        .mergeMap(() => locks.unlock())
    }
  }
}
