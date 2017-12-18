
var Log = require('flumelog-memory')
var Reduce = require('../')
var tape = require('tape')
var Flume = require('flumedb')

module.exports = function (createFlume, opts) {
  tape('simple', function (t) {
    var db = createFlume()
      .use('view', Reduce(1, function (acc, item) {
        return (acc || 0) + item
      },
      function (data) {
        return data.value
      }, null, 0, opts))

    db.view.get(function (err, v) {
      if(err) throw err
      t.equal(v, 0)
      db.append([{value: 10}, {value: 20}], function (err) {
        db.view.get(function (err, value) {
          if(err) throw err
          t.equal(value, 30)
          db.view.get({meta: true, values: true}, function (err, value) {
            if(err) throw err
            console.log(value)
            t.deepEqual(value, {seq: value.seq, value: 30, version: 1})
            db.view.get({values: false}, function (err, value) {
              if(err) throw err
              console.log(value)
              t.deepEqual(value, {seq: value.seq, version: 1, size: null})
              t.end()
            })
          })
        })
      })
    })
  })

}

if(!module.parent)
  module.exports(function () { return Flume(Log()) })
