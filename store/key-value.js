module.exports = function (name, keyValueStore) {
  var self
  return self = {
    get: function (cb) {
      keyValueStore.get(name, cb)
    },
    set: function (value, cb) {
      keyValueStore.set(name, value, cb)
    }
  }
}
