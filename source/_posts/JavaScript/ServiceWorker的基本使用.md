---
title: ServiceWorker的基本使用
date: 2020-10-10 13:37:12
tags: [JavaScript, 前端]
image: /2020/10/10/JavaScript/ServiceWorker的基本使用/head.jpg
excerpt: 研究如何在萌百预览MMD组件的问题时用了一下这个。
---

图片来源：忘了在哪弄的了，有知道出处的大佬告诉我下

## 前言

前段时间手术后在家休养，闲着没事就打算在萌百搞个MMD预览器，其中用到的MMDLoader读取到pmx文件时，会自动按保存的贴图路径请求同级的贴图文件。然而萌百的资源站不存在文件夹系统，
这里只好上传一个包含pmx和贴图的压缩包。这样上传文件问题虽然解决了，但自动请求贴图文件这部分还是不行。不过好在平时没事没少在MDN里瞎点，突然想起好像有个什么Worker可以拦截请求，
这样就可以将贴图的请求拦截下来，返回指定的内容。这就是接下来要介绍的，前端代理服务器————ServiceWorker。

## 开始

如果还不了解什么是WebWorker，请先自行百度。ServiceWorker是WebWorker的一种。

首先要注意的一点：ServiceWorker的设计偏向于“增强”，而不是“必要”。

ServiceWorker分为三种状态：下载 -> 安装 -> 激活。

在首次进入时，会进行下载安装及激活(注意如果进行请求拦截，则必须在重进进入后或刷新后才会正常拦截请求)。

同时，如果更新了worker中的代码，在访问页面时worker也会更新，但会进入“等待激活”的状态，这时所有正在运行的页面还是会执行旧的worker代码，必须在所有和那个worker有关的页面全部关闭后(不能是刷新，必须关闭标签页)，再次进入才会是新的worker代码，所以如果要将ServiceWorker用在关键流程上，一定要特别注意代码的质量。

### 注册worker

``` js
async function initWorker() {
  // worker.js的代码必须和当前执行的js文件同域
  // 如果要拦截请求，worker.js还必须通过根路径获取到(在url上为根路径即可，不必是服务器上真实的网站跟路径)
  // 每次都执行register，但实际只会注册一次
  const serviceWorkerRegistration = await navigator.serviceWorker.register('worker.js', { scope: './' })
  await navigator.serviceWorker.ready // 等待准备完成

  const worker = serviceWorkerRegistration.active!  // 返回当前活动的ServiceWorker
  return worker
}
```

其中，`navigator.serviceWorker.register`的第一个参数为worker的文件路径，第二个参数为配置对象，目前仅支持一个scope参数，该参数为这个worker可以拦截的最大路径，默认和worker文件路径同级(也就是'./')。举个例子：

当前域名为`example.com`，设置了`scope: 'aaa/bbb'`，
* example.com/aaa/bbb √
* example.com/aaa/bbb/ccc √
* example.com/aaa/bbb?ccc=ddd √
* example.com/aaa ×

### 拦截请求

``` js
// worker.js

// 监听fetch事件，拦截请求；使用e.respondWith返回内容
self.addEventListener('fetch', (e: any) => {  // e.request中保存了请求的详细信息，具体请自行打断点查看有哪些字段
  // return // 直接return表示不经过代理
  // 看网上的一些教程中，有这样的一种写法：e.respondWith(fetch(e.request)) 实际测试发现会遭遇一些奇怪的跨域问题。

  // 创建一个响应对象，respondWith方法只支持返回一个Promise<Response>
  const response = new Promise(async resolve => {
    const response = new Response('123', {
      headers: { 'Content-type': 'text/plain' }
    })

    await new Promise(resolve => setTimeout(3000, resolve)) // 延迟3秒
    resolve(response)
  })

  // 注意respondWith不能异步执行，有异步流程要在返回的promise内部处理
  e.respondWith(response)    
})
```

关于Response对象，参见[MDN文档](https://developer.mozilla.org/zh-CN/docs/Web/API/Response/Response)。

### 主线程与ServiceWorker通信

主线程使用worker实例的`postMessage`方法发送消息，worker中监听message事件接收消息。

``` js
// main.js
const worker = await initWorker()
worker.postMessage({ a: 1, b: 2 })  // 基本可以传除Error和Function以外的任何值，因为使用了结构化克隆算法

// worker.js
// worker中没有window，要使用self
self.addEventListener('message', e => {
  console.log(e.data) // e.data 消息主体
})
```

关于结构化克隆算法，参见[MDN文档](https://developer.mozilla.org/zh-CN/docs/Web/Guide/API/DOM/The_structured_clone_algorithm)。

现在有个问题，只有主线程通知ServiceWorker的办法，没有ServiceWorker通知主线程的方法。这里就要用到一个额外的工具“MessagePort”。

``` js
// main.js
const messageChannel = new MessageChannel()

messageChannel.port1.onmessage = e => {
  console.log(e.data)
}

const worker = await initWorker()

// 将messageChannel的一个port发送到worker中，注意必须进行所有权转移
// postMessage第二个参数可以传入一个对象所有权转移数组，直接将数据所有权转移到目标worker，并且这个对象在当前环境变得不可用。
// 可以进行所有权转移的对象类型：ArrayBuffer、MessagePort、ImageBitmap
// 使用所有权转移传输数据的性能更好
worker.postMessage({
  type: 'initMessageChannel',
  messageChannelPort: messageChannel.port2
}, [messageChannel.port2])

// worker.js
let messageChannelPort = null

self.addEventListener('message', e => {
  // 初始化messageChannelProt
  if (e.data.type === 'initMessageChannel') {
    messageChannelPort = e.data.messageChannelPort
    messageChannelPort.postMessage(new Blob())
  }
})
```

顺便说句，因为MessageChannel传输数据也用了结构化克隆算法，所以可以拿来进行深拷贝，简单又安全，唯一的问题是至少要IE10。

## 扩展链接

* [ServiceWorker - MDN](https://developer.mozilla.org/zh-CN/docs/Web/API/ServiceWorker)
* [postMessage - MDN](https://developer.mozilla.org/zh-CN/docs/Web/API/Client/postMessage)
* [respondWith - MDN](https://developer.mozilla.org/zh-CN/docs/Web/API/FetchEvent/respondWith)
* [MessageChannel - MDN](https://developer.mozilla.org/zh-CN/docs/Web/API/MessageChannel)
