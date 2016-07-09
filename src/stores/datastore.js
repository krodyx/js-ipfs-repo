'use strict'

const Lock = require('lock')
const Block = require('ipfs-block')

const PREFIX_LENGTH = 8

exports = module.exports

function multihashToPath (multihash, extension) {
  extension = extension || 'data'
  const filename = `${multihash.toString('hex')}.${extension}`
  const folder = filename.slice(0, PREFIX_LENGTH)
  const path = folder + '/' + filename

  return path
}

exports.setUp = (basePath, BlobStore, locks) => {
  const store = new BlobStore(basePath + '/blocks')
  const lock = new Lock()

  return {
    get (key, extension, cb) {
      if (typeof extension === 'function') {
        cb = extension
        extension = 'data'
      }

      if (!key) {
        return cb(new Error('Invalid key'))
      }

      const path = multihashToPath(key, extension)
      lock(path, (release) => {
        const done = release(cb)
        store.read(path)
          .map((data) => {
            if (extension === 'data') {
              extension = 'protobuf'
            }
            cb(null, new Block(data, extension))
          })
          .subscribe((block) => done(null, block), done)
      })
    },

    put (block, cb) {
      if (!block || !block.data) {
        return cb(new Error('Invalid block'))
      }

      const path = multihashToPath(block.key, block.extension)
      lock(path, (release) => {
        store.write(path, block.data)
          .subscribe(
            (meta) => {
              release(cb)(null, meta)
            },
            release(cb)
          )
      })
    },

    has (key, extension, cb) {
      if (typeof extension === 'function') {
        cb = extension
        extension = undefined
      }

      if (!key) {
        return cb(new Error('Invalid key'))
      }

      const path = multihashToPath(key, extension)
      store.exists(path)
        .subscribe((exists) => cb(null, exists), cb)
    },

    delete (key, extension, cb) {
      if (typeof extension === 'function') {
        cb = extension
        extension = undefined
      }

      if (!key) {
        return cb(new Error('Invalid key'))
      }

      const path = multihashToPath(key, extension)
      store.remove(path)
        .subscribe(null, cb, cb)
    }
  }
}
