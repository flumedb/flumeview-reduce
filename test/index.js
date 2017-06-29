
var Log = require('flumelog-memory')
var Reduce = require('../')
var tape = require('tape')
var Flume = require('flumedb')

tape('simple', function (t) {
  var db = Flume(Log())
    .use('view', Reduce(1, function (acc, item) {
      return (acc || 0) + item
    },
    function (data) {
      return data.value
    }, null, 0))

  db.view.get(null, function (err, v) {
    if(err) throw err
    t.equal(v, 0)
    db.append([{value: 10}, {value: 20}], function (err) {
      db.view.get(function (err, value) {
        if(err) throw err
        t.equal(value, 30)
        db.view.get({seq: -1}, function (err, value) {
          if(err) throw err
          console.log(value)
          t.deepEqual(value, {seq: 1, value: 30})
          db.view.get({seq: 1, value: false}, function (err, value) {
            if(err) throw err
            console.log(value)
            t.deepEqual(value, {seq: 1})
            db.view.get({seq: 2}, function (err) {
              t.ok(err, 'expected error, for sequence in the future')
              t.end()
            })
          })
        })
      })
    })
    
  })

})




