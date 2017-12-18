var Flume = require('flumedb')
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

require('./')(
function create () {
  return Flume(FlumelogOffset(file, 1024, require('flumecodec/json')))
}, {
  KeyValueStore: keyValueStore
})
