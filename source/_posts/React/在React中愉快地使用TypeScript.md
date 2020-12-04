---
title: 在React中愉快地使用TypeScript
date: 2020-12-04 13:45:39
tags: [React, TypeScript]
image: /2020/12/04/React/在React中愉快地使用TypeScript/head.jpg
excerpt: 
---

图片来源：[pixiv:title 作者：author](source url)

## 前言

在网上看过一个段子：“使用vue，很好；使用ts，非常好；使用vue + ts，爆炸”，虽然这篇文章的主角不是Vue，但这个段子也足以说明一个问题：ts在和框架结合时，会遇到一系列的类型问题。ts的类型系统是个类型链，一旦这个类型链中断了后续就会失去对类型的约束和提示，vue在模板语法中使用了一些“魔术”语法，导致类型系统在数据和模板之间出现了断层，这也是为什么vue难以和vue结合的原因。相比之下React因为使用了jsx语法，本质上等同于js语句，这样就使ts和react较好地结合(实际上还是靠ts主动适配的jsx语法)，但是刚开始一个项目时，还是会遭遇到一系列类型问题，这里就总结一下react + ts的常见问题。

## 组件基本props类型及Component泛型

`React.Component`中有三个泛型：
``` ts
type MyComponent = React.Component<Props, State, SnapShot>
```

* `Props`：组件参数，最常用的就是这个
* `State`：组件状态，在一些高阶组件向state注入成员时会用到
* `SnapShot`：快照类型，也就是当使用有返回值的`getSnapshotBeforeUpdate`时`componentDidUpdate`接到的第三个参数的类型(参见：[https://zh-hans.reactjs.org/docs/react-component.html#getsnapshotbeforeupdate])

**栗子：**

``` tsx
import React, { PropsWithChildren } from 'react'

// 也可以写全ArticleHeaderProps，但个人感觉太长，而且需要导出组件参数类型的情况不是很多
// 解决命名重复引入时为Props设置别名即可
export interface Props {
  title: string
} 

// 当组件使用了高阶组件，注入了其他属性时，需要在这里将导出的类型放在这里和Props组成联合类型
// 这样才能在组件中正常提示
type FinalProps = Props

// PropsWithChildren为props带上children属性
class ArticleHeader extends React.Component<PropWithChildren<FinalProps>> {
  constructor(props: PropWithChildren<FinalProps>) {

  }
}

// 最后需要再强制断言为Props，如果不这样做，当外部使用时，将提示需要传入高阶组件中注入的属性
// 这里建议封装一个拼接所有高阶组件的函数，顺便提供一个Props的泛型
export default ArticleHeader as any as React.Component<Props>
```
## 路由参数类型

几乎所有react应用都使用了路由，要将类型系统带入路由中去，首先每个页面组件都要导出一个路由参数的接口，之后再由一个统一的类型文件汇总并导出一个路由参数映射类型。

``` ts
/* views/article/index.tsx */
export interface RouteParams {
  articleId: number
}

/* views/articleList/index.tsx */
export interface RouteParams {
  categoryId: number
}

/* routes/index.ts */
import { RouteParams as ArticlePageRP } from '/views/articlePage'
import { RouteParams as ArticleListRP } from '/views/articleListPage'

// 最终导出的路由参数映射类型
export interface RouteParamMaps {
  article: ArticlePageRP
  articleList: ArticleListRP
}

export type RouteNames = keyof RouteParamMaps

// 封装导航器，考虑到react中导航大多都经过了二次封装，这里只提供一个简单实现的类型表示(基于react-router-dom@5)
// 相当于提供一个思路，具体请根据使用的导航器封装
/* utils/createRouter.ts */
type CreateRouter = <RouteParams>(props: { history: RouteChildrenProps['history'] }) => MyRouter<RouteParams>

interface MyRouter<RouteParams> {
  params: {
    search: RouteParams
    state: RoutePrams
  }

  search<T extends RouteNames>(path: T, params: RouteParamMaps[T], action?: 'push' | 'replace')
  state<T extends RouteNames>(path: T, params: RouteParamMaps[T], action?: 'push' | 'replace')
}


// 使用
/* views/articleList.tsx */
import React from 'react'
import { RouteChildrenProps } from 'react-router'
import createRouter from '/utils/createRouter'

export interface RouteParams {
  categoryId: number
}

export interface Props {} 

type FinalProps = Props & RouteChildrenProps

class ArticleListPage extends React.Component<FinalProps> {
  router = createRouter<RouteParams>()

  constructor(props: FinalProps) {
    // params会有类型提示
    console.log(router.params.search)

    // 对于不同的路由，参数的提示也会不同
    router.search('article', { articleId: 1 })
  }
}

export default ArticlePage
```

## Ref导出类型

使用ref时经常会有导出一个组件控制器的情况，下面是栗子：

``` tsx
/* views/article/components/header.tsx */
class ArticleHeader { ... }

/* views/article/index.tsx */
class ArticlePage extends React.Component {
  headerRef = createRef<ArticleHeader>()
}
```

hook组件由于没有ref，就需要手动导出一个ref类型。

``` tsx
import React, {} from 'react'

export interface ArticleHeaderRef {
  show(): void
  hide(): void
}

export interface Props {
  // 官方有forwardRef用于给函数式组件添加ref，但不知为什么使用时会遭遇类型错误，于是这里手动定义了个getRef属性
  getRef?: MutableRefObject<ArticleHeaderRef | undefined | null>
}

// 这里省略掉FinalProps了，实际应该有的

function ArticleHeader(props: Props) {
  if (props.getRef) props.getRef.current = { show, hide }

  show() {}
  hide() {}
}

// 使用
const articleHeaderRef = useRef<ArticleHeaderRef | undefined | null>() // 函数组件
// articleHeaderRef = createRef<ArticleHeaderRef | undefined | null>() // 类组件

/*
  这里有个偷懒的方式，为getRef设置：MutableRefObject<any>，
  使用时：useRef<ArticleHeaderRef>，这样虽然类型检查有些小瑕疵，但不用去写空值的交叉类型了
*/
```
## 高阶组件注入类型

高阶组件是跨组件复用逻辑的利器，可以看做是一个装饰器，不过为高阶组件添加类型有些小坑。

首先重温两点知识：
* 高阶组件接收一个组件，返回一个新组件
* 装饰器模式要求不能改变被装饰者的接口

明确了这两点，就可以知道：要为高阶组件定义的传入参数类型是一个返回组件实例的类，而不是组件实例；其次，返回的类型就是传入的类型，注入到props的属性要通过为FinalProps追加联合类型来实现。

话说当初为了实现装饰器自动添加注入的props类型，试了一天最后也没实现，想不通为什么高阶组件已经明确定义了返回的类型用了装饰器为什么还是没返回新的类型，后来才想明白装饰器这个设计模式本身就是要求不能改变接口。

``` tsx
// 这里有个小坑，就是我上面第一点提到的，ts可以将类直接当类型使用，这种情况代表的是类实例，而不是类本身，所以不能用React.Component
type ReactComponentClass = { new(...args: any[]): React.Component }

function userStoreHOC<T extends ReactComponentClass>(Component: T): T {
  return function WrappedComponent(props: any) {
    return (
      <UserStoreContext.Consumer>{context =>
        <Component {...props} userStore={context} />
      }</UserStoreContext.Consumer>
    )
  }
}

interface UserStoreProps {
  $userStore: {
    userName: string
    login(): void
    logout(): void
  }
}

// 使用
export interface Props {}

type FinalProps = Props & UserStoreProps

// 省略代码...
```

## 原生api追加类型