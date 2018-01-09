// Creates a store that uses KeyValueStore to store a single value
module.exports = function (KeyValueStore) {
  return function (opts) {
    var version = opts.version
    var name = opts.name

    var keyValueStore = KeyValueStore(name, version)
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
