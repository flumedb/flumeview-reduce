var Obv = require('obv')
var Drain = require('pull-stream/sinks/drain')

module.exports = function (reduce) {
  return function (log, name) { //name is where this view is mounted
    var acc, since = Obv()
    since.set(-1)
    return {
      since: since,
      methods: {get: 'async'},
      get: function (path, cb) {
        cb(null, acc)
      },
      createSink: function (cb) {
        return Drain(function (data) {
          acc = reduce(acc, data.value, data.seq)
          since.set(data.seq)
        }, cb)
      },
      destroy: function (cb) {
        acc = null; since.set(null); cb()
      }
    }
  }
}





