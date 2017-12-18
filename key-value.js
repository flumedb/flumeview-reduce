// Shorthand method to use the opts KeyValueStore if available
module.exports = function (opts) {
  return require('./inject')(require('./store/key-value')(opts))
}
