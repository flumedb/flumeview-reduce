// Creates a store that uses KeyValueStore provided in opts, if
// available otherwise falls back to default behavior
module.exports = function (KeyValueStore, version) {
  return function (dir, name, codec) {
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
