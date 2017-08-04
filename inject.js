var Obv = require('obv')
var Drain = require('pull-stream/sinks/drain')
var Once = require('pull-stream/sources/once')
var path = require('path')
var deepEqual = require('deep-equal')
var Notify = require('pull-notify')

/*
Replication Ideas.

//value is skipped if seq is the same. or value option is false, or max > 
getState({seq, value}, cb(null, {seq: _seq, value: value}))

*/

function isEmpty (o) {
  if(o == null) return
  for(var k in o) return false
  return true
}

function isObject (o) {
  return o && 'object' === typeof o
}

function isFunction (f) {
  return 'function' === typeof f
}

function id (e) { return e }

module.exports = function (Store) {
return function (version, reduce, map, codec, initial) {
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


    //write state. 
    var wState = {
      ts: 0, //last time written
      writing: false, //whether currently writing
      since: -1 //what sequence is persisted.
    }

    // Test if now is a good time to write.
    // don't write if we are already writing
    // don't write if the view is not in sync with log
    // don't write if we already wrote in the last minute.
    // (note: this isn't stored, so doesn't effect the first write after process starts)
    // and don't write if the view is already in sync
    function write () {
      if(!state) return //purely in memory.

      var ts = Date.now()
      if(wState.writing) return
      if(wState.ts + 60e3 > ts) return
      if(wState.since === since.value) return

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
      state = Store(dir, name, codec)
      state.get(function (err, data) {
        if(err || isEmpty(data) || data.version !== version) {
          since.set(-1) //overwrite old data.
          value.set(initial)
        }
        else {
          value.set(_value = data.value)
          since.set(data.seq)
        }
      })
    }
    else {
      since.set(-1)
      value.set(initial)
    }

    return {
      since: since,
      value: value,
      methods: {get: 'async', stream: 'source', value: 'sync'},
      get: function (opts, cb) {
        if('function' === typeof opts) {
          cb = opts, opts = null
        }
        if(!opts || isEmpty(opts))
          cb(null, value.value)
        else if(isObject(opts)) {
          since.once(function (v) {
            //ways to call:
            //check seq => seq, version, size
            //get seq,value => seq, version, value
            cb(null,
              opts.values === false ? {seq: v, version: version, size: state && state.size || null}
            : opts.meta === false ? value.value
            : {seq: v, version: version, value: value.value}
            )
          })
        }
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
            //if we are now in sync with the log, maybe write.
            if(since.value == log.since.value)
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
}}













