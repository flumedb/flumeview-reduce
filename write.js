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

function maybeWrite (state, since, value, ts) {
  state.dirty = true
  state.dirtyTs = ts
  state.queue = false
  state.since = since
  state.value = value

  if(state.ts + 60e3 > ts)
    return state
  state.queue = true
  return state
}

function timeout (state, ts) {
  if(state.dirtyTs + 200 < ts && state.queue) {
    state.cleanTs = ts
    state.queue = false
    state.write = true
    state.dirty = false
  }
  return state
}

function written (state) {
  if(state.dirty)
    state.queue = true
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
//    var wState = {
//      ts: 0, //last time written
//      writing: false, //whether currently writing
//      dirty: false,
//      since: -1, //what sequence is persisted.
//      value: null
//    }
//
    var wState = init()

    // Test if now is a good time to write.
    // don't write if we are already writing
    // don't write if the view is not in sync with log
    // don't write if we already wrote in the last minute.
    // (note: this isn't stored, so doesn't effect the first write after process starts)
    function _timeout () {
      wState = timeout(wState, Date.now())
      if(wState.write) {
        state.set({seq: wState.since, version: version, value: value}, function () {
          wState.writing = false
          //if the state has changed while writing,
          //consider another write.
          if(wState.dirty) write()
          else if(wState.cb) cb()
        })
      }
    }

    function write (since, value) {
      if(!state) return //purely in memory.
      wState = maybeWrite(wState, since, value, Date.now())

//      write.dirty = wState.dirty = true
//      wState.since = since
//      wState.value = value
//      wState.dirtyTs = Date.now()
//      var ts = Date.now()
//      if(wState.writing) return
//      if(wState.ts + 60e3 > ts) return

      if(wState.queue) {
        wState.queue = false
        clearTimeout(int)
        int = setTimeout(_timeout)
      }

      //don't actually start writing immediately.
      //incase writes are coming in fast...
      //this will delay until they stop for 200 ms
//      clearTimeout(int)
//      int = setTimeout(function () {
//        wState.clearTs = Date.now(); wState.writing = true
//        wState.since = since
//        write.dirty = wState.dirty = false
//        state.set({seq: wState.since, version: version, value: value}, function () {
//          wState.writing = false
//          //if the state has changed while writing,
//          //consider another write.
//          if(wState.dirty) write()
//          else if(wState.cb) cb()
//        })
//      }, 200)
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

