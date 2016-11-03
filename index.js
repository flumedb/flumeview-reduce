var Obv = require('obv')
var Drain = require('pull-stream/sinks/drain')

module.exports = function (reduce) {
  return function (log) {
    var acc, since = Obv()
    since.set(-1)
    return {
      since: since,
      methods: {get: 'async'},
      get: function (path, cb) {
        console.log("flumeview_reduce.get", path)
        cb(null, acc)
      },
      createSink: function (cb) {
        return Drain(function (data) {
          console.log('flumeview_reduce', data)
          acc = reduce(acc, data.value, data.seq)
          console.log('flumeview_reduce.acc', acc)
          since.set(data.seq)
        }, cb)
      },
      destroy: function (cb) {
        acc = null; since.set(null); cb()
      }
    }
  }
}


