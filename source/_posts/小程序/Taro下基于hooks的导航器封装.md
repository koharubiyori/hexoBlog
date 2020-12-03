---
title: Taro下基于hooks的导航器封装
date: 2020-12-02 22:59:42
tags: [小程序, Taro, React]
image: /2020/12/02/小程序/Taro下基于hooks的导航器封装/head.jpg
excerpt: 原始导航实在是太难用了！
---

## 前言

浑浑噩噩一年又要过去了，前些日子终于又找到了工作，只是进了公司维护垃圾代码实在是糟心，尤其是改之前的bug时，
恨不得把那个写垃圾代码的揪出来打一顿。

## 开始

原生小程序以及各类第三方框架中，导航传参都是以在页面路径后加查询字符串进行传参的方式，直接用非常难受，并且进行页面间通信也非常麻烦，
这里和大家分享下我在使用Taro开发小程序时封装的一个基于Hooks的导航器。

### 封装导航

首先要解决的就是路由传参问题（令我震惊的是，目前待过的三家公司项目中居然都是直接手拼字符串），我目前见过有封装函数帮助序列化参数，或者将参数存入Storage的手段，个人认为两种方式均有一些弊端，第一个传输数据过大会导致出现错误，第二个会导致路由参数残留在缓存中，并且这两种都不能传递无法序列化的对象。经过一番摸索，发现将参数保存在对象中是比较好的方式。

这里将参数放在一个对象中，字段名使用对应路由名，值为当前的路由参数：

``` ts
import Taro, { useRouter } from '@tarojs/taro'

// 存放所有路由参数
const routeParams = {}

// 路径辅助方法，只留路径主体，页面文件约定都为index
const basePath = (path: string) => `/pages/${path}/index`
const debasePath = (path: string) => path.replace(/^\/?pages\/(.+)\/index$/, '$1')

// 路由方法工厂
const createNavigator = method => {
  return (path, params) => {
    // 每次跳转时都要给一个空对象，防止在没传参进入页面时拿到上一次传了的参数
    routeParams[path] = params || {}
    return Taro[method]({ url: basePath(path) })
  }
}

// 后退方法要单独封装，由于我们自己封装请求器，这里顺便实现了个后退时传参
const back = (delta = 1, params) => {
  const pages = Taro.getCurrentPages()
  const isBackHome = pages.length - delta < 1
  // 如果后退的步数大于页面栈的总数，则回到首页，这和navigateBack的行为是一致的
  const targetPagePath = isBackHome ? basePath('home') : (pages[pages.length - 1 - delta]).route
  routeParams[basePath(path)] = params || {}
  return isBackHome ? Taro.reLaunch({ url: basePath('home') }) : Taro.navigateBack({ delta })
}

// 这个对象也可以单独导出，方便非hook组件中使用
const navigation = {
  push: createNavigator('navigateTo'),
  replace: createNavigator('redirectTo'),
  // 由于我们自己封装请求器，switchTab也可以传参了
  switchTab: createNavigator('switchTab'),
  reLaunch: createNavigator('reLaunch'),
  back
}

function useMyRouter() {
  // 使用Taro提供的这个钩子拿到关于路由的一些数据
  const plainRouter = useRouter()

  const getParams = () => ({
    // 通过当前路径取出参数
    ...routeParams[debasePath(plainRouter.path)],
    // 这个字段会接到外部场景传来的参数(如扫码等)，要一起提供出去
    ...plainRouter.params
  })

  return {
    path: plainRouter.path, // 当前路由路径，注意这个path没有开头的斜线
    params: getParams(),  // 当前路由的参数
    // 再获取一次路由的参数，由于我们使用了对象进行参数保存，可以在useDidShow中使用，实现后退时传参，
    // 或通过附加一些路由监听手段活用这个方法，下面会介绍
    getParams,  
    ...navigation,  // 附加导航方法
  }
}
```

以上就实现了一个自定义对象保存路由参数的导航器。

### 路由参数变化监听

原生导航使用EventChannel作为新开页面与上一个页面的通信方式，依靠在EventChannel上订阅及触发事件的方式进行数据传递，
虽说直接使用也还算可以，但只能在两个页面之间通信，个人感觉还是不够便捷。

要实现参数变化的监听就必须依赖一个观察者模式的模型，这里我使用了React中常用的redux保存参数对象。

``` ts
// 向redux store中添加route模块，代替routeParams对象来存储路由参数。

// redux/route/index
export const SET_ROUTE_PARAMS = Symbol()

export const reducer = (state = {
  pageParams: {}
}, action) => {
  switch(action.type) {
    case SET_ROUTE_PARAMS: {
      return {
        ...state.pageParams,
        [action.path]: action.params
      }
    }
  }
}

// redux/route/actions
import store from '~/redux/index'
import { SET_ROUTE_PARAMS } from './index'

export const routeActions = {
  // 进行一次简单封装
  setParams(path, params) {
    store.dispatch({ type: SET_ROUTE_PARAMS, path, params })
  }
}
```

接下来实现监听参数变化的方法：

``` ts
// 在useMyRouter内部，最后加到返回的对象中
const onParamsChange = handler => => {
  // 缓存上一次的状态
  let lastRouteState = null
  
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
```
以上就完成了导航器的封装。

最后这里是一个ts的封装导航器实现：

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






