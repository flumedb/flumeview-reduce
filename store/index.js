module.exports = function (dir, name, codec, version, opts) {
  if (opts && opts.KeyValueStore) {
    var SingleKeyValueStore = require('./key-value')
    return SingleKeyValueStore(name, opts.KeyValueStore(version, name))
  }

  if(false && !process.env.FV_REDUCE_LS)
    return require('./local-storage')(dir, name, codec)
  else
    return require('./fs')(dir, name, codec)
}
