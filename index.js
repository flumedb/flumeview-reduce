var Obv = require('obv')
var Drain = require('pull-stream/sinks/drain')
var AtomicFile = require('atomic-file')
var path = require('path')
var deepEqual = require('deep-equal')

module.exports = function (reduce) {
  return function (log, name) { //name is where this view is mounted
    var acc, since = Obv()
    var value = Obv(), _value

    // if the log is persisted,
    // then also save the reduce state.
    // currently saving it every minute, if it's changed.
    // I don't think this is the best way
    // but it's the easiest...
    if(log.dir) {
      var state = AtomicFile(path.join(log.dir, name+'.json'))
      state.get(function (err, data) {
        if(err) since.set(-1)
        else {
          value.set(_value = data.value)
          since.set(data.seq)
        }
      })
      ;(function next() {
        setTimeout(function () {
          if(since.value > 0 && !deepEqual(_value, value.value))
            state.set({seq: since.value, value: _value = value.value}, function () {})
          next()
        }, 1000*60).unref()
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
      }
    }
  }
}

