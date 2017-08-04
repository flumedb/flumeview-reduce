function init () {
  return {
    cleanTs: 0,
    dirtyTs: 0,
    queue: false,
    write: false,
    value: null,
    since: -1
  }
}

// Test if now is a good time to write.
// don't write if we are already writing
// don't write if the view is not in sync with log
// don't write if we already wrote in the last minute.
// (note: this isn't stored, so doesn't effect the first write after process starts)

function maybeWrite (state, since, value, ts) {
  state.dirty = true
  state.dirtyTs = ts
  state.queue = false
  state.since = since
  state.value = value
  if(state.write)
    
  if(state.ts + 60e3 > ts)
    return state
  state.queue = true
  return state
}

//don't actually start writing immediately.
//incase writes are coming in fast...
//this will delay until they stop for 200 ms

function timeout (state, ts) {
  if(state.dirtyTs + 200 < ts && state.queue) {
    state.cleanTs = ts
    state.queue = false
    state.write = true
    state.writing = true
    state.dirty = false
  }
  return state
}

function written (state) {
  if(state.dirty)
    state.queue = true
  state.writing = false
  return state
}

function close (state, cb) {
  if(state.dirty)
    state.write = true
  return state
}


module.exports = function (state, version) {
  var int
    //write state
    var wState = init()

    var effects = {
      write: function _write () {
        wState.write = false
        state.set({seq: wState.since, version: version, value: wState.value}, function () {
          cause({type: 'written', ts: Date.now()})
        })
      },
      timer: function () {
        clearTimeout(int)
        int = setTimeout(function () {
          cause({type: 'timeout', ts: Date.now() })
        })
      }
    }

    Fun(

    function write (since, value) {
      if(!state) return //purely in memory.
      wState = maybeWrite(wState, since, value, Date.now())

      if(wState.queue) {
        wState.queue = false
        clearTimeout(int)
        int = setTimeout(_timeout)
      }
    }

  write.close = function (cb) {
    if(!wState.dirty) return cb()
    clearTimeout(int)
    wState.cb = cb
    write()
  }

  return write

}

module.exports.init = init
module.exports.maybeWrite = maybeWrite
module.exports.timeout = timeout
module.exports.written = written
module.exports.close = close
























