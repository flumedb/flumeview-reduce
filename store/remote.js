

module.exports = function (get, LocalStore, shouldRequest) {
  //default strategy for deciding wether to stream the log
  //or to rerequest the current state depends on the size of
  //the stored state, assuming we are using flumelog-offset,
  //the difference in offsets is less than the size of the object
  //then we should stream. (if a view is quite large, this
  //may save lots of bandwidth for small updates)
  shouldRequest = function (local, remote, value) {
    if(value == null) return true
    if(local > remote) return true
    else if(remote - local < value.size) return true
    return false
  }
  return function (dir, name, codec) {
    var local = LocalStore(dir, name, codec)
    return {
      get: function (cb) {
        var localSince, remoteSince, value
        get({values: false, meta: true}, function (_, v) {
          remoteSince = v
          next()
        })
        local.get(function (_, v) {
          if(!v) return next()
          value = v
          localSince = v.since
        })

        //XXX should be read local THEN read remote
        //incase local is currently empty, etc
        function next () {
          if(remoteSince === localSince)
            local.get(cb)
          else if(shouldRequest(localSince, remoteSince, value))
            get({seqs: true, values: true}, function (err, _value) {
              //if we got an error, go with the local value
              if(err) cb(null, value)
              else if(_value == null) cb(null, value)
              else {
                local.set(_value, function (err) {
                  cb(null, _value)
                })
              }
            })
          else
            cb(null, value)
        }
      },
      set: local.set
    }
  }
}









