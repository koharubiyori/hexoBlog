---
title: 从Webpack5开始学习框架搭建与插件编写
date: 2021-07-01 19:52:36
tags: Webpack
image: /2021/07/01/Webpack/从Webpack5开始学习框架搭建与插件编写/head.jpg
excerpt: 构建自己的工作流。
---

图片来源：[pixiv:title 作者：author](source url)

## 前言

对于“Webpack”这个块现代前端开发环境的基石，我一直抱着“敬而远之”的态度，仿佛Webpack一个神明。Vue就用`vue create`，React就用`create-react-app`等等，一直以来用着也还算舒服，现成的项目模板工具解决了开发中80%甚至90%的问题，但是我有一种不安——我所使用的开发环境是我无法完全控制、完全掌握的；甚至，我把这些环境当成理所当然的，放弃了思考，仿佛这些都如同自然规律一般。如果要改变它们，就只好去网上翻那些文章博客，将其中的代码片段粘贴过来。然而，对于看不懂webpack代码内容的我如同古人面对无法解释的自然现象，统统归结为通过“魔法”改变了开发环境的配置，要是不凑巧这魔法咒语不灵，那最后只得“不语怪力乱神”，告诫自己要放弃“魔法”，适应规律，不得不才实际开发时采用更麻烦的写法。然而确实是这样的吗，既然编码者从那句“Hello World”起创造了代码的世界，那编码者就是代码世界的上帝，凡人遵循自然规律才能生存，而上帝是不受这些束缚的，如果规律阻碍了祂，祂就要去改变规律，创造规律。

## 开始

> 建议在[通读Webpack官方概念指引](https://webpack.docschina.org/concepts/)后，再阅读本文。

**最终目标：要搭建出一个基本支持现代前端开发技术(ts、vue、scss等)可以打包出多个单独页面，适用于APP内嵌H5活动页的框架。**

首先要确定一个初级的目录结构，这里借鉴了vue-cli@2.0时代生成的框架的目录结构。

为了便于理解，这里首先先搭建一个普通打包框架。

```
config
  > webpack.base.conf.js  // 开发环境与生产环境的共用配置
  > webpack.dev.conf.js   // 开发环境专有配置
  > webpack.prod.conf.js  // 生产环境专有配置
  > webpack.rules.js      // Loaders的配置
src
  > components
  > utils
  > styles
    > global.scss        // 定义一个全局载入的sass文件，用于全局设置scss变量、函数等
  > pages
  index.ts               // 入口文件
```






