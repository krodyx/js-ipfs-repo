/* eslint-env mocha */

'use strict'

const Repo = require('../src/index')
const expect = require('chai').expect
const Block = require('ipfs-block')

module.exports = function (repo) {
  describe('IPFS Repo Tests', function () {
    it('can init repo /wo new', () => {
      var repo
      function run () {
        repo = Repo('foo', { stores: require('abstract-blob-store') })
      }
      expect(run).to.not.throw(Error)
      expect(repo).to.be.an.instanceof(Repo)
    })

    it('bad repo init 1', () => {
      function run () {
        return new Repo()
      }
      expect(run).to.throw(Error)
    })

    it('bad repo init 2', () => {
      function run () {
        return new Repo('', {})
      }
      expect(run).to.throw(Error)
    })

    it('check if Repo exists', (done) => {
      repo.exists().subscribe(
        (exists) => {
          expect(exists).to.equal(true)
          done()
        },
        done
      )
    })

    it('exposes the path', () => {
      expect(typeof repo.path).to.be.equal('string')
    })

    describe('locks', () => {
      it('lock, unlock', (done) => {
        repo.locks
          .lock()
          .mergeMap(() => repo.locks.unlock())
          .subscribe(null, done, done)
      })

      it('lock, lock', (done) => {
        repo.locks
          .lock()
          .mergeMap(() => repo.locks.lock())
          .mergeMap(() => repo.locks.lock())
          .delay(10)
          .mergeMap(() => repo.locks.unlock())
          .subscribe(null, done, done)
      })
    })

    describe('keys', () => {
      it('get PrivKey', (done) => {
        repo.keys
          .get()
          .subscribe((privKey) => {
            expect(privKey).to.be.a('string')
            done()
          }, done)
      })
    })

    describe('config', () => {
      it('get config', (done) => {
        repo.config
          .get()
          .subscribe((config) => {
            expect(config).to.be.a('object')
            done()
          }, done)
      })

      it('set config', (done) => {
        repo.config
          .set({a: 'b'})
          .mergeMap(() => repo.config.get())
          .subscribe((config) => {
            expect(config).to.deep.equal({a: 'b'})
            done()
          }, done)
      })
    })

    describe('version', () => {
      it('get version', (done) => {
        repo.version
          .get()
          .subscribe((version) => {
            expect(version).to.be.a('string')
            expect(Number(version)).to.be.a('number')
            done()
          }, done)
      })

      it('set version', (done) => {
        repo.version
          .set('9000')
          .mergeMap(() => repo.version.get())
          .subscribe((version) => {
            expect(version).to.equal('9000')
            done()
          }, done)
      })
    })

    describe('datastore', function () {
      const helloKey = '1220b94d/1220b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9.data'
      const helloIpldKey = '1220ed12/1220ed12932f3ef94c0792fbc55263968006e867e522cf9faa88274340a2671d4441.ipld'

      describe('.put', () => {
        it('simple', function (done) {
          const b = new Block('hello world')

          repo.datastore
            .put(b)
            .subscribe((meta) => {
              expect(meta.key).to.be.eql(helloKey)
              done()
            }, done)
        })

        it('multi write (locks)', (done) => {
          const b = new Block('hello world')

          repo.datastore
            .put(b)
            .merge(repo.datastore.put(b))
            .subscribe((meta) => {
              expect(meta.key).to.equal(helloKey)
            }, done, done)
        })

        it('custom extension', function (done) {
          const b = new Block('hello world 2', 'ipld')

          repo.datastore
            .put(b)
            .subscribe((meta) => {
              expect(meta.key).to.be.eql(helloIpldKey)
              done()
            }, done)
        })

        it('returns an error on invalid block', (done) => {
          repo.datastore
            .put('hello')
            .subscribe(null, (err) => {
              expect(err.message).to.be.eql('Invalid block')
              done()
            })
        })
      })

      describe('.get', () => {
        it('simple', (done) => {
          const b = new Block('hello world')

          repo.datastore
            .get(b.key)
            .subscribe((data) => {
              expect(data).to.be.eql(b)
              done()
            }, done)
        })

        it('custom extension', (done) => {
          const b = new Block('hello world 2', 'ipld')

          repo.datastore
            .get(b.key, b.extension)
            .subscribe((data) => {
              expect(data).to.be.eql(b)
              done()
            }, done)
        })

        it('returns an error on invalid block', (done) => {
          repo.datastore
            .get(null)
            .subscribe(null, (err) => {
              expect(err.message).to.be.eql('Invalid key')
              done()
            })
        })
      })

      describe('.has', () => {
        it('existing block', (done) => {
          const b = new Block('hello world')

          repo.datastore
            .has(b.key)
            .subscribe((exists) => {
              expect(exists).to.equal(true)
              done()
            }, done)
        })

        it('with extension', (done) => {
          const b = new Block('hello world')

          repo.datastore
            .has(b.key, 'data')
            .subscribe((exists) => {
              expect(exists).to.equal(true)
              done()
            }, done)
        })

        it('non existent block', (done) => {
          const b = new Block('wooot')

          repo.datastore
            .has(b.key)
            .subscribe((exists) => {
              expect(exists).to.equal(false)
              done()
            }, done)
        })
      })

      describe('.delete', () => {
        it('simple', (done) => {
          const b = new Block('hello world')

          repo.datastore
            .delete(b.key)
            .mergeMap(() => repo.datastore.has(b.key))
            .subscribe((exists) => {
              expect(exists).to.equal(false)
              done()
            }, done)
        })

        it('custom extension', (done) => {
          const b = new Block('hello world 2', 'ipld')

          repo.datastore
            .delete(b.key, b.extension)
            .mergeMap(() => repo.datastore.has(b.key, b.extension))
            .subscribe((exists) => {
              expect(exists).to.equal(false)
              done()
            }, done)
        })
      })
    })

    describe('datastore-legacy', () => {})
  })
}
