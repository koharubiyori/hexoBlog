const fs = require('fs')
const path = require('path')
const moment = require('moment')

// [category, title]
if (!process.argv[2] || !process.argv[3]) return console.log('请输入文章分类和与标题') 

const folder = process.argv[2]
if (!folder) return console.log('请输入文章分类和标题！') 
const title = process.argv[3]
if (!title) return console.log('请输入文章标题！')

const postsFolderPath = path.resolve(__dirname, '../source/_posts', folder)
const articleContent = `---
title: ${title}
date: ${moment().format('YYYY-MM-DD HH:mm:ss')}
tags: ${folder}
image: /${moment().format('YYYY/MM/DD')}/${folder}/${title}/head.jpg
excerpt: 简介
---

图片来源：[pixiv:title 作者：author](source url)

## 前言


`

fs.mkdirSync(postsFolderPath, { recursive: true })
fs.mkdirSync(path.resolve(postsFolderPath, title), { recursive: true })
try {
  fs.writeFileSync(path.resolve(postsFolderPath, title + '.md'), articleContent, { flag: 'wx' })
  console.log(`已创建文件【${folder}/${title}.md】！`)
} catch(e) {
  if (e.code === 'EEXIST') return console.log(`【${folder}/${title}.md】已存在，请更换其他名称`)
  console.log(e)
}

