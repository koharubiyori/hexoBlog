---
title: Vue框架的Tabs组件封装
date: 2020-08-24 12:51:32
tags: [Vue.js, 前端技术]
image: https://bn1302files.storage.live.com/y4m7bKPDtWR7kozrrmHPlP9Qc6nHbWIPOYeGciDP98qclbpWeuh7lYASAAb9s8gpW9SLKgn4cmN3D8tVQLcESJlY1Pw07joLNwGIJcV5HoiUh8Vg38PhAfUUmfHP_3u8OF96TT3z-8qAJs2EcjR5_MO2ZWN2QuLj9AE0bPIoJb5wOuFZLuN1z4CdcBBYz0jz9xz?width=1024&height=724&cropmode=none
excerpt: 封装一个类似Vue ElementUI中标签页组件那样，组件的tab按钮文字与tab内容使用同一组件设置的组件。
---

图片来源：[pixiv:ハロウィンチマメ 作者：とけとう](https://www.pixiv.net/artworks/59744468)

## 前言

在使用Vue开发的过程中，想必大家都使用过一些UI框架的Tab组件，这些Tab组件一般都由两部分组成：`TabContainer`和`TabItem`，在使用时呈以下结构：

``` html
<TabContainer v-model="activeTab" @change="handlerForWasActiveTabChanged">
  <TabItem label="水果" :value="1">
    <div>苹果</div>
    <div>橙子</div>
  </TabItem>

  <TabItem label="蔬菜" :value="2">
    <div>白菜</div>
    <div>蘑菇</div>
  </TabItem>
</TabContainer>
```

最后生成一组标签，并在点击对应标签时显示对应`TabItem`中的内容。

那么问题来了，这种写法最后生成Tabs是如何实现的呢？

## 实现

首先来实现`TabItem`组件，这个组件非常简单。

可以理解为这个组件为接下来要实现的`TabContainer`组件提供数据。

``` html
<template>
  <!-- 判断父组件(TabContainer)中的activeTab，决定是否显示 -->
  <div v-if="$parent.activeTab === value">
    <slot></slot>   <!-- 声明插槽接收item标签的内容 -->
  </div>
</template>

<script>
export default {
  // 声明要使用的数据，这部分数据会在tabContainer组件中被使用
  props: [
    'label',  // 标签名
    'value'   // 标签值
  ],   

  data() {
    return {
      
    }
  },

  methods: {

  }
}
</script>
```

再来实现关键的`TabContainer`组件，这个组件包含生成实际内容的逻辑。

``` html
<template>
  <div>
    <span 
      v-for="(item, index) in tabs" 
      :key="index" 
      @click="activeTab = item.value"
    >{{ item.label }}</span>

    <slot />  <!-- 接收tabItem的内容 -->
  </div>
</template>

<script>
export default {
  props: ['value'],

  data (){
    return {
      children: []  // $children不支持响应式，必须声明一个数组对其进行接管
    }
  },

  // 必须在mounted中，在created中$children为空数组
  mounted() {
    // 这一步有两个意义：一是触发更新，二是接管$children，如果使用$children作为数据源，会发现即使手动更新，$children的数据依然会慢上一拍(拿到的总是上一次的数据)
    this.children = this.$children   
  },

  computed: {
    // 将子组件中的label和value取出
    tabs (){
      return this.children.map(item => ({ label: item.label, value: item.value }))
    },

    activeTab: {
      get (){ return this.value },
      set (val){ this.$emit('input', val) }
    }
  },

  methods: {

  }
}
</script>
```

到这里就已经实现在前言中描述的用法了。但是，细心的朋友可能已经发现了，上面的代码在动态生成`TabItem`时会导致无法更新，因为官方在API文档中对于`$children`属性的说明中也已经提到了：
> 需要注意 $children 并不保证顺序，也不是响应式的。

上面的代码tabs只会在`mounted`中更新一次，由对`this.children`的赋值引起，之后就不会再更新了，因为`$children`本身不是响应式的。同时我还尝试了使用`$slots`获取，虽然文档上没有提及，但经过测试`$slots`也不是响应式的，最后只好在updated钩子中进行脏检查更新，如果有更好的解决办法，也请各路大神不吝赐教。

以下是脏检查版的`TabContainer`：

``` html
<template>
  <div>
    <span 
        v-for="(item, index) in tabsData()" 
        :key="index" 
        @click="activeTab = item.value"
    >{{ item.label }}</span>

    <slot />
  </div>
</template>
<script>
export default {
  props: ['value'],

  data (){
    return {
      childrenCache: this.$children
    }
  },

  mounted() {
    this.$forceUpdate()
  },

  updated() {
    if (this.needUpdateTabs()) {
      this.childrenCache = this.$children
      this.$forceUpdate()
    }
  },

  computed: {
    activeTab: {
      get (){ return this.value },
      set (val){ this.$emit('input', val) }
    }
  },

  methods: {
    // 生成渲染tabs时要用到的数据
    tabsData() {
      if (this.childrenCache === undefined) return []
      return this.childrenCache.map(item => ({ label: item.label, value: item.value }))
    },

    // 检查是否需要更新视图
    needUpdateTabs() {
      if (this.childrenCache.length !== this.$children.length) return true
      return this.childrenCache.some((item, index) => item !== this.$children[index])
    }
  }
}
</script>
```