/* eslint-env mocha */

'use strict'

const async = require('async')
const Store = require('../src/idb-store')
const tests = require('./repo-test')
const _ = require('lodash')
const IPFSRepo = require('../src')

const repoContext = require.context('buffer!./test-repo', true)

const idb = window.indexedDB ||
        window.mozIndexedDB ||
        window.webkitIndexedDB ||
        window.msIndexedDB

idb.deleteDatabase('ipfs')
idb.deleteDatabase('ipfs/blocks')

describe('IPFS Repo Tests on the Browser', () => {
  before(function (done) {
    const repoData = []
    repoContext.keys().forEach(function (key) {
      repoData.push({
        key: key.replace('./', ''),
        value: repoContext(key)
      })
    })

    const mainBlob = new Store('ipfs')
    const blocksBlob = new Store('ipfs/blocks')

    async.eachSeries(repoData, (file, cb) => {
      if (_.startsWith(file.key, 'datastore/')) {
        return cb()
      }

      const blocks = _.startsWith(file.key, 'blocks/')
      const blob = blocks ? blocksBlob : mainBlob

      const key = blocks ? file.key.replace(/^blocks\//, '') : file.key

      blob.write(key, file.value)
        .subscribe(null, cb, cb)
    }, done)
  })

  const repo = new IPFSRepo('ipfs', {stores: Store})
  tests(repo)
})
