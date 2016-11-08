var Obv = require('obv')
var Drain = require('pull-stream/sinks/drain')
var AtomicFile = require('atomic-file')
var path = require('path')
var deepEqual = require('deep-equal')

function isEmpty (o) {
  for(var k in o) return false
  return true
}

module.exports = function (reduce) {
  return function (log, name) { //name is where this view is mounted
    var acc, since = Obv()
    var value = Obv(), _value, int

    // if the log is persisted,
    // then also save the reduce state.
    // currently saving it every minute, if it's changed.
    // I don't think this is the best way
    // but it's the easiest...
    if(log.filename) {
      var dir = path.dirname(log.filename)
      var state = AtomicFile(path.join(dir, name+'.json'))
      state.get(function (err, data) {
        if(err || isEmpty(data)) since.set(-1)
        else {
          value.set(_value = data.value)
          since.set(data.seq)
        }
      })
      ;(function next() {
        int = setTimeout(function () {
          if(since.value > 0 && !deepEqual(_value, value.value))
            state.set({seq: since.value, value: _value = value.value}, function () {})
          next()
        }, 1000*60)
        int.unref()
      })()
    }
    else
      since.set(-1)

    return {
      since: since,
      value: value,
      methods: {get: 'async'},
      get: function (path, cb) {
        cb(null, value.value)
      },
      createSink: function (cb) {
        return Drain(function (data) {
          value.set(reduce(value.value, data.value, data.seq))
          since.set(data.seq)
        }, cb)
      },
      destroy: function (cb) {
        value.set(null); since.set(-1);
        if(state) state.set(null, cb)
        else cb()
      },
      close: function (cb) {
        clearTimeout(int)
        if(!since.value) return cb()
        //force a write.
        state.set({seq: since.value, value: _value = value.value}, cb)
      }
    }
  }
}





