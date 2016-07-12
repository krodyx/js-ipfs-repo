'use strict'

const Rx = require('rxjs/Rx')
const db = require('db.js')
const isUndefined = require('lodash.isundefined')
const toBuffer = require('typedarray-to-buffer')

const fromPromise = Rx.Observable.fromPromise

function dbError (err) {
  if ((err instanceof Error)) {
    return Rx.Observable.throw(err)
  }

  if (err.srcElement && err.srcElement.webkitErrorMessage) {
    return Rx.Observable.throw(new Error(err.srcElement.webkitErrorMessage))
  }

  return Rx.Observable.throw(
    err.srcElement.error
  )
}

module.exports = class IdbRxStore {
  constructor (opts) {
    if (typeof opts === 'string') {
      opts = { path: opts }
    }

    if (!opts) {
      opts = {}
    }

    if (isUndefined(opts.path)) {
      opts.path = 'idb-rx-store'
    }

    this.path = opts.path

    const schema = {
      [this.path]: {}
    }

    this._store = fromPromise(db.open({
      server: this.path,
      version: 1,
      schema: schema
    }))
      .map((server) => server[this.path])
  }

  write (key, data) {
    if (isUndefined(key)) {
      return Rx.Observable.throw(new Error('Missing key'))
    }

    if (typeof data === 'string') {
      data = Buffer(data)
    }

    return this.exists(key)
      .filter((exists) => exists)
      .mergeMap(() => this.remove(key))
      .defaultIfEmpty(null)
      .mergeMap(() => {
        return this._store
          .mergeMap((server) => {
            return fromPromise(server.add({
              key,
              item: data
            }))
          })
      })
      .catch(dbError)
      .retryWhen((errors) => {
        // We could be in a race condition where multiple
        // writes happen at once, so we want to retry if
        // the error is Key already exists
        return errors.map((error) => {
          if (error.message.indexOf('Key already exists') > -1) {
            return error
          }

          throw error
        })
      })
      .map(() => ({key}))
  }

  read (key) {
    if (isUndefined(key)) {
      return Rx.Observable.throw(new Error('Missing key'))
    }

    return this._store
      .mergeMap((server) => fromPromise(server.get(key)))
      .catch(dbError)
      .map((result) => {
        if (!result) {
          throw new Error('key not found: ' + key)
        }

        return toBuffer(result)
      })
  }

  exists (key) {
    if (isUndefined(key)) {
      return Rx.Observable.throw(new Error('Missing key'))
    }

    return this._store
      .mergeMap((server) => fromPromise(server.get(key)))
      .catch(dbError)
      .map(Boolean)
  }

  remove (key) {
    if (isUndefined(key)) {
      return Rx.Observable.throw(new Error('Missing key'))
    }

    return this._store
      .mergeMap((server) => fromPromise(server.remove(key)))
      .catch(dbError)
  }
}
