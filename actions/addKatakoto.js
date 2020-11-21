const fs = require('fs')
const path = require('path')

// [content]
const katakotoContent = process.argv[2]
if (!katakotoContent) return console.log('请输入只言片语的内容！')

const katakotoDate = new Date().toISOString()
const filePath = path.resolve(__dirname, '../source/_data/katakoto.yaml')
const fileSymbol = fs.openSync(filePath, 'a')
const katakotoCode = `- content: ${katakotoContent}\n  date: ${katakotoDate}\n`
fs.writeSync(fileSymbol, katakotoCode)
console.log('成功添加一条只言片语！')