---
title: Electron渲染进程调用主进程模块探索
date: 2021-10-11 11:04:35
tags: Electron
image: /2021/10/11/Electron/Electron渲染进程调用主进程模块探索/head.jpg
excerpt: 优雅地暴露主线程接口。
---

图片来源：[pixiv:title 作者：author](source url)

## 前言

因为Electron的大部分原生功能都必须主进程调用，渲染进程与主进程之间通信是不可或缺的。在前段时间学习Electron时，探索出了一套个人认为比较好用的暴露主进程接口的模式，在此记录并分享一下。

## 开始

一般来说暴露接口主要有两种方式，一是通过预加载脚本向目标window注入函数。由于这种方法不能直接使用ts文件作为预加载脚本，放弃。二就是通过`ipcMain`与`ipcRenderer`模块进行通信。但是，这种方式带来问题就是必须在主进程与渲染进程之间两头注册与触发事件，同时维护事件处理与触发的逻辑实在是不够优雅，这里就需要一套既能在主进程，又能在渲染进程运行的代码。

为了对暴露的接口进行分类，我这里将`ipcMain`的每个channel作为一个分类，其下有多个方法。

## 目录结构

```
ipcHub
  > channels     // 存放各个channel的方法
    > dialog.ts
    > xxx.ts
    ...
  > createIpcChannel.ts   // 创建channel的函数
  > index.ts              // 汇总所有channel，并导出一个供主进程调用的初始化channel函数
```

## 实现

假设要创建一个dialog channel，包含一个打开文件夹选择的窗口。单个channel的代码如下：

``` ts
// channels/dialog.ts
import { dialog, OpenDialogOptions } from 'electron'
import createIpcChannel from '../createIpcChannel'

// 这里就暴露了一个显示选择文件夹窗口的接口
// 其中，主进程使用dialogIpc，渲染进程使用dialogIpcClient
export const dialogIpc = createIpcChannel('dialog', {
  // 定义一个channel下的方法，参数从渲染进程传来
  showDirSelectDialog(options: OpenDialogOptions) {
    // 一些操作，这些代码是要在主进程中执行的。
    // 返回异步的结果，返回给渲染进程
    // 这里的this见下面createIpcChannel的说明
    return dialog.showOpenDialog(this, options)
  }
})

export const dialogIpcClient = dialogIpc.getChannelClient()
```

接下来是最关键的`createIpcChannel`函数的实现。

``` ts
// createIpcChannel.ts
import { BrowserWindow, ipcMain, ipcRenderer } from 'electron'

// 定义泛型，用来在时间暴露的接口的同时定义调用的接口
// 关于this，由于我自己做的是单页应用，并且没有打开新窗口的操作，
// 也就是说我只维护一个唯一的渲染进程，为了方便所以就在这里将this赋值了window实例，
// 你可以把this当作是一个初始化channel时存放主进程传进来的额外数据的地方，根据自己的需要放其他东西
export default function createIpcChannel<T extends { [actionName: string]: 
  (this: BrowserWindow, ...args: any[]) => any }>(channelName: string, actions: T) {
    // 初始化ipc channel，实际上就是绑定对应频道的事件，这个方法要给主进程调用
    function initIpcChannel(mainWindow: BrowserWindow) {
      ipcMain.handle(channelName, (e, actionName, ...args) => {
        // 利用传入的一个actionName区分同一channel下不同方法
        const targetAction = actions[actionName]
        return targetAction.call(mainWindow, ...args)
      })
    }

    // 获取client
    function getChannelClient() {
      // 根据方法名(actionName)映射对应的方法类型
      type ChannelClient = {
        [ActionName in keyof T]: (...args: Parameters<T[ActionName]>) => Promise<ReturnType<T[ActionName]>>
      }

      // 用一个proxy将访问转发给对应的方法
      return new Proxy({} as ChannelClient, {
        get(target, getter) {
          return (...args: any[]) => ipcRenderer.invoke(channelName, getter, ...args)
        }
      })
    }

    return { initIpcChannel, getChannelClient }
}
```

为了在主线程初始化所有ipc channel，再定义一个方法，供主线程调用。

``` ts
import { BrowserWindow } from 'electron'
import { windowIpc } from './channels/window'
import { dialogIpc } from './channels/dialog'
import { appIpc } from './modules/app'

export default function initIpcHub(mainWindow: BrowserWindow) {
  [
    windowIpc,
    dialogIpc,
    appIpc
  ].forEach(item => item.initIpcChannel(mainWindow))
}
```

## 使用
``` ts
import { dialogIpcClient } from '~/ipcHub/modules/dialog'

async function openDirSelectDialogForSaveFile() {
  const result = await dialogIpcClient.showDirSelectDialog({
    title: '选择保存位置',
    properties: ['openDirectory']
  })

  if (!result.canceled) console.log(result.filePaths[0])
}
```