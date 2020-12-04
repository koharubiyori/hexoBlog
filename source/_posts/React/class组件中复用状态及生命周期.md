---
title: React中高阶组件的两种应用
date: 2020-12-04 10:36:27
tags: React
image: /2020/12/04/React/React中高阶组件的两种应用/head.jpg
excerpt: 原来Class组件也是可以复用生命周期中的逻辑的。
---

图片来源：[pixiv:title 作者：author](source url)

## 前言

用过React hooks的人一定都感受到了使用hooks封装组件状态及声明周期所带来的代码清晰度提升以及使用上的便利。在早些版本的React中，React使用createClass创建组件，其中提供了一个mixins属性，可以将多个组件中的属性与声明周期混合，后来随着es6 class的普及，官方也不在推荐使用createClass来创建组件。虽然es6 class本身无法实现mixins的特性，但通过高阶组件也是可以复用状态及生命周期的。

## 开始

一般情况下，高阶组件大多是像下面这种代码，在返回的新组件中使用传来的组件，用来封装context，从而比较方便地实现依赖注入：

``` tsx
function HOC(Component) {
  return function WrappedComponent(props) {
    return (
      <MyContext.Consumer>{context =>
        <Component {...props} prop1={context}>
      }</MyContext.Consumer>
    )
  }
}
```

如果在高阶组件中利用继承的话，就可以比较好地实现对状态和声明周期中逻辑的封装：

``` tsx
function HOC(Component) {
  // 直接继承要包装的组件
  return class WrappedComponent extends Component {
    constructor(props) {
      super(props)

      /*
        这样在被包装组件内就可以访问到了，
        不过有一点要注意，在构造函数中，因为如果要访问this必须先调用一次父类的构造函数[super(props)]，
        这样也就导致了被包装类在构造函数中的this上访问不到这里向this注入的属性，
        有两个办法可以解决：
          1. 将注入的属性同时混入到将要传给super的props中
          2. 被包装类不在构造函数中注入的属性，改为在componentWillMount中使用
      */
      this.data = { a: 1 }

      this.state.incrementVal = 0
      this.intervalKey = 0
    }

    // 使用声明周期逻辑，如果使用了内部就必须调用父类同名声明周期钩子
    componentDidMount() {
      // 需要判断被包裹组件是否有对应的生命周期钩子
      super.componentDidMount && super.componentDidMount()

      this.intervalKey = setInterval(() => {
        this.setState(prevState => ({
          incrementVal: prevState.incrementVal + 1
        }))
      }, 1000)
    }

    componentWillUnmount() {
      super.componentWillUnmount && super.componentWillUnmount()

      clearInterval(this.intervalKey)
    }
  }
}
```

## 实现包装类私有属性

大家可能已经发现了，在上面的写法中，被包裹组件内部是可以通过`this.intervalKey`访问到这个只在包装类中用到的属性，
这样不仅降低了封装性，而且容易和其他属性发生冲突，造成难以排查的错误，所以我们还需要个让包装类拥有私有属性的办法。

### 配置Babel插件使用Stage-3提案中的私有属性写法

``` ts
function HOC(Component) {
  return class WrappedComponent extends Component {
    constructor() {
      this.#intervalKey = 0  // 使用#号开头命名属性即可
    }
  }
}
```

### 使用Symbol实现私有属性

```ts
function HOC(Component) {
  const intervalKey = Symbol()

  return class WrappedComponent extends Component {
    constructor() {
      this[intervalKey] = 0
    }  
  }
}
```

### 使用es散列表实现私有属性

``` ts
function HOC(Component) {
  // 使用类实例作为键，保存每个对象的私有属性
  // 不要使用Map，理由见：https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/WeakMap#Why_WeakMap
  const privateSpace = WeakMap()

  return class WrappedComponent extends Component {
    constructor() {
      privateSpace[this].set(intervalKey, 0)
    }
  }
}
```

### 支持TypeScript