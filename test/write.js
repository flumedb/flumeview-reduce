
var Write = require('../write')
var tape = require('tape')

tape('if already written in the last minute, do not write, but do mark dirty', function (t) {

  var s = Write.init()
  s.clearTs = 1000
  var s = Write.maybeWrite(s, 0, {}, 60e3+2000)
  console.log(s)
  t.equal(s.dirty, true)
  t.equal(s.dirtyTs, 60e3+2000)
  t.equal(s.since, 0)
  t.end()
})

tape('ts starts off 0, then write', function (t) {

  var s = Write.init()
  t.equal(s.cleanTs, 0)
  var s = Write.maybeWrite(s, 0, {}, 30e3)
  console.log(s)
  t.equal(s.dirty, true)
  t.equal(s.dirtyTs, 30e3)
  t.equal(s.since, 0)
  t.equal(s.queue, true)
  //timeout triggers early
  s = Write.timeout(s, 30e3+201)
  t.equal(s.write, true)
  t.end()
})

tape('write before queue timeout', function (t) {

  var s = Write.init()
  t.equal(s.cleanTs, 0)
  var s = Write.maybeWrite(s, 0, {}, 30e3)
  console.log(s)
  t.equal(s.dirty, true)
  t.equal(s.dirtyTs, 30e3)
  t.equal(s.since, 0)
  t.equal(s.queue, true)
  t.equal(s.write, false)

  var s = Write.maybeWrite(s, 0, {}, 30e3+100)
  //dirty time is updated, so next write time is pulled forward.
  t.equal(s.dirty, true)
  t.equal(s.dirtyTs, 30e3+100)
  t.equal(s.since, 0)
  t.equal(s.queue, true)
  t.equal(s.write, false)

  //timeout triggers early
  s = Write.timeout(s, 30e3+201)
  t.equal(s.write, false)
  s = Write.timeout(s, 30e3+301)
  t.equal(s.write, true)
  t.end()
})


