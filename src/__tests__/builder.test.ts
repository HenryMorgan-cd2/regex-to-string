import { Builder } from "../Builder"

// because the builder produces random strings, we test every regex 1000 times.
// if all of the produced strings are match the given regex then :thumbsup:
function testRegex(regex: RegExp, times = 1000) {
  test(`Regex: ${regex.toString()}`, () => {
    const builder = new Builder(regex)
    for (let i = 0; i < times; i++) {
      const str = builder.build()

      expect(str).toMatch(regex)
    }
  })
}

testRegex.todo = regex => {
  test.todo(`Regex: ${regex.toString()}`)
}

testRegex(/a/)
testRegex(/aaaa/)
testRegex(/a+/)
testRegex(/a?/)
testRegex(/a*/)

testRegex(/a|b|c/)
testRegex(/\w/)
testRegex(/\d/)
testRegex(/.*/)

testRegex(/abc*def?/)
testRegex(/[abcdef][^abcdef]/)
testRegex(/(abc)   \1/)
testRegex(/(\w+)   \w/)
testRegex(/^hello$/)

testRegex(/\w+@\w+\.\w{1,2}(\.\w{1,2})?/)

testRegex.todo(/(?=h).i/)

test("case insensitive literals appear in both cases", () => {
  const builder = new Builder(/a/i)
  let i = 0
  while (i < 1000) {
    const str = builder.build()

    if (str === "A") {
      return
    }
    i++
  }
  fail("only lower case letters were generated")
})
