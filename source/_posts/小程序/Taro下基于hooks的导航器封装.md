---
title: Taro下基于hooks的导航器封装
date: 2020-12-02 22:59:42
tags: [小程序, Taro, React]
image: /2020/12/02/小程序/Taro下基于hooks的导航器封装/head.jpg
excerpt: 原始导航实在是太难用了！
---

## 前言

浑浑噩噩一年又要过去了，前些日子终于又找到了工作。7.5k的工资在沈阳还算可以吧，只是进了公司维护垃圾代码实在是糟心，尤其是改之前的bug时，
恨不得把那个写垃圾代码的揪出来打一顿。

## 开始

原生小程序以及各类第三方框架中，导航传参都是以在页面路径后加查询字符串进行传参的方式，直接用非常难受，并且进行页面间通信也非常麻烦，
这里和大家分享下我在使用Taro开发小程序时封装的一个基于Hooks的导航器。

### 封装导航

首先要解决的就是路由传参问题（令我震惊的是，目前待过的三家公司项目中居然都是直接手拼字符串），我目前见过有封装函数帮助序列化参数，或者将参数存入Storage的手段，
个人认为两种方式均有一些弊端，第一个不能传太多参数，第二个会导致路由参数残留在缓存中，实际上是没有必要的，并且这两种都不能传递复杂类型。

这里将参数放在一个对象中，字段名使用对应路由名，值为当前的路由参数：

``` ts
import Taro, { useRouter } from '@tarojs/taro'

// 存放所有路由参数
const routeParams = {}

// 路由方法工厂
const createNavigator = method => {
  return (path, params) => {
    // 每次跳转时都要给一个空对象，防止在没传参进入页面时拿到上一次传了的参数
    routeParams[path] = params || {}
    return Taro[method]({ url: path })
  }
}

// 后退方法要单独封装
const back = (delta = 1, params) => {
  const pages = Taro.getCurrentPages()
  const isBackHome = pages.length - delta < 1
  // 如果后退的步数大于页面栈的总数，则回到首页，这和navigateBack的行为是一致的
  const targetPagePath = isBackHome ? basePath('home') : (pages[pages.length - 1 - delta]).route
  routeParams[path] = params || {}
  return isBackHome ? Taro.reLaunch({ url: basePath('home') }) : Taro.navigateBack({ delta })
}

// 这个对象也可以单独导出，方便非页面文件使用
const navigation = {
  push: createNavigator('navigateTo'),
  replace: createNavigator('redirectTo'),
  switchTab: createNavigator('switchTab'),
  reLaunch: createNavigator('reLaunch'),
  back
}

function useMyRouter() {
  // 使用Taro提供的这个钩子拿到关于路由的一些数据
  const plainRouter = useRouter()

  const getParams = () => ({
    ...routeParams[plainRouter.path],
    // 这个字段会接到外部场景传来的参数(如扫码等)，要一起提供出去
    ...plainRouter.params
  })

  return {
    path: plainRouter.path, // 当前路由路径
    params: getParams(),  // 当前路由的参数
    // 再获取一次路由的参数，由于我们使用了对象进行参数保存，可以通过附加一些路由监听手段活用这个方法，下面会介绍
    getParams,  
    ...navigation,  // 附加导航方法
  }
}
```

以上就实现了一个自定义对象保存路由参数的导航器。



<!-- 废话不多说直接上代码：

``` ts
import Taro, { useRouter } from '@tarojs/taro'
import store from '~/redux'
import routeActions from '~/redux/route/actions'
import { RouteParamsMaps } from '~/routes'
import { Unsubscribe } from 'redux'

type MyNavigate = <
  Path extends keyof RouteParamsMaps, 
  Params extends RouteParamsMaps[Path]
>(path: Path, params?: Params) => Promise<void>

export interface MyRouter<
  Params = { [key: string]: any }
> {
  path: string
  params: Params
  getParams(): Params
  push: MyNavigate
  replace: MyNavigate
  switchTab: MyNavigate
  reLaunch: MyNavigate
  back(delta?: number, params?: { [key: string]: any }): Promise<void>
  onParamsChange(handler: (params: Params, prevParams?: Params) => void): Unsubscribe
}

const basePath = (path: string) => `/pages/${path}/index`
const debasePath = (path: string) => path.replace(/^\/?pages\/(.+)\/index$/, '$1')
const createNavigator = (method: 'navigateTo' | 'redirectTo' | 'switchTab' | 'reLaunch'): MyNavigate => {
  return (path, params) => {
    routeActions.setParams(path, params || {} as any)
    return Taro[method]({ url: basePath(path) }) as any
  }
}

const back: MyRouter['back'] = (delta = 1, params) => {
  const pages = Taro.getCurrentPages()
  const isBackHome = pages.length - delta < 1
  // 如果后退的步数大于页面栈的总数，则回到首页，这和navigateBack的行为是一致的
  const targetPagePath = isBackHome ? basePath('home') : (pages[pages.length - 1 - delta]).route
  routeActions.setParams(debasePath(targetPagePath) as any, params || {} as any)
  return isBackHome ? Taro.reLaunch({ url: basePath('home') }) : Taro.navigateBack({ delta }) as any
}

export const navigation = {
  push: createNavigator('navigateTo'),
  replace: createNavigator('redirectTo'),
  switchTab: createNavigator('switchTab'),
  reLaunch: createNavigator('reLaunch'),
  back
}

export default function useMyRouter<RouteParams = { [key: string]: any }>(): MyRouter<RouteParams> {
  const plainRouter = useRouter()

  
  // 监听当前路由的参数变化
  const onParamsChange = (handler: (params: RouteParams, prevParams?: RouteParams) => void) => {
    let lastRouteState: any = null
    
    return store.subscribe(() => {
      const currentRouteState = store.getState().route
      const currentParams = currentRouteState.pageParams[debasePath(plainRouter.path!)]

      let isChanged = false
      if (currentParams === undefined) { return }

      if (lastRouteState === null || lastRouteState.pageParams[debasePath(plainRouter.path!)] === undefined) {
        isChanged = true
      } else {
        const lastParams = lastRouteState.pageParams[debasePath(plainRouter.path!)]
      
        // 进行一次浅比较
        for (let key in currentParams) {
          if (Object.is(currentParams[key], lastParams[key]) === false) {
            isChanged = true
            break
          }
        }
      }
      
      const prevParams = lastRouteState ? 
        lastRouteState.pageParams[debasePath(plainRouter.path!)] :
        undefined

      isChanged && handler(currentParams, prevParams)
      lastRouteState = currentRouteState
    })
  }

  return {
    path: plainRouter.path!,
    params: {
      ...store.getState().route.pageParams[debasePath(plainRouter.path!)],
      ...plainRouter.params
    } ,
    getParams: () => store.getState().route.pageParams[debasePath(plainRouter.path!)],
    ...navigation,
    onParamsChange
  }
}

```

 -->




