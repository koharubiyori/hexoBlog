---
title: JavaScript与设计模式
date: 2020-12-08 13:19:42
tags: JavaScript
image: https://bn1302files.storage.live.com/y4m9gaahPckV5jMBDqDwycshQYSxZJCvR5ZszVbyhz0qyAfvL5N0LEQ7Hp4oqFOxThuR0w3pj5r-ywa4yhvw4Y1fIo8BMKVr_uJ1e10nCFoBf3iyFBs5BVaitEEkg2j443oGQkYMso9LZ13caYVEwUY5PuU6ZgGmWiW9ulQWvYlZAb_BuDUN4k5xl0HdEDtTJuL?width=1024&height=593&cropmode=none
excerpt: 算是《JavaScript设计模式》与开发实践的读书总结吧。
---

图片来源：[pixiv:5話 中 - かばんちゃん 作者：ながめる](https://www.pixiv.net/artworks/73216328)

## 前言

这篇文章算是《JavaScript设计模式与开发实践》的读书总结吧，如果大家对这本书感兴趣也请购买实体书支持作者。

书拿到手之后用了一个礼拜的时间读了一遍。怎么说呢，在实际开发上能真正用到设计模式的机会不多（也可能我做的项目规模都太小了），但个人认为这本书对于代码封装的思维还是有提升的，也明白了js语言以及热门框架中的一些设计实际上就利用了设计模式，总体来说还是不错的。

## 什么是设计模式

> 在软件工程中，设计模式（design pattern）是对软件设计中普遍存在（反复出现）的各种问题，所提出的解决方案。 ———— 摘自维基百科

将设计模式这一概念真正发扬并广泛使用的推动者是Erich Gamma、Richard
 Helm、Ralph Johnson以及John Vlissides共同编写的《设计模式：可复用面向对象软件的基础》，这本书中一共收录了Java语言中常用的23种设计模式。

### 23种设计模式 vs 14种设计模式

《设计模式》中有23种设计模式，而《JavaScript设计模式与开发实践》中只有14种设计模式，原因有一点在于，设计模式是为了解决语言本身的缺陷，《设计模式》中存在一些专为解决Java语言中的问题而提出的设计模式，有些特性在一些语言中是已经存在的，所以只列出的14种。同时，设计模式也不是一成不变的，将来也会出现更多更好的设计模式，而不适合的设计模式也将被淘汰。

## 设计模式六大原则

### 单一职责原则

一个类或函数应该只负责一件事，并且A不影响B，B不影响A。

### 里氏替换原则

- 所有引用基类的地方都可以透明的使用其子类的对象。

具体来说就是：

- 子类必须实现父类的抽象方法，但不得重写父类的非抽象(已实现的)方法。
- 子类中可增加自己特有的方法。(可以随时扩展)
- 当子类覆盖或者实现父类的方法时,方法的前置条件(方法形参)要比父类输入参数更加宽松。否则会调用到父类的方法。
- 当子类的方法实现父类的抽象方法时，方法的后置条件（即方法的返回值）要比父类更严格。否则会调用到父类的方法。

### 依赖倒置原则

- 高层模块不应该依赖底层模块，两者都应该依赖其抽象。
- 抽象不应该依赖细节。
- 细节应该依赖抽象。

高层模块和底层模块：每一个逻辑的实现都是由原子逻辑组成的，不可分割的原子逻辑就是底层模块，原子逻辑的再组装就是高层模块。

具体来说就是：
- 模块间的依赖是通过抽象发生，实现类之间不发生直接的依赖关系，其依赖关系是通过接口或抽象类产生的。
- 接口或抽象类不依赖于实现类。
- 实现类依赖接口或抽象类。

### 接口隔离原则

- 客户端不应该依赖它不需要的接口。
- 类间的依赖关系应该建立在最小的接口上。

具体来说就是：
- 要细化接口，通过小接口的组合实现功能。

### 迪米特原则/最少知识原则/最少知道原则

- 一个对象应该对其他对象有最少的了解。

可以看作是：'高内聚，低耦合'中的'低耦合'。

具体来说就是：
- 一个对象应该尽量少的去引用 不属于自身对象的东西(或者说从方法中传来的参数对象上的方法)。
- 一个对象应该尽可能少去和其他对象产生关联
- 一个对象对外暴露的接口应该尽量少，或者说不要暴露无用的接口。

但同时，少引用不属于自己的东西，就会降低内聚。在这一点上应该做出权衡。

### 开放-封闭原则

- 对扩展是开放的，对修改是封闭的。

也就是说，一个类或函数，尽量通过足够的参数，对外的扩展性来实现不同的功能，而不是去修改其本身的代码。

## 单例模式

如其名，单例模式全局只使用一个实例。
例如一个登录的login窗口，只可能显示一个，这时我们使用单例模式就是最适合的。

同时，考虑到性能方面，也可以使用惰性单例，指在第一次调用时再创建这个单例，而不是在加载时创建。

``` js
// 一个惰性单例的栗子
function getSingle() {
  let obj = null
  return () => {
    if (obj === null) {
      obj = {}
    }

    return obj
  }
}

// 这里实现一个简单的惰性单例构造器
function createLazySingleGetter(createInstanceFn) {
  let obj = null

  return () => {
    return obj || (obj = createInstanceFn())
  }
}

let getSingleArray = createLazySingleGetter(() => [1, 2, 3])

getSingleArray().push(4)
getSingleArray().push(5)

console.log(getSingleArray())   // 可以看到以上这3次获取到的都是同一实例
```

## 策略模式

策略模式的主要思想就是：将一组可以互相替换的算法(或者说操作)，封装在一起，之后由一个上下文进行调用，并返回结果。

``` js
// 这里使用策略模式实现一个简单的表单字段验证器
class FormValidator {
  constructor() {
    this.checkItems = []
  }

  // 验证函数，这里就是所谓的可以互换的“策略”
  static get rules() {
    return {
      nonEmpty({ value }) {
        return value.trim().length !== ''
      },
    
      minLength({ value, length }) {
        return value.trim().length >= length 
      },
    
      validPassword({ value }) {
        return value.trim().length > 7
      }
    }
  }

  // 添加验证项
  add(value, rule, options) {
    this.checkItems.push({ value, rule, options })
  }

  // 执行验证
  check() {
    let results = this.checkItems.map(item => {
      return {
        value: item.value,
        result: FormValidator.rules[item.rule]({ value: item.value, ...item.options })
      }
    })

    return results
  }

  // 执行验证，返回简单结果
  simpleCheck() {
    let hasInvalid = this.check().map(item => item.result).includes(false)
    return !hasInvalid
  }
}

let formValidator = new FormValidator()
formValidator.add('123', 'nonEmpty')
formValidator.add('123', 'minLength', { length: 5 })
formValidator.add('123', 'validPassword')

console.log(formValidator.check())
console.log(formValidator.simpleCheck())
```

## 代理模式

如其名，代理模式就是代理一个对象的访问。
**代理层本身要保证和被代理的对象接口一致。**

在这个代理层中，我们可以做很多事情，来保证单一职责原则。例如：

- 检测是否运行执行某个操作
- 为复杂计算或网络请求提供缓存
- 使用惰性加载
- 收集访问请求进行延时计算
等等各种操作

**在使用时，要考虑对象是否需要代理，在需要时添加也不迟。“如无必要，勿增实体。”**

- 其他注意
  - 保证被代理的类是单独可用的
  - 代理类要依赖被代理的类，而不是自己去实现一套逻辑
  - 不止是类，函数也可以代理

``` js
// 模拟一个网络请求
let request = (listName) => {
  const data = {
    listA: [1, 2, 3],
    listB: [4, 5, 6],
    listC: [7, 8, 9]
  }

  return new Promise(resolve => 
    setTimeout(() => resolve(data[listName]), 3000)
  )
}

// 这里实现一个获取网络数据并可以打印的类
class AsyncDataPrinter {  
  constructor() {
    this.list = null
  }
  
  async loadData(listName) {
    let data = await request(listName)
    this.list = data
    
    return data
  }

  setData(data) {
    this.list = data
  }

  print() {
    if (this.list === null) return false
    console.log(this.list.join())
  }
}

// 实现AsyncDataPrinter的缓存代理
class ProxyAsyncDataPrinter {   // 使用ts的话这里可以实现一下AsyncDataPrinter(implements AsyncDataPrinter)，保证接口一致
  constructor() {
    this._cache = new Map()    // 假设这是一个私有成员
    this._asyncDataPrinter = new AsyncDataPrinter()   // 一般情况下，代理类中会有一个被代理类的实例
  }

  async loadData(listName) {
    return new Promise(resolve => {
      if (this._cache.has(listName)) {
        let data = this._cache.get(listName)
        this._asyncDataPrinter.setData(data)
        resolve(data)        
      } else {
        resolve(this._asyncDataPrinter.loadData(listName))
      }
    })
  }

  setData(data) {
    this._asyncDataPrinter.setData(data)
  }

  print() {
    return this._asyncDataPrinter.print()
  }
}

let asyncDataPrinter = new ProxyAsyncDataPrinter()
asyncDataPrinter.loadData('listA')    // 这里将等待3秒
  .then(() => asyncDataPrinter.print())

asyncDataPrinter.loadData('listA')    // 这里会使用缓存，直接打印出数据
  .then(() => asyncDataPrinter.print())
```

可以看到，上面例子中的类名是ProxyXXX。用户根本不知道为什么前面要有Proxy，也没有必要知道。这里有两种方法解决：
1. 在模块系统下，对导出进行重命名，如：`export const AsyncDataPrinter = ProxyAsyncDataPrinter`，同时重命名被代理类，以避免类名重复，例如前面加上一个下划线等
2. 将被代理类赋给一个let变量，再将被代理类赋给代理类，这样就保证了代理的同时类名一致

注意：这两种方法在打印constructor时都会显示真正的类名(ProxyAsyncDataPrinter)，除非手动修改constructor指向。

``` js
// 这里演示了使用let变量，覆盖被代理类的操作
let Abc = class Abc {
  constructor() {
    this.info = 'abc'
  }
}

Abc = (function(Abc) {    // 通过一个闭包，保证访问到的是被代理类，而不是自己（因为构造函数是在new时运行的，这时Abc的值已经是被代理类，如果不使用闭包将导致无限递归引用）
  return class ProxyAbc {
    constructor() {
      this.info = 'proxyAbc'
      this.abc = new Abc()
    }
  }
})(Abc)
```

## 装饰者模式

装饰者模式指在不影响原函数的情况下动态地为一个函数添加行为，从而使功能间解耦。
例如可以修改一个函数接收到的参数，为函数添加一些其他功能，甚至直接返回一个新函数。

装饰者模式和代理模式的异同：
- 都要求保持接口一致
- 代理模式倾向于控制被代理对象的访问，装饰者模式倾向于为被装饰函数添加行为
- 代理在声明时就被定下来的，装饰者是可以动态添加的。

``` js
// 使用装饰者模式实现统计一个按钮的点击次数
let pressButton = function() {
  console.log('点击了按钮')
}

class PressCounter {
  constructor() {
    this.total = 0
  }

  increment() {
    this.total++
    console.log('计数+1')
  }

  get() {
    return this.total
  }
}

function after(fn, afterFn) {
  return (...args) => {
    fn(args)
    afterFn(args)
  }
}

let pressCounter = new PressCounter()

pressButton = after(
  pressButton, 
  () => pressCounter.increment()
)

pressButton()
pressButton()
pressButton()
```

## 迭代器模式

迭代器非常简单，`array.forEach`就是一个典型的迭代器。
迭代器分为内部迭代器和外部迭代器。
举例来说：
`array.forEach`是一个内部迭代器。
迭代器函数(function*, yield)的返回值是一个外部迭代器。

内部迭代器一个典型的缺点是无法控制迭代流程，不过使用上相对简单。
在需要多层迭代循环时，外部迭代器能使逻辑变得清晰，避免多层回调。
外部迭代器也可以实现惰性计算，每次调用next时计算，而不是一次性全部计算完毕。

一个符合规范js的迭代器必须实现[迭代器协议](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Iteration_protocols#iterator)。

``` js
// 实现一个类似$.each的内部迭代器
function forEach(arr, callbackFn) {
  for(let i, len=arr.length; i < len; i++) {
    let isWantBreak = !callbackFn.call(arr[i], arr[i], i)
    if (isWantBreak) break
  }
}

// 实现一个外部迭代器
class Iterator {
  constructor(arr) {
    this.arr = arr
    this.current = 0
  }

  next() {
    let currentValue = undefined
    if (this.current < this.arr.length) {
      currentValue = this.arr[this.current]
      this.current++
    }

    return {
      value: currentValue,
      done: this.isDone()
    }
  }

  isDone() {
    return this.current === this.arr.length
  }
}

let numberIterator = new Iterator([1, 2, 3])
console.log(numberIterator.next())
console.log(numberIterator.next())
console.log(numberIterator.next())  // { value: 3, done: true }
console.log(numberIterator.next())  // { value: undefined, done: true }

// 一个使用迭代器语法生成的外部迭代器
function* createNumberRangeIterator(begin, end) {
  for(let i=begin; i < end; i++) {
    yield i
  }
}

const tenIterator = createNumberRangeIterator(0, 10)

console.log(tenIterator.next())
console.log(tenIterator.next())
console.log(tenIterator.next())   // { value: 2, done: false }
```

## 发布-订阅模式

发布-订阅模式又称为观察者模式，是指观察者通过注册一个函数，发布者在合适的时机去遍历执行数个观察者注册的函数。
`addEventListener`就是一个典型的观察者模式。

观察者模式可以在两个封装起来的模块之间通信，降低耦合。
缺点：
  - 当事件太多时，如果没有文档将导致不清楚每个事件的作用。
  - 当事件太多时，会搞不清模块之间的联系。

在使用观察者模式时会有一种情况：触发了一个没有任何观察者的事件，如果不做额外的处理，这个事件的信息就会丢失。
可以通过一个缓存来将未触发的事件保存起来，当注册了第一个观察者后，就遍历这个缓存一次性触发之前缓存的事件。
不局限于之前提到的这个模式，也可以每次注册观察者，都集中触发一遍之前的事件，等等。RxJs就是一个提供了各种观察者模式的库。

``` js
// 实现一个简单的观察者类
class Event {
  constructor() {
    this.clientList = {}
  }

  listen(eventName, handler) {
    if (this.clientList[eventName] === undefined) this.clientList[eventName] = []
    this.clientList[eventName].push(handler)
  }

  trigger(eventName, ...args) {
    if (this.clientList[eventName] === undefined) return false
    this.clientList[eventName].forEach(handler => handler(...args))
    return true
  }

  // 这里使用的是通过传入注册监听时的回调函数，来取消一个监听
  // 实际上更好用的的做法是在listen中返回一个key，然后可以在remove中传入这个key来取消监听。
  // 一般来说这个key可以使用自增数字或者Symbol，并且在push到clientList时和handler保存在一起
  remove(eventName, handler) {
    if (this.clientList[eventName] === undefined) return false
    let index = this.clientList[eventName].indexOf(handler)
    this.clientList[eventName].splice(index, 1)
    return true
  }
}

let event1 = new Event()

event1.listen('abc', msg => console.log(1, msg))
event1.listen('abc', msg => console.log(2, msg))

let handler3 = msg => console.log(3, msg)
event1.listen('abc', handler3)
event1.remove('abc', handler3)

event1.trigger('abc', 123)
console.log(true)
```

## 命令模式

命令模式指将要调用的对象封装，然后通过这个封装来使用这个对象。
可以看出命令模式类似于代理模式，但命令模式不要求与被封装对象接口相同，相反，命令模式要将使用被封装对象的数个操作合并为一个，供客户端使用。
一般一个命令模式的对象应该有这些属性(但不局限于这些属性)：
``` 
{
  receiver(接收者): 被封装对象，提供了各种原子操作,
  execute: 封装后供客户端调用的函数,
  undo: 与execute相反的操作，或者是清理的操作,
}
```


与代理模式的异同：
- 都对一个对象进行封装。
- 都是面向客户端的。
- 命令模式不要求和被封装对象的接口相同(实际上也不可能相同)。
- 命令模式关注的是一个功能的实现及撤销(或清理)，代理模式关注的是如何在不影响对外接口的情况下执行一些其他操作。

如果要一次性执行多个命令，也可以实现一个宏命令类，将数个命令放到一个数组，遍历执行他们的execute方法和undo方法。

``` js
// 使用命令模式来向document添加一个每秒显示的数字加1的div，并且为每次创建的div添加编号
const myDoc = {   // 这里模拟一个document对象
  body: {
    appendChild(node) {
      console.log(`添加了${node.name}标签！`)
    },

    removeChild(node) {
      console.log(`删除了${node.name}标签！`)
    }
  },

  createElement(elementName) {
    return {
      name: elementName,
      textContent: ''
    }
  },
}

// 实现一个自增div类，该类的实例就是我们例子中的receiver(接收者)
class IncrementNumElement {
  constructor(elementName) {
    this.node = myDoc.createElement(elementName)
    this.count = 0
    this.intervalKey = 0
  }

  appendTo(doc) {
    doc.body.appendChild(this.node)
  }

  removeForm(doc) {
    doc.body.removeChild(this.node)
  }

  startIncrement() {
    this.intervalKey = setInterval(() => {
      this.node.textContent = ++this.count
      console.log(`${this.node.name}节点上的数字增加了，目前是${this.count}`)
    }, 1000)
  }

  stopIncrement() {
    clearInterval(this.intervalKey)
  }
}

// 实现命令类
class AppendIncrementNumElementCommand {    // 注意这里的命名，命令模式关注的是一个动作
  constructor(incrementElement, doc) {
    this.receiver = incrementElement
    this.doc = doc   // 注意：命令类中的属性是服务于动作本身的，而不是服务于动作所产生的结果的(比如由动作产生的实例)
  }

  execute() {
    this.receiver.appendTo(this.doc)
    this.receiver.startIncrement()
  }

  undo() {
    this.receiver.stopIncrement()
    this.receiver.removeForm(this.doc)
  }
}

let incrementElement = new IncrementNumElement('div')
let appendIncrementNumElementCommand = new AppendIncrementNumElementCommand(incrementElement, myDoc)
appendIncrementNumElementCommand.execute()
setTimeout(() => appendIncrementNumElementCommand.undo(), 3500)

```

## 模板方法模式

模版方法模式指子类通过继承一个抽象父类，抽象父类提供多个“填空”，并组织这些填空的执行逻辑，由子类对填空进行具体实现。
Vue就是典型的模板方法模式。

由于js没有抽象类的概念，只能用一个实现类来模拟。

``` js
// 实现一个简单的React.Component类
class Component {
  constructor() {
    
  }

  componentWillMount() {}
  componentDidMount() {}

  render() {
    throw new Error('render方法必须实现！')
  }

  init() {
    this.componentWillMount()
    this.componentDidMount()
    this.render()
  }
}

class App extends Component {
  constructor() {
    super()
  }

  componentWillMount() {
    console.log('will mount')
  }

  componentDidMount() {
    console.log('did mount')
  }
}

let app = new App()
app.init()    // 前两个钩子会执行，因为没实现render方法，最后将报错
```

## 适配器模式

简单的说就是：如果我们的数据有多个数据源，这些数据源如果返回的数据格式不一致的话，可以写几个格式转换器将其改为符合我们需要的格式。

## 享元模式

享元模式指通过把一个对象分为外部状态和内部状态，通过在使用时将内部状态和外部状态拼装，利用最少的实例实现功能。
- 内部状态：不变的状态
- 外部状态：变化的状态
享元模式的内外状态的组成有些类似js的原型链和对象本身属性。根本的思路还是共享不变的部分。

享元模式是用来提高性能的模式。但同时，使用设计模式也会增加程序的复杂性，所以可以等遇到性能问题时再去使用。

``` js
// 使用享元模式结合原型链模拟一个文件上传系统
/*
  假设可以上传两种文件：1.jpg, 2.png
  上传的文件对象为：{
    type: 文件类型,     // 这个字段是要作为元中的属性
    name: 文件名,
    fileSize: 文件大小,
    id: 一次上传的文件唯一id
  }
*/
const pool = {}   // 存放Upload的实例
class UploadFlyweight {    // 以upload实例为元
  constructor(type) {
    this.type = type    // 可以看出文件对象集合中type字段一定是重复最多的
  }

  static create(type) {
    if (type in pool) {
      return pool[type]
    } else {
      return pool[type] = new UploadFlyweight(type)
    }
  }

  // 还可以添加一些共享方法
}

// 实现上传器
class UploadManager {
  constructor() {
    this.extDatabase = {}   // 存储外部数据
    this.incrementId = 0
  }

  add(type, name, fileSize) {
    let upload = UploadFlyweight.create(type)
    let file = Object.create(upload)    // 在java中没有原型链，就需要将元的引用放在一个属性上，然后在获取时进行合并。而在js中利用原型链得到了天然的对象混合，且不占用额外空间
    let id = this.incrementId++

    file.name = name
    file.id = id
    file.fileSize = fileSize

    this.extDatabase[id] = file
  }

  execute() {
    console.log(this.extDatabase)
  }
}

let uploadManager = new UploadManager()
uploadManager.add('jpg', 'haha', 1000)
uploadManager.add('png', 'lee', 2000)
uploadManager.add('png', 'wang', 3000)

uploadManager.execute()
```

### 享元模式-对象池

指当删除一个对象时，不去真正的删除，而是将其移到对象池中。
当要创建一个新的对象时，如果对象池中存在内部状态相同的对象，则可以将其取出重用，从而避免了重新创建对象带来的性能损耗

``` js
// 使用对象池模拟实现一个五子棋游戏
class WuZiQi {
  constructor() {
    this.board = []
    this.piecesPool = []
  }

  static get Pieces() {
    return class WuZiQiPieces {
      constructor(maker, isBlack, x, y) {
        this.maker = maker
        this.isBlack = isBlack
        this.x = x
        this.y = y
      }

      getMaker() {
        return this.maker
      }
    }
  }

  pushPieces(maker, isBlack, x, y) {
    let pieces = null
    if (this.piecesPool.length !== 0) {
      pieces = this.piecesPool.pop()
      // 这里看起来虽然没什么卵用，但表达了对象池的思想（取出可以重用的对象，然后根据需要修改外部状态）
      pieces.maker = maker
      pieces.isBlack = isBlack
      pieces.x = x
      pieces.y = y

    } else {
      pieces = new WuZiQi.Pieces(maker, isBlack, x, y)  
    }

    this.board.push(pieces)
  }

  popPieces() {
    let pieces = this.board.pop()
    this.piecesPool.push(pieces)
  }
}

```

## 职责链模式

职责链模式指一个请求，可以被依次传递到多个实体，直到有可以处理这个请求的实体，并返回处理结果。
像是Vue中的全局路由守卫，koa-router，就包含了职责链模式的思想。

``` js
// 实现一个同步职责链处理程序
class LinkedTask {
  constructor(fn) {
    this.fn = fn
    this.nextTask = null
  }

  after(afterFn) {
    // 循环找到责任链的尾部，添加任务
    let currentTask = this
    while (currentTask.nextTask !== null) {
      currentTask = currentTask.nextTask
    }
    
    currentTask.nextTask = new LinkedTask(afterFn)
    return this
  }

  execute(...args) {
    // 使用一个类实例便于判断是否需要next或者返回处理结果
    // 不使用字面量对象的原因是防止自定义next对象结构和处理结果的结构撞车
    let next = isRequireNext => new LinkedTask.Next(isRequireNext)    
    
    let result = this.fn(next, args)
    // 如果result是Next实例，则代表需要进入下一个task
    if (result instanceof LinkedTask.Next) return this.nextTask.execute(...args)
    return result
  }
}

LinkedTask.Next = class LinkedTaskNext {
  constructor(isRequireNext) {
    this.value = isRequireNext 
  }
}

function task1(next, val) {
  if (val > 10) return next(true)
  return 'task1'
}

function task2(next, val) {
  if (val > 100) return next(true)
  return 'task2'
}

// 职责链的尾部要有一个必定返回结果的函数
function task3(next, val) {
  return 'task3'
}

let task = new LinkedTask(task1).after(task2).after(task3)
console.log(task.execute(1))
console.log(task.execute(11))
console.log(task.execute(101))
```

## 中介者模式

中介者(Director)模式指利用一个中介对象和数个对象建立关系，这数个对象只依赖这一中介对象产生联系，从而避免多个对象之间通过错综复杂的联系进行通信。

中介者对象通常暴露一些接口与其他对象通信，或者使用观察者模式。

``` js
// 利用中介者模式模拟联系人打电话及收发短信
class Contacts {
  constructor(name, phone) {
    this.name = name
    this.phone = phone
    this.provider = null  // 服务提供者，也就是例子中的中介者
  }

  // 打电话，一次只能由一个人打给另一个人
  call(targetName) {
    this.provider.callTo(this, targetName)
  }

  // 发短信，短信可以群发
  sendMsg(targetNames, msg) {
    this.provider.sendMsg(this, targetNames, msg)
  }

  // 接电话
  callForm(contacts) {
    console.log(`${this.name}收到了来自${contacts.name}的电话！`)
  }

  // 接短信
  receiveMsg(contacts, msg) {
    console.log(`${this.name}收到了来自${contacts.name}的信息：${msg}`)
  }
}

// 联系人中介者对象
class ContactsDirector {
  constructor() {
    this.contactsList = {}
    // 新建一个系统帐号，用于给所有人发送广播
    this.systemContacts = new Contacts('system', 10010)
  }

  add(contacts) {
    contacts.provider = this    // 添加服务提供者(该中介对象)
    this.contactsList[contacts.name] = contacts
  }

  remove(contacts) {
    delete this.contactsList[contacts.name]
  }

  // 打电话
  callTo(contacts, targetName) {
    this.contactsList[targetName].callForm(contacts)
  }

  // 发短信
  sendMsg(contacts, targetNames, msg) {
    targetNames.forEach(targetName => this.contactsList[targetName].receiveMsg(contacts, msg))
  }

  // 发广播
  broadcast(msg) {
    Object.values(this.contactsList).forEach(contacts => contacts.receiveMsg(this.systemContacts, msg))
  }
}

const wang = new Contacts('wang', 111111)
const li = new Contacts('li', 222222)
const zhang = new Contacts('zhang', 333333)

const contactsDirector = new ContactsDirector()
contactsDirector.add(wang)
contactsDirector.add(li)
contactsDirector.add(zhang)

wang.call('li')
li.sendMsg(['wang', 'zhang'], 'haha')

contactsDirector.broadcast('欢迎使用联系人服务！')
```

## 状态模式

状态模式指将一组相关联的属性(状态)和函数(行为)封装在一起成为一个状态类(对象)，保存在客户端类中，客户端类不做具体实现，只要负责设置状态对象即可。

状态类要求接口统一，这些状态类会在客户端类中实例化，并且保存客户端实例的引用。

如果类包含的状态对象之间可以自动过渡到下一个状态，就可以将这个类称之为'状态自动机'。

``` js
/*
  利用状态模式模拟文件上传。
  假设每个文件有两种操作：
  - 1.暂停
  - 2.取消上传

  文件上传有5种状态：
  - 1.扫描文件，计算md5，这时不能点击暂停，但可以取消。if 服务器上有这个文件 then 上传完成 else 上传中
  - 2.上传中，这时暂停和取消都可以点击。
    if 上传完毕 then 上传完成；
    if 点击暂停 then 暂停；
    if 取消上传 then 上传取消；
  - 3.暂停，这时取消可以点击，暂停变为继续。
  - 4.上传完成，取消可以点击。
  - 5.上传取消，等待销毁文件对象。
*/
class File {
  constructor(name, size, id) {
    // 文件信息属性
    this.name = name
    this.size = size
    this.id = id

    // 状态类实例
    this.states = {
      scanning: new FileScanningState(this),
      uploading: new FileUploadingState(this),
      pause: new FilePauseState(this),
      uploaded: new FileUploadedState(this),
      cancelled: new FileCancelledState(this)
    }

    this.currentState = this.states.scanning
    // this.stateObserver = Observer    // 可以添加一个观察者字段，用于监听状态的变化
  }

  setState(newState) {
    this.currentState = newState
  }

  async start() {
    console.log('开始扫描')
    let scanResult = await this.scan()
    if (scanResult === false) { return }
    console.log('扫描完毕')

    console.log('开始上传')
    let uploadResult = await this.upload()
    if (uploadResult) {
      console.log('上传完毕')
    } else {
      console.log('上传失败')
    }
  }

  scan() {
    this.setState(this.states.scanning)
    
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(true)
      }, 2000)
    })
  }

  upload() {
    this.setState(this.states.uploading)
    
    return new Promise(resolve => {
      // 这里有个问题，上传函数不知道用户把上传取消了，还要等待上传结束后才判断用户是否之前取消了上传
      setTimeout(() => {
        if (this.currentState instanceof FileUploadingState) {
          this.setState(this.states.uploaded)
          resolve(true)
        } else {
          resolve(false)
        }
      }, 10000)

      // 如果上面声明了用于监听状态的Observer，则可以监听状态是否变为了Cancelled，如果是则立即resolve(false)，并移除这个监听者
    })
  }
}

// 假设这是个抽象类。该抽象类负责将随状态变化的状态属性和方法抽象出来，作为状态模式的状态类。
class FileState {
  constructor(client) {
    this.client = null
    this.enabledPause = true
    this.enabledCancel = true
    this.enabledContinue = true
  }
  
  // 状态类通常携带的是回调函数
  onPauseButtonWasPressed() {}
  onContinueButtonWasPressed() {}
  onCancelButtonWasPressed() {}
}

class FileScanningState extends FileState {
  constructor(client) {
    super()
    this.client = client
    this.enabledPause = false
    this.enabledCancel = true
    this.enabledContinue = false
  }
  
  onPauseButtonWasPressed() {
    console.log('扫描过程中不能暂停')
  }

  onContinueButtonWasPressed() {
    throw new Error('尝试在扫描过程中调用UI上不显示的"继续"按钮API')
  }

  onCancelButtonWasPressed() {
    console.log('扫描过程被取消')
    this.client.setState(this.client.states.cancelled)
  }
}

class FileUploadingState extends FileState {
  constructor(client) {
    super()
    this.client = client
    this.enabledPause = true
    this.enabledCancel = true
    this.enabledContinue = false
  }

  onPauseButtonWasPressed() {
    console.log('上传过程被暂停')
    this.client.setState(this.client.states.pause)
  }

  onContinueButtonWasPressed() {
    throw new Error('尝试在上传过程中调用UI上不显示的"继续"按钮API')
  }

  onCancelButtonWasPressed() {
    console.log('上传过程被取消')
    this.client.setState(this.client.states.cancelled)
  }
}

class FilePauseState extends FileState {
  constructor(client) {
    super()
    this.client = client
    this.enabledPause = false
    this.enabledCancel = true
    this.enabledContinue = true
  }

  onPauseButtonWasPressed() {
    throw new Error('尝试在暂停中调用UI上不显示的"暂停"按钮API')
  }

  onContinueButtonWasPressed() {
    console.log('解除暂停，继续上传')
    this.client.setState(this.client.states.uploading)
  }

  onCancelButtonWasPressed() {
    console.log('上传过程被取消')
    this.client.setState(this.client.states.cancelledState)
  }
}

class FileUploadedState extends FileState {
  constructor(client) {
    super()
    this.client = client
    this.enabledPause = false
    this.enabledCancel = true
    this.enabledContinue = false
  }

  onPauseButtonWasPressed() {
    throw new Error('尝试在上传成功后继续调用"暂停"API')
  }

  onContinueButtonWasPressed() {
    throw new Error('尝试在上传成功后继续调用"继续"API')
  }

  onCancelButtonWasPressed() {
    console.log('文件上传成功后被删除')
    this.client.setState(this.client.states.cancelledState)
  }
}

class FileCancelledState extends FileState {
  constructor(client) {
    super()
    this.client = client
    this.enabledPause = false
    this.enabledCancel = false
    this.enabledContinue = false
  }

  onPauseButtonWasPressed() {
    throw new Error('尝试在取消上传后继续调用"暂停"API')
  }

  onContinueButtonWasPressed() {
    throw new Error('尝试在取消上传后继续调用"继续"API')
  }

  onCancelButtonWasPressed() {
    throw new Error('尝试在取消上传后继续调用"取消"API')
  }
}

let waitUploadFile = new File('hah', 10000, 1)
waitUploadFile.start()

// 模拟点击取消上传按钮
setTimeout(() => {
  waitUploadFile.currentState.onCancelButtonWasPressed()
}, 5000)
```

## 组合模式

组合模式是指一个或几个类，这些类的实例中还可以容纳同一类或其余的类的实例。
例如Vue就是典型的组合模式，每个组件都是一个Vue实例，Vue实例还可以包含Vue实例，最终构建出了一个复杂的系统。
组合模式最终形成了类似树的结构。

在遍历组合模式结构的对象时，一般是一个深度优先遍历的过程。但如果要改变这个流程，例如有时不需要全部遍历，只需要遍历部分，
这时可以给对象本身添加指向其他对象的字段，形成一个类似链表的结构，再进行遍历。

``` js
// 使用组合模式模拟文件系统
class Folder {
  constructor(name) {
    this.name = name
    this.files = []
    this.parent = null
  }

  add(file) {
    file.parent = this
    this.files.push(file)
  }

  remove() {
    if (this.parent === null) return false
    let index = this.parent.files.indexOf(this)
    this.parent.files.splice(index, 1)
    return true
  }

  scan() {
    let deepness = 0

    ;(function traversal(node){
      console.log(('  ').repeat(deepness), node.name)
      if ('files' in node) {
        deepness++
        node.files.forEach(traversal)
        deepness--
      }
    })(this)
  }
}

class File {
  constructor(name) {
    this.name = name
    this.parent = null
  }

  remove() {
    if (this.parent === null) return false
    let index = this.parent.files.indexOf(this)
    this.parent.files.splice(index, 1)
    return true
  }
}

let folder1 = new Folder('动漫')
let folder2 = new Folder('水星领航员第一季')
let folder3 = new Folder('SP')

folder1.add(folder2)
folder2.add(folder3)

folder2.add(new File('第一集'))
folder2.add(new File('第二集'))
folder2.add(new File('第三集'))

folder3.add(new File('SP1'))
folder3.add(new File('SP2'))

folder1.scan()

```