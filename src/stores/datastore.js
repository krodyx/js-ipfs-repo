'use strict'

const Block = require('ipfs-block')
const Rx = require('rxjs/Rx')

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

  return {
    get (key, extension) {
      extension = extension || 'data'

      if (!key) {
        return Rx.Observable.throw(new Error('Invalid key'))
      }

      const path = multihashToPath(key, extension)

      return store
        .read(path)
        .map((data) => {
          if (extension === 'data') {
            extension = 'protobuf'
          }
          return new Block(data, extension)
        })
    },

    put (block) {
      if (!block || !block.data) {
        return Rx.Observable.throw(new Error('Invalid block'))
      }

      const path = multihashToPath(block.key, block.extension)
      return store.write(path, block.data)
    },

    has (key, extension) {
      extension = extension || 'data'

      if (!key) {
        return Rx.Observable.throw(new Error('Invalid key'))
      }

      const path = multihashToPath(key, extension)
      return store.exists(path)
    },

    delete (key, extension) {
      extension = extension || 'data'

      if (!key) {
        return Rx.Observable.throw(new Error('Invalid key'))
      }

      const path = multihashToPath(key, extension)
      return store.remove(path)
    }
  }
}
