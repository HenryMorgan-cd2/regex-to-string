import { MyRegExpVisitor as Builder } from "./MyRegExpVisitor"
// parse to an AST as before.

const builder1 = new Builder(/ab|g|c/)

console.log("===========")
console.log(builder1.build())
console.log(builder1.build())
console.log(builder1.build())
console.log(builder1.build())

const builder2 = new Builder(/abc*def?/)

console.log("===========")
console.log(builder2.build())
console.log(builder2.build())
console.log(builder2.build())
console.log(builder2.build())
console.log(builder2.build())
console.log(builder2.build())

const builder3 = new Builder(/abc? . \w*/)

console.log("===========")
console.log(builder3.build())
console.log(builder3.build())
console.log(builder3.build())
console.log(builder3.build())
console.log(builder3.build())

// TODO
const builder4 = new Builder(/[abcdef][^abcdef]\d\w/)

console.log("===========")
console.log(builder4.build())
console.log(builder4.build())
console.log(builder4.build())
console.log(builder4.build())
console.log(builder4.build())
// TODO
const builder5 = new Builder(/(hello) \1/)

console.log("===========")
console.log(builder5.build())
