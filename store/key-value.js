module.exports = function (version, opts) {
  if (opts && opts.KeyValueStore) {
    return function (dir, name) {
      var keyValueStore = opts.KeyValueStore(version, name)
      return {
        get: function (cb) {
          keyValueStore.get(name, cb)
        },
        set: function (value, cb) {
          keyValueStore.set(name, value, cb)
        }
      }
    }
  }

  if(false && !process.env.FV_REDUCE_LS)
    return require('./local-storage')
  else
    return require('./fs')
}
