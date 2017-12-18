var Flume = require('flumedb')
var createFlume = require('../inject')
var KeyValue = require('../store/key-value')
var FlumelogOffset = require('flumelog-offset')

var file = '/tmp/test_flumeview-reduce/initial_'+Date.now()+'/log.offset'

var keyValueStore = function (version, name) {
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
  KeyValueStore: keyValueStore
}

require('./')(
function create () {
  return Flume(FlumelogOffset(file, 1024, require('flumecodec/json')))
}, createFlume(KeyValue(1.0, opts)))
