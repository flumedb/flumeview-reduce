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
    var acc, since = Obv(), ts = 0
    var value = Obv(), _value, writing = false, state, int

    //if we are in sync, and have not written recently, then write the current state.

    // if the log is persisted,
    // then also save the reduce state.
    // save whenever the view gets in sync with the log,
    // as long as it hasn't beet updated in 1 minute.

    function write () {
      var _ts = Date.now()
      if(state && since.value === log.since.value && _ts > ts + 60*1000 && !writing) {
        clearTimeout(int)
        int = setTimeout(function () {
          ts = _ts; writing = true
          state.set({seq: since.value, value: _value = value.value}, function () {
            writing = false
          })
        }, 200)
      }
    }

    //depending on the function, the reduction may not change on every update.
    //but currently, we still need to rewrite the file to reflect that.
    //(or accept that we'll have to reprocess some items)
    //might be good to have a cheap way to update the seq. maybe put it in the filename,
    //so filenames monotonically increase, instead of write to `name~` and then `mv name~ name`

    if(log.filename) {
      var dir = path.dirname(log.filename)
      state = AtomicFile(path.join(dir, name+'.json'))
      state.get(function (err, data) {
        if(err || isEmpty(data)) since.set(-1)
        else {
          value.set(_value = data.value)
          since.set(data.seq)
        }
      })
    }
    else
      since.set(-1)

    return {
      since: since,
      value: value,
      methods: {get: 'async'},
      get: function (path, cb) {
        if('function' === typeof path)
          cb = path, path = null
        cb(null, value.value)
      },
      createSink: function (cb) {
        return Drain(function (data) {
          value.set(reduce(value.value, data.value, data.seq))
          since.set(data.seq)
          write()
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


















