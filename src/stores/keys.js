'use strict'

exports = module.exports

exports.setUp = (basePath, blobStore, locks, config) => {
  return {
    get (cb) {
      config.get((err, config) => {
        if (err) {
          return cb(err)
        }
        cb(null, config.Identity.PrivKey)
      })
    }
  }
}
