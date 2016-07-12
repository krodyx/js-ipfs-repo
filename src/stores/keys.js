'use strict'

exports = module.exports

exports.setUp = (basePath, blobStore, locks, config) => {
  return {
    get () {
      return config
        .get()
        .pluck('Identity', 'PrivKey')
    }
  }
}
