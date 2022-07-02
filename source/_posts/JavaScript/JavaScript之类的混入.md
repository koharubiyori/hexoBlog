---
title: JavaScript之“类的混入”
date: 2022-07-02 19:47:50
tags: [JavaScript, TypeScript]
image: https://snz04pap001files.storage.live.com/y4mM47mDmDsdM3L_3fGx1eNgiK5_dLoZkT8aHaYUS_dnSiAB_Y8aQ4Zqy8g-gJwJ1fz6av404Idi42bW64_f2gQ03TyW1Q0wZuGsh_A84KHN44wSfq0E40dDY_PDoKDgbl1F41nv8yL3zsH_vr67pchz4gHhLaHcA2wbgI2ViQVV_IIWzPI2Z6_HB-7H3lTqeKh?width=1024&height=570&cropmode=none
excerpt: 精神一到何事か成らざらん！
---

## 前言

“混入类”这个概念可能对某些小伙伴比较陌生，如你所知JS是一门只支持单继承的语言，这就导致一个问题：如果想要为一个类及其子类封装多个功能，只能通过多次继承或全部写在父类中来实现。虽然可以勉强解决问题，但前者在类定义时，将不得不定义大量的中间类，并且需要手动维护每个中间类之间父子关系，这样就又导致了封装好的类难以复用；后者则会导致不需要相应功能的子类继承到了无用功能。此时“混入类”这个概念就派上用场了。

> [MDN中对于“类的Mix-ins / 混入”的介绍](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Classes#mix-ins_%E6%B7%B7%E5%85%A5)

如果你使用过Vue或React的话应该会发现，他们都有一个“混入”的概念，可以参考[Vue的Mixins API](https://cn.vuejs.org/v2/api/#mixins)和[React的Mixins API](https://zh-hans.reactjs.org/docs/react-without-es6.html#mixins)（不过很遗憾这两个库目前都不推荐在应用代码中使用混入API了，因为被认为大多数情况会降低可维护性，这是只是举例便于理解）。混入实际上就是将一组封装好的功能类附加到了被混入的类上，并且“即插即用”。

## 开始

> 由于混入类在稍复杂的应用形式下（例如某混入类依赖其他多个混入类），会导致JS自动的类型推断失效，所以我下面都会使用TS来书写，实际上JS也完全没问题。

假设这是一个UI组件类，现在要通过一个能检测组件可见性的外部库，为这个组件类添加两个相关钩子。
``` ts
class ViewComponent {
  onCreate() {}
  onDispose() {}

  // 此处为ts的语法糖，等同于声明了一个私有成员，并在构造函数中赋值
  constructor(private name: string) {}  
}

// 假设这是一个可以监听组件可见性的外部库
class ViewVisibleObserver {
  constructor(context) {}
  addHandler(handler) {}
  removeHandler() {}
  destroy() {}
}
```
如果要想为`ViewComponent`增加检测自身可见性的功能，在已经有封装好的库的情况下，至少还需要：
* 一个用于存储`ViewVisibleObserver`实例的变量
* 注册监听处理函数的逻辑
* 在组件销毁时同时销毁`ViewVisibleObserver`实例的逻辑
然而这些逻辑在不使用混入类的情况下，只能通过继承。如上述所言，假设还有更多要增加的功能，会导致难以使用等诸多问题。

下面是混入类的声明。假设混入类`MixinLeaveOnScreenAware`为被混入类提供`onHide`和`onShow`两个钩子。

``` ts
const MixinLeaveOnScreenAware = (C: typeof ViewComponent) => class extends C {
  #screenVisibleObserver = new ViewVisibleObserver(this)
  onHide() {}
  onShow() {}
  
  onCreate() {
    super.onCreate()  // 重写的方法不要忘记调用父类上的同名方法哦~
    this.#screenVisibleObserver.addHandler(visible => visible ? this.onShow() : this.onHide())
  }

  onDispose() {
    super.onCreate()
    this.#screenVisibleObserver.destroy()
  }
}
```

可以看到，虽然称作“类”，但实际上是一个**返回了继承后的类的函数**。接下来是混入类的使用。

``` ts
// 注意这里的写法，将要混入的类以类似函数调用的形式，被混入类作为参数传入
// 参数是要继承的类，如有多个要混入的类，可以继续以洋葱的形式嵌套，例如MixinB( MixinA( ViewComponent ) )
class HeaderView extends MixinLeaveOnScreenAware(ViewComponent) {
  constructor(
    public title: string
  ) {
    super('headerView')  // 在编辑器中可以发现，即使不用TS，包括调用父类构造函数时类型推断也都是正常的
  }
  
  onCreate() {
    super.onCreate()
    console.log('create')
  }

  onShow() {
    super.onShow()
    console.log('show')
  }
}

const headerView = new HeaderView('首页')
```
从`extands`后的写法可以看出，JS的`extends`关键字实际上类似一个操作符，后面无论什么是内容，只要返回的是一个类即可。这也得益于JS可以将class本身当作参数来传递。

另外可能有的小伙伴已经想到了，使用装饰器同样也是可以实现得非常优雅，但有装饰器有一些问题：
* JS原生还不支持装饰器，需要引入额外的语法转换处理才能使用
* 装饰器模式原则上不改变类的接口结构。也就是说混入了什么新变量或者新方法，都不会在自动的类型推断中反映出来（虽然不影响使用，但不优雅啊&gt;_&lt;，另外TS也会报错）。

## 进阶与类型支持

### 优化洋葱写法
在使用多个混入类时，洋葱写法会变得非常难看，可以实现一个`mixins`函数将洋葱写法扁平化。

``` js
function mixins(C, ...mixinClasses) {
  return mixinClasses.reduce((result, mixinClass) => mixinClass(result), C)
}

// 假设再实现一个在组件恢复显示时复原滚动条进度的混入类，该类依赖MixinLeaveOnScreenAware
const MixinScrollRestorableOnVisibleChanged = (Base) => class extends Base {
  #scrollValue = 0

  onShow() {
    super.onShow()
    this.restoreScrollPosition()
  }

  onHide() {
    super.onHide()
    this.saveScrollPosition()
  }

  restoreScrollPosition() {}

  saveScrollPosition() {
    this.#scrollValue = 100
  }
}

// 使用
class FooterView extends mixins(ViewComponent,
  MixinLeaveOnScreenAware,  // 由于MixinScrollRestorableOnVisibleChanged依赖该混合类，所以必须先混入
  MixinScrollRestorableOnVisibleChanged
) { 
  constructor() {
    super('footerView')
  }
}

const footerView = new FooterView()
```

### TS下的类型支持准备

可能需要一些TS相关知识。首先声明5个工具类型。

``` ts
// 通用的类模型类型
type ClassModel<Args extends any[] = any[], Return = any> = new (...args: Args) => Return
// 混入类
type MixinClass = (C: ClassModel) => ClassModel
// 被混入类
type MixinClassBase<T extends ClassModel, U extends MixinClass[]> = ClassModel<ConstructorParameters<T>, CombineMixinClassInstanceTupleType<U>>

// 这两个类型用于递归得出使用的全部混入类实例的交叉类型，原理见文章最下方的“参见”章节的“深入理解 TypeScript 高级用法”
type ShiftAction<T extends any[]> = ((...args: T) => any) extends ((arg1: any, ...rest: infer R) => any) ? R : never
type CombineMixinClassInstanceTupleType<T extends MixinClass[], E = {}> = {
  1: E,
  0: CombineMixinClassInstanceTupleType<ShiftAction<T>, E & InstanceType<ReturnType<T[0]>>>
}[T extends [] ? 1 : 0]
```

### 类型支持的`mixins`函数

注意：`mixins`函数只能提供构造函数参数及最终实例的类型支持，对于混入类所需的顺序没办法限制。例如`MixinB`依赖`MixinA`，此时必须先混入A再混入B，像是Dart等原生支持混入类的语言，混入顺序不对时在编码阶段就会提示。

``` ts
function mixins<T extends ClassModel, U extends MixinClass[]>(C: T, ...mixinClasses: U)
    : ClassModel<ConstructorParameters<T>, CombineMixinClassInstanceTupleType<U>> {
  return mixinClasses.reduce((result, mixinClass) => mixinClass(result), C as any)
}
```

### 类型支持的混入类

``` ts
const MixinScrollRestorableOnVisibleChanged = (
  // 注意这里的写法，第一个泛型传入被混合类，第二个泛型传入一个由全部要使用的混合类组成的元组
  Base: MixinClassBase<typeof ViewComponent, [
    typeof MixinLeaveOnScreenAware,
  ]>
) => class extends Base {
  #scrollValue = 0

  onShow() {
    super.onShow()
    this.restoreScrollPosition()
  }

  onHide() {
    super.onHide()
    this.saveScrollPosition()
  }

  restoreScrollPosition() {}

  saveScrollPosition() {
    this.#scrollValue = 100
  }
}

// 使用
class FooterView extends mixins(ViewComponent,
  MixinLeaveOnScreenAware,
  MixinScrollRestorableOnVisibleChanged
) { 
  constructor() {
    super('footerView')
  }
}

const footerView = new FooterView()
```

## 缺陷

* 难以分辨哪些实例成员是混入类添加的，又是哪个特定混入类添加的。不过这是类似模式的通病，例如React + Redux，会向`props`注入内容，当注入的来源过多时也会出现类似问题。可以通过特殊的命名等方式解决。
* 混入类在依赖其他混入类的情况下，顺序没有约束的手段

## 总结

`extends`关键字后可以跟任意返回class的表达式，这一点令我十分震惊，也是JS混入类实现的必要条件。我也是最近偶然中在MDN上看到的，本质上来说是实现了一种更灵活的继承方式。相信随着Vue3.0、AngularJS等以class为基础的框架，以及Web Component的发展，混入类一定会在其中占有一席之地，这是我一次在掘金上发布文章，如有错误之处，欢迎大家指出。

## 参见
* [MDN中对于类的Mix-ins / 混入的介绍](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Classes#mix-ins_%E6%B7%B7%E5%85%A5)
* [# 【万字长文】深入理解 TypeScript 高级用法](https://zhuanlan.zhihu.com/p/136254808)