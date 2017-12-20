var Flume = require('flumedb')
var FlumelogOffset = require('flumelog-offset')
var SingleValueStore = require('../store/single-value-store')

var file = '/tmp/test_flumeview-reduce/initial_'+Date.now()+'/log.offset'

var keyValueStore = function (name, version) {
  var db = {}
  return {
    get (key, cb) {
      cb(null, db[key])
    },
    set (key, value, cb) {
      db[key] = value
      cb(null, db[key])
    }
  }
}

var opts = {
  SingleValueStore: SingleValueStore(keyValueStore)
}

require('./')(
function create () {
  return Flume(FlumelogOffset(file, 1024, require('flumecodec/json')), opts)
})
