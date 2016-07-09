'use strict'

const Rx = require('rxjs/Rx')
const fs = require('fs')
const path = require('path')

const bindNodeCallback = Rx.Observable.bindNodeCallback
const readFile = bindNodeCallback(fs.readFile)
const writeFile = bindNodeCallback(fs.writeFile)
const unlink = bindNodeCallback(fs.unlink)
const exists = bindNodeCallback(require('exists-file'))
const mkdirp = bindNodeCallback(require('mkdirp'))

function join (root, dir) {
  return path.join(
    root,
    path.resolve('/', dir).replace(/^[a-zA-Z]:/, '')
  )
}

module.exports = class FsRxStore {
  constructor (opts) {
    if (typeof opts === 'string') {
      opts = { path: opts }
    }

    this.path = opts.path
  }

  read (key) {
    return readFile(join(this.path, key))
  }

  write (key, data) {
    const file = join(this.path, key)
    const folder = file.split('/').slice(0, -1).join('/')

    return mkdirp(folder)
      .mergeMap(() => writeFile(file, data))
      .map(() => ({key}))
  }

  exists (key) {
    return exists(join(this.path, key))
  }

  remove (key) {
    return unlink(join(this.path, key))
      .catch((err) => {
        if (err.code === 'EONENT') {
          return Rx.Observable.empty()
        }
        return Rx.Observable.throw(err)
      })
  }
}
