---
title: 在TypeScript的全局类型中使用模块导出的类型
date: 2020-08-24 13:04:52
tags: [TypeScript]
image: https://bn1302files.storage.live.com/y4m7Stf2DFHbz7UTWZ86rSMDle3qF8j3cVRcDlOXahMpXcnJPoapGVfGTA6TDctvrVHd3g2abx-MSqWj_m5M6VgVhx2--q1ezN9u8QBqCTveqR9TIbE7hM7YW72iYJlNQ84TMRTxbUEU_ZuOsOU99WjWZbPqqjCAMeBAh0JS6n5bGWRmth5cGqPl7pCSgIAhh3o?width=1024&height=553&cropmode=none
excerpt: 偶然中在看jQuery的.d.ts文件时发现了答案。
---

图片来源：[pixiv:チノちゃん。 作者：ふぇありぃあい](https://www.pixiv.net/artworks/79134582)

## 前言

在ts中定义一个全局类型很简单，只需要在.d.ts文件中的类型声明前加上`declare`关键字即可。这对于全局常量或者一些简单类型就已经足够，但如果我们要使用其他模块中的类型，这里就会出现点问题。ts我最喜欢的一点就是刚打出几个字母的光标前就会显示出一排的代码提示，点击后ts又会将对应的模块自动引入，目前为止一切都还很好。但是，如果在声明全局类型的文件中使用`import`关键字引入了其他模块中的类型，不到一秒就会发现：使用了这些全局类型的文件名全部变红————全局类型声明失效了。

原因在于，在一个.d.ts文件中引入了其他模块，就会使ts类型系统将其视为一个模块，导致其中的所有类型即使添加了`declare`关键字也不能直接全局使用，这里就需要一些额外的处理。

## 开始

先假设的全局变量类型定义文件名为`globals.d.ts`，目前有这样一个模块，导出了一个名为`Person`的接口：
``` ts
// myModule.ts
export interface Person {
  name: string
  age: number
}
```

假设要使用`Person`这个类型，这里就需要引入`myModule.ts`这个文件，问题是在哪里引入，如果在`globals.d.ts`引入，势必导致其中的全局类型声明全部失效。

``` ts
// globals.d.ts
import { Person } from 'myModule'   // 引入了一个模块，导致下面的类型定义都无法全局使用

declare type ErrCode = 1 | 2 | 3

declare interface School {
  studentList: Person[]
}
```

解决办法是：__需要在一个全局命名空间声明文件中引入，并将其放在全局命名空间上。__

``` ts
// myModuleGlobalNamespace.d.ts
import { Person } from 'other-module'

export = Group         // 向外暴露的值只能为一个外部模块(declare module)或外部命名空间(declare namespace)，且只能暴露一个
export as namespace GroupAlias     // 向外暴露名为GroupAlias命名空间，暴露的内容为export = 的值，这里可以理解为给Group起了一个别名。可以和要暴露的类型名相同

declare namespace Group {
  type Staff = Person
  
  interface Company {
    staffList: Person[]
  }  
}
```

上面的声明在全局命名空间上添加了一个`GroupAlias`命名空间，现在就可以在任意文件中使用`GroupAlias.Staff`和`GroupAlias.Company`类型了，唯一变化的就是多了层命名空间。

不过，这种用法的服务对象本身是给像jQuery这种带有全局命名空间的库使用的(虽然jQuery现在也支持模块化使用了，这里只是举个大家都熟悉的例子)，但也不妨碍使用它来进行全局类型的声明。

当然，最好还是通过引入模块来使用类型，而不是声明全局类型，变量也是同理，而且ts的自动导入已经做了绝大多数的工作，大部分时候都不再需要手写import。

另外还有一点需要注意：如果全局命名空间发生了重复，重复的命名空间就会发生覆盖(目前覆盖的策略还没搞清楚)，且没有提示或报错，所以声明全局命名空间时一定注意不要重复。

## 实践

我一般用以下形式使用全局类型声明。

### 目录结构

```
src
  > @types  // 全局类型声明文件夹
    > globalNamespaces  //  全局命名空间文件夹
      company.d.ts
      xxx.d.ts
      ...
    globals.d.ts  // 全局类型声明主文件，用于声明一些全局变量，简单接口等
```

### 命名格式

像刚才说的，因为要使用模块化的全局类型就必须多声明一层命名空间，如果只需要一个单独的类型，那么这一层命名空间就会显得多余，且不好理解。所以我一般采用这种做法：所有自定义的全局命名空间都以双下划线开头（这也是为了和jquery这种有全局命名空间的库以及原生js类型做区分），如果是一个命名空间下有多个类型，则正常命名，如果只需要一个单独的类型，则将命名空间命名为类型类型名，将类型命名为双下划线，例如：
``` ts
import { Person } from 'other-module'

export = Group
export as namespace __Group

// 一个命名空间下有两个成员，这个命名空间是有意义的
declare namespace Group {
  type Staff = Person
  
  interface Company {
    staffList: Person[]
  }  
}

// 使用：__Group.Staff、__Group.Company
```

``` ts
import { Person } from 'other-module'

export = Company
export as namespace __Company

// 只有一个成员(且已经明确将来不会增加其他成员)，这层命名空间是没有意义的，直接将接口名作为命名空间名
declare namespace Company {  
  interface __ {
    staffList: Person[]
  }  
}

// 使用：__Company.__
```