var Obv = require('obv')
var Drain = require('pull-stream/sinks/drain')
var Once = require('pull-stream/sources/once')
var AtomicFile = require('atomic-file')
var path = require('path')
var deepEqual = require('deep-equal')
var Notify = require('pull-notify')

function isEmpty (o) {
  for(var k in o) return false
  return true
}

function isFunction (f) {
  return 'function' === typeof f
}

function id (e) { return e }

module.exports = function (version, reduce, map, codec) {
  if(isFunction(version))
    throw new Error('version must be a number')

  map = map || id
  var notify = Notify()
  return function (log, name) { //name is where this view is mounted
    var acc, since = Obv(), ts = 0
    var value = Obv(), _value, writing = false, state, int

    //if we are in sync, and have not written recently, then write the current state.

    // if the log is persisted,
    // then also save the reduce state.
    // save whenever the view gets in sync with the log,
    // as long as it hasn't beet updated in 1 minute.

    var wState = {
      ts: 0,
      writing: false,
      since: -1
    }

    function write () {
      var ts = Date.now()
      if(wState.writing) return
      if(!state || since.value != log.since.value) return
      if(wState.ts + 60e3 > ts) return
      if(wState.since === since) return

      //don't actually start writing immediately.
      //incase writes are coming in fast...
      //this will delay until they stop for 200 ms
      clearTimeout(int)
      int = setTimeout(function () {
        wState.ts = ts; wState.writing = true
        wState.since = since.value
        state.set({seq: since.value, version: version, value: _value = value.value}, function () {
          wState.writing = false
          //if the state has changed while writing,
          //consider another write.
          if(wState.since != since.value) write()
        })
      }, 200)

    }

    //depending on the function, the reduction may not change on every update.
    //but currently, we still need to rewrite the file to reflect that.
    //(or accept that we'll have to reprocess some items)
    //might be good to have a cheap way to update the seq. maybe put it in the filename,
    //so filenames monotonically increase, instead of write to `name~` and then `mv name~ name`

    if(log.filename) {
      var dir = path.dirname(log.filename)
      state = AtomicFile(path.join(dir, name+'.json'), codec)
      state.get(function (err, data) {
        if(err || isEmpty(data)) since.set(-1)
        else if(data.version !== version) {
          since.set(-1) //overwrite old data.
        }
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
      methods: {get: 'async', stream: 'source'},
      get: function (path, cb) {
        if('function' === typeof path)
          cb = path, path = null
        cb(null, value.value)
      },
      stream: function (opts) {
        opts = opts || {}
        //todo: send the HASH of the value, and only resend it if it is different!
        if(opts.live !== true)
          return Once(value.value)
        var source = notify.listen()
        //start by sending the current value...
        source.push(value.value)
        return source
      },
      createSink: function (cb) {
        return Drain(function (data) {
            var _data = map(data.value, data.seq)
            if(_data != null) value.set(reduce(value.value, _data, data.seq))
            since.set(data.seq)
            notify(_data)
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
        if(!since.value || !state) return cb()
        //if we are already in sync, close immediately.
        if(wState.since == since.value) return cb()
        //force a write.
        state.set({seq: since.value, version: version, value: _value = value.value}, cb)
      }
    }
  }
}
