import {
  RegExpParser,
  BaseRegExpVisitor,
  Set,
  RegExpPattern,
  RegExpFlags,
  Disjunction,
  Alternative,
  Assertion,
  Character,
  Group,
  GroupBackReference,
  Quantifier,
  IRegExpAST,
} from "regexp-to-ast"

type IPossibleValues = {
  [key in keyof BaseRegExpVisitor]: BaseRegExpVisitor[key] extends (arg: infer U) => any
    ? IRegExpAST extends U
      ? never
      : U
    : never
}[keyof BaseRegExpVisitor]

// Override the visitor methods to add your logic.
export class MyRegExpVisitor extends BaseRegExpVisitor {
  static INFINITY = 20
  static MAX_CODE_POINT = 100
  // static MAX_CODE_POINT = 0x10FFFF // actual max as defined by the ecma standard

  constructor(regex: RegExp) {
    super()
    const regexpParser = new RegExpParser()

    const regExpAst = regexpParser.pattern(regex.toString())

    this.builder = this.visitPattern(regExpAst)
  }

  builder: () => string

  build() {
    return this.builder()
  }

  visitPattern(node: RegExpPattern) {
    return this.visitThing(node.value)
  }

  visitThing<T extends IRegExpAST>(thing: IPossibleValues): () => string {
    switch (thing.type) {
      case "Disjunction": {
        const funcs = thing.value.map(val => this.visitThing(val))
        return () => {
          return choose(funcs)()
        }
      }
      case "Alternative": {
        const funcs = thing.value.map(val => this.visitThing(val))
        return () => {
          let str = ""
          funcs.forEach(func => (str += func()))
          return str
        }
      }
      case "Set": {
        const inflated: number[] = thing.value
          .map(val => (typeof val === "number" ? val : createArrayBetween(val.from, val.to)))
          .reduce((acc: any, el) => (typeof el === "number" ? [...acc, el] : acc.concat(el)), [])

        const getChar = () =>
          thing.complement
            ? randomCodePointExcept(inflated, MyRegExpVisitor.MAX_CODE_POINT)
            : String.fromCodePoint(choose(inflated))
        return () => {
          if (thing.quantifier) {
            let { atLeast, atMost } = thing.quantifier
            if (atMost === Infinity) {
              atMost = MyRegExpVisitor.INFINITY
            }
            const count = rand(atLeast, atMost + 1)
            if (count === 0) {
              return ""
            } else {
              return repeat(getChar, count)
            }
          } else {
            return getChar()
          }
        }
      }
      case "Character": {
        return () => {
          const char = String.fromCodePoint(thing.value)
          if (thing.quantifier) {
            let { atLeast, atMost } = thing.quantifier

            if (atMost === Infinity) {
              atMost = MyRegExpVisitor.INFINITY
            }
            const count = rand(atLeast, atMost + 1)
            if (count === 0) {
              return ""
            } else {
              return repeat(char, count)
            }
          } else {
            return char
          }
        }
      }
      default:
        console.log(thing)
        return () => {
          return thing.type
        }
    }
  }
}

function randomCodePointExcept(exceptions: number[], maxCodePoint = 0x10ffff) {
  let attempts = 0

  while (attempts < 1000) {
    const num = rand(0, maxCodePoint + 1)
    if (!exceptions.includes(num)) {
      return String.fromCodePoint(num)
    }
    attempts++
  }

  throw new Error("Could not pick from list")
}

function createArrayBetween(from: number, to: number) {
  return Array(to - from)
    .fill(0)
    .map((_, i) => from + i)
}
function choose<T>(arr: T[]) {
  return arr[rand(0, arr.length)]
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min) + min)
}

function repeat(thing: string | (() => string), times: number) {
  if (typeof thing === "string") {
    return Array(times)
      .fill(thing)
      .join("")
  } else {
    return Array(times)
      .fill(undefined)
      .map(thing)
      .join("")
  }
}
