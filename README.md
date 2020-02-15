Create sample strings based on a regex


```
npm i --save regex-to-string

yarn add regex-to-string
```


```javsacript
const builder = new Builder(/a+ regexp?/)

builder.build()  //   =>   aaaaaaaaaaaa regexp
builder.build()  //   =>   aaaaaa regex
builder.build()  //   =>   aaa regexp
builder.build()  //   =>   aaaaaaaaaaaaaaaaaa regexp
builder.build()  //   =>   aaaaaaa regex
builder.build()  //   =>   aaaaaaaaaa regex
```


## Config

Set the maximum number of occurrances meant by `+` and `*`:

```
Builder.INFINITY = 10
```


Set the highest code point to be used for `.`:

```
Builder.INFINITY = 100  // max is 0x10FFFF
```


## TODO
Groups, back references, assertions
