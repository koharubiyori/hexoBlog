---
title: WebWorker与主线程的三种通信方式
date: 2021-03-10 10:55:00
tags: [JavaScript, 前端]
image: https://bn1302files.storage.live.com/y4mZYMsZpS5-VbxrkCiQY8drcrsuxZ3Jt_uYrSc537nNl7DOyKhw-l3ywhtZK1OdmLVzkp9DbtfXT0_9UhsH2IJpQY_JWeJQ3kheUEpAE__qQkwpcktv-AuvrW7ZbYlu0I2eKZyJJemHClK5bra14vbBCVAVCvbTlVuMmOKTE695poEFoK71ddRtHPqqL39S-fD?width=1024&height=484&cropmode=none
excerpt: WebWorker有改变前端的潜力。
---

图片来源：忘了在哪弄的了，有知道出处的大佬告诉我下\_(:з」∠)\_

## Worker.postMessage

这种方式可以说是最为“正统”的WebWorker与主线程的通信方式，可以进行一对一，一对多的通信。

### WebWorker

``` js
// main.js
const worker = new Worker('worker.js')

worker.addEventListener('message', e => {
  const { type, data } = e.data
  if (type === 'print') console.log(data)   // 打印出：hello world
})

worker.postMessage({ type: 'welcome' })

// worker.js
self.addEventListener('message', e => {
  const { type } = e.data
  if (type === 'welcome') self.postMessage({ type: 'print', data: 'hello world' })
})
```
注意，ServiceWorker的写法和普通WebWorker不同：

### ServiceWorker

``` js
// main.js
const worker = await registerWorker('worker.js')

async function registerWorker(workerUrl) {
  const serviceWorkerRegistration = await navigator.serviceWorker.register(workerUrl)
  await navigator.serviceWorker.ready
  return serviceWorkerRegistration.active
}

// 注意这里用的不是worker
navigator.serviceWorker.addEventListener('message', e => {
  const { type, data } = e.data
  if (type === 'print') console.log(data)   // 打印出：hello world
})

// worker.js
self.addEventListener('message', e => {
  const { type } = e.data
  if (type === 'welcome') {
    // 注意这里的写法
    const windowClients = await clients.matchAll()  // 先拿到ServiceWorker的所有客户端窗口

    // 这会给所有当前ServiceWorker服务的客户端窗口发送消息(一对多)
    windowClients.forEach(windowClient => windowClient.postMessage({
      type: 'print',
      data: 'hello world'
    }))

    // 通过判断url得到特定客户端窗口，只给一个窗口发送信息(一对一)
    windowClients.find(windowClient => windowClient.url === 'xxx').postMessage({})
  }
})
```
取消事件监听的方式和DOM元素`removeEventListener`方法相同。

## BroadcastChannel

这是三种方式中使用最为简单的方式，不仅用于主线程和WebWorker通信，也可以用于同源窗口之间的通信。只支持多对多，不能指定窗口(当然你可以自己为窗口分配id实现与指定窗口的通信)。

``` js
// main.js
const bc = new BroadcastChannel('testChannel')

bc.postMessage('hello world')

// worker.js
const bc = new BroadcastChannel('testChannel')

// 打印出hello world
bc.addEventListener('message', e => console.log(e.data))

bc.postMessage('hello worker')  // 同一窗口或WebWorker下不会触发由自己发出的信息，也就是说这里并不会触发上面的事件
```
## MessageChannel

这种方式可以很方便地实现窗口与ServiceWorker一对一的通信。

``` js
// main.js
// 将port2传给serviceWorker进行通信
const worker = await registerWorker('worker.js')

const messageChannel = new MessageChannel()

// postMessage的第二个参数为定义要移交控制权的对象，目前ArrayBuffer、MessagePort、ImageBitmap这些对象实例可以移交
// 将messageChannel实例的其中一个端口移交给serviceWorker，实现一对一通信
worker.postMessage({ 
  type: 'initMessageChannel', 
  data: { port: messageChannel.port2 }
}, [messageChannel.port2])

messageChannel.port1.addEventListener('message', e => {
  const { type, data } = e.data
  if (type === 'print') console.log(data)   // 打印出：hello world
})

// 接下来发送信息既可以继续使用worker.postMessage，也可以选择messageChannel.port1.postMessage

// worker.js
const messageChannelPort = null

self.addEventListener('message', e => {
  const { type, data } = e.data
  if (type === 'initMessageChannel') {
    messageChannelPort = data.port
    messageChannelPort.postMessage({ type: 'print', data: 'hello world' })
  }
})

// 还可以声明一个数组保存所有发来的messageChannelPort，实现一对多的通信等等。
```

## 总结

这三种方式各有侧重，虽然都是有办法实现一对一，一对多的功能的，但选择合适的通信方式仍然很重要。

## 参见

* [MDN Worker.postMessage](https://developer.mozilla.org/zh-CN/docs/Web/API/Worker/postMessage)
* [MDN BroadcastChannel](https://developer.mozilla.org/zh-CN/docs/Web/API/BroadcastChannel)
* [MDN MessageChannel](https://developer.mozilla.org/zh-CN/docs/Web/API/MessageChannel/MessageChannel)
* [MDN 结构化克隆算法](https://developer.mozilla.org/zh-CN/docs/Web/API/Web_Workers_API/Structured_clone_algorithm)

