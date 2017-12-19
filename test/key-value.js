var Flume = require('flumedb')
var FlumelogOffset = require('flumelog-offset')

var file = '/tmp/test_flumeview-reduce/initial_'+Date.now()+'/log.offset'

var keyValueStore = function (name, version) {
  var db = {}
  return {
    get (key) {
      return Promise.resolve(db[key])
    },
    set (key, value) {
      db[key] = value
      return Promise.resolve(db[key])
    }
  }
}

var opts = {
  KeyValueStore: keyValueStore
}

require('./')(
function create () {
  return Flume(FlumelogOffset(file, 1024, require('flumecodec/json')))
}, opts)
