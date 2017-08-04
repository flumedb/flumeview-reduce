
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


tape('write many times quickly', function (t) {

  var s = Write.init()
  t.equal(s.cleanTs, 0)
  var s = Write.maybeWrite(s, 0, {}, 50)
  var s = Write.maybeWrite(s, 1, {}, 100)
  var s = Write.maybeWrite(s, 2, {}, 150)
  var s = Write.maybeWrite(s, 3, {}, 200)

  t.equal(s.dirty, true)
  t.equal(s.dirtyTs, 200)
  t.equal(s.since, 3)
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

tape('write while writing', function (t) {
  var s = Write.init()
  t.equal(s.cleanTs, 0)
  var s = Write.maybeWrite(s, 0, {}, 100)
  t.equal(s.dirty, true)
  t.equal(s.dirtyTs, 100)
  t.equal(s.since, 0)
  t.equal(s.queue, true)
  t.equal(s.write, false)

  //timeout triggers early
  s = Write.timeout(s, 300)
  t.equal(s.write, true)
  t.equal(s.queue, false)
  t.equal(s.dirty, false)
  s = Write.maybeWrite(s, 0, {}, 400)
  t.equal(s.write, true, 'writ?')
  t.equal(s.queue, false, 'should not queue')
  t.equal(s.dirty, true)
  t.equal(s.dirtyTs, 400)

  t.end()

})






