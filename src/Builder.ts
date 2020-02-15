import { RegExpParser, BaseRegExpVisitor, RegExpPattern, IRegExpAST } from "regexp-to-ast"

type IPossibleValues = {
  [key in keyof BaseRegExpVisitor]: BaseRegExpVisitor[key] extends (arg: infer U) => any
    ? IRegExpAST extends U
      ? never
      : U
    : never
}[keyof BaseRegExpVisitor]

interface IBuildContext {
  groups: Record<string, string>
}

// Override the visitor methods to add your logic.
export class Builder {
  static INFINITY = 20
  static MAX_CODE_POINT = 100
  // static MAX_CODE_POINT = 0x10FFFF // actual max as defined by the ecma standard

  regex: RegExp
  ignoreCase = false

  constructor(regex: RegExp) {
    this.regex = regex
    this.ignoreCase = regex.ignoreCase
    const regexpParser = new RegExpParser()

    const regExpAst = regexpParser.pattern(regex.toString())

    this.builder = this.createBuilder(regExpAst)
  }

  builder: (context: IBuildContext) => string

  build() {
    const context: IBuildContext = { groups: {} }
    return this.builder(context)
  }

  createBuilder(node: RegExpPattern) {
    return this.visitThing(node.value)
  }

  visitThing<T extends IRegExpAST>(thing: IPossibleValues): (context: IBuildContext) => string {
    switch (thing.type) {
      case "Disjunction": {
        const funcs = thing.value.map(val => this.visitThing(val))
        return context => {
          return choose(funcs)(context)
        }
      }
      case "Alternative": {
        const funcs = thing.value.map(val => this.visitThing(val))
        return context => {
          let str = ""
          funcs.forEach(func => (str += func(context)))
          return str
        }
      }
      case "Set": {
        const inflated: number[] = thing.value
          .map(val => (typeof val === "number" ? val : createArrayBetween(val.from, val.to)))
          .reduce((acc: any, el) => (typeof el === "number" ? [...acc, el] : acc.concat(el)), [])

        const getChar = () => {
          const codePoint = thing.complement
            ? randomCodePointExcept(inflated, Builder.MAX_CODE_POINT)
            : choose(inflated)
          const char = String.fromCodePoint(codePoint)

          return this.applyIgnoreCase(char)
        }

        return () => {
          if (thing.quantifier) {
            let { atLeast, atMost } = thing.quantifier
            if (atMost === Infinity) {
              atMost = Builder.INFINITY
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
              atMost = Builder.INFINITY
            }
            const count = rand(atLeast, atMost + 1)
            if (count === 0) {
              return ""
            } else {
              if (this.ignoreCase) {
                return repeat(() => this.applyIgnoreCase(char), count)
              } else {
                return repeat(char, count)
              }
            }
          } else {
            return this.applyIgnoreCase(char)
          }
        }
      }
      case "Group": {
        const valueBuilder = this.visitThing(thing.value)
        return context => {
          const value = valueBuilder(context)

          if (thing.capturing) {
            context.groups[thing.idx] = value
          }
          return value
        }
      }
      case "GroupBackReference": {
        return context => {
          return context.groups[thing.value]
        }
      }
      case "StartAnchor": {
        return () => ""
      }
      case "EndAnchor": {
        return () => ""
      }
      default:
        console.warn("Regex feature not implemented", thing)
        return () => {
          return ``
        }
    }
  }

  applyIgnoreCase(char: string) {
    if (this.ignoreCase) {
      if (Math.random() < 0.5) {
        return char.toUpperCase()
      } else {
        return char.toLowerCase()
      }
    } else {
      return char
    }
  }
}

function randomCodePointExcept(exceptions: number[], maxCodePoint = 0x10ffff) {
  let attempts = 0

  while (attempts < 1000) {
    const num = rand(0, maxCodePoint + 1)
    if (!exceptions.includes(num)) {
      return num
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
