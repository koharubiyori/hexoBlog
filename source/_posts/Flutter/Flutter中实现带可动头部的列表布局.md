---
title: Flutter中实现带可动头部的列表布局
date: 2020-12-07 10:05:04
tags: Flutter
image: https://bn1302files.storage.live.com/y4m0d3ptUNFMBcZAPLrdYlwLatPLaQ2U8dvmZjJCTYNflldgMA_8IVlEYDKemG0fdZct_QbiIsMLxW3rLF8XgU56s_KCcFAFE6OikQKkrH3RHhCUjg4UAQ2FrZz__YORl_h0_HQpJ0_aHuP13CrhSdNTdJ0yVkVKigSCuBvTl7pMZszK4QG4OhB4ScupmoC_SCc?width=1024&height=576&cropmode=none
excerpt: 主要是解决下拉刷新指示器被绝对定位的头栏挡住的问题。
---

图片来源：《请问您今天要来点兔子吗》第二季第11话ED后插图

## 开始

带可动头部的列表布局指的就是这种效果：

<img src="sample.gif" width="300" />

作为一个前端，第一反应就是头栏使用绝对定位，列表顶部添加头部高度的padding，然后通过监听滚动条事件跳转头栏位置，思路一来撸代码三下五除二一气呵成；嗯，效果不错。哦，还需要个下拉刷新的功能，这还不简单，`RefreshIndicator`赶快给安排上；ok搞定，来来来看看效果，我擦转圈哪去了？哦，不过下拉刷新还是好使的——**原来转圈是被头栏挡上了**。

这篇博客就是为了解决这个问题，下拉刷新指示器被绝对定位的头栏挡住。

先说下原理：在滚动位置为0时，在顶部显示一个固定头部，在滚动位置非0时，将顶部固定头部去掉，展示一个定位的头部，并对列表添加额外的顶部padding。

## 代码实现

``` dart
import 'package:flutter/material.dart';

final statusBarHeight = MediaQueryData.fromWindow(window).padding.top;

class ListLayoutWithMovableHeader extends StatefulWidget {
  final double maxDistance;  // 头栏最多可以收起的距离
  final bool statusBarMask;  // 为状态栏区域添加一个遮罩，防止header上移时header的文字和状态栏文字重叠
  final ScrollController scrollController;
  final Widget header;  // 头栏组件
  final Widget Function(bool headerFloated) listBuilder;  // 列表构建函数，会得到一个当前头栏是否为浮动状态的参数

  ListLayoutWithMovableHeader({
    @required this.maxDistance,
    this.statusBarMask = true,
    @required this.scrollController,
    @required this.header,
    @required this.listBuilder,
    Key key
  }) : super(key: key);

  @override
  _ListLayoutWithMovableHeaderState createState() => _ListLayoutWithMovableHeaderState();
}

class _ListLayoutWithMovableHeaderState extends State<ListLayoutWithMovableHeader> {
  bool headerFloated = false;
  
  @override
  void initState() { 
    super.initState();
    widget.scrollController.addListener(scrollListener);
  }

  @override
  void dispose() { 
    widget.scrollController.removeListener(scrollListener);
    super.dispose();
  }

  void scrollListener() {
    // offset为0或非0有变化时再设置，防止频繁setState
    final headerFloated = widget.scrollController.offset != 0;
    if (this.headerFloated != headerFloated) {
      setState(() => this.headerFloated = headerFloated);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Column(
      children: [
        if (!headerFloated) widget.header,
        Expanded(
          child: Stack(
            children: [
              widget.listBuilder(headerFloated),
              if (headerFloated) (
                _PositionedHeader(
                  maxDistance: widget.maxDistance,
                  scrollController: widget.scrollController,
                  header: widget.header,
                )
              ),

              if (widget.statusBarMask && headerFloated) (
                Positioned(
                  top: 0,
                  left: 0,
                  child: Container(
                    width: MediaQuery.of(context).size.width,
                    height: statusBarHeight,
                    color: theme.primaryColor,
                  )
                )
              )
            ],
          )
        )
      ],
    );
  }
}

// 将PositionedHeader单独拆出来，防止每次更新positionTop时整个列表跟着一起更新
class _PositionedHeader extends StatefulWidget {
  final double maxDistance;
  final ScrollController scrollController;
  final Widget header;
  
  _PositionedHeader({
    @required this.maxDistance,
    @required this.scrollController,
    @required this.header,
    Key key
  }) : super(key: key);

  @override
  _PositionedHeaderState createState() => _PositionedHeaderState();
}

class _PositionedHeaderState extends State<_PositionedHeader> {
  double positionTop = 0;
  double lastOffset = 0;
  
  @override
  void initState() { 
    super.initState();
    widget.scrollController.addListener(scrollListener);
  }

  @override
  void dispose() {
    widget.scrollController.removeListener(scrollListener);
    super.dispose();
  }

  void scrollListener() {
    final movingValue = widget.scrollController.offset - lastOffset;
    var newPositionTop = positionTop - movingValue;
    if (newPositionTop < -widget.maxDistance) newPositionTop = -widget.maxDistance;
    if (newPositionTop > 0) newPositionTop = 0;
    setState(() => positionTop = newPositionTop);
    
    lastOffset = widget.scrollController.offset;
  }
  
  @override
  Widget build(BuildContext context) {
    return Positioned(
      top: positionTop,
      left: 0,
      width: MediaQuery.of(context).size.width,
      child: widget.header,
    );
  }
}
```

以上就是完整的实现，虽然可以解决问题，但不知道是不是一种取巧的办法，如果有更好的实现方式，也请各路大神不吝赐教，終わり。