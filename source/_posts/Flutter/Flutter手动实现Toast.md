---
title: Flutter手动实现Toast
date: 2020-12-07 10:38:55
tags: Flutter
image: /2020/12/07/Flutter/Flutter手动实现Toast/head.jpg
excerpt: 网上的教程基本都是用fluttertoast，官方文档怎么自定义toast也没说清楚。自己动手，丰衣足食！
---

图片来源：[pixiv:title 作者：author](source url)

## 前言

网上的教程基本都是用(fluttertoast)[https://pub.flutter-io.cn/packages/fluttertoast]，官方文档怎么自定义toast也没说清楚(也可能是我英文太烂没看懂)。没办法，自己动手，丰衣足食！

最终效果：

[img]

## 开始

为了逻辑清晰，将toast组件分为三层：UI层、动画层、逻辑层。接下来依次实现。

### UI层

顾名思义，UI层只做绘制UI的工作，不要写别的东西。

``` dart
import 'dart:async';
import 'package:flutter/material.dart';
import 'components/animation.dart'; // 这是之后要实现的动画层

enum ToastPosition {
  top, center, bottom
}

class Toast extends StatefulWidget {
  final String text;
  final ToastPosition position;
  final Function(ToastAnimationController) emitController;  // 需要抛出一个控制器，这个控制器实际是由动画层提供的

  const Toast({
    Key key,
    this.text,
    this.position,
    this.emitController
  }) : super(key: key);

  @override
  _ToastState createState() => _ToastState();
}

class _ToastState extends State<Toast> {
  @override
  void initState() { 
    super.initState();
  }

  // 定义toast位置的具体定位
  get toastPositionContainer => {
    ToastPosition.top: (Widget child) => Positioned(top: 70, left: 0, right: 0, child: child),
    ToastPosition.center: (Widget child) => Positioned(top: 0, bottom: 0, left: 0, right: 0, child: child),
    ToastPosition.bottom: (Widget child) => Positioned(bottom: 70, left: 0, right: 0, child: child)
  }[widget.position];

  @override
  Widget build(BuildContext context) {
    final toastBody = Container(
      margin: EdgeInsets.symmetric(horizontal: 30),
      padding: const EdgeInsets.only(
        top: 10, bottom: 10,
        left: 20, right: 20
      ),
      decoration: BoxDecoration(
        color: const Color.fromRGBO(0, 0, 0, 0.7),
        borderRadius: const BorderRadius.all(Radius.circular(10))
      ),
      child: Text(widget.text,
        style: TextStyle(
          color: Colors.white,
          fontSize: 14,
          fontWeight: FontWeight.normal,
          decoration: TextDecoration.none,
        ),
      ),
    );
    
    // 包裹IgnorePointer，防止toast挡住用户点击页面
    return IgnorePointer(
      ignoring: true,
      child: Stack(
        children: [
          toastPositionContainer(
            Center(
              child: ToastAnimationWrapper(
                toast: toastBody,
                emitController: widget.emitController,  // emitController继续传给动画层
              )
            )
          )
        ],
      )
    );
  }
}
```

### 动画层

动画层中有两个动画：show、hide，最后抛出一个动画控制器。

``` dart
import 'package:flutter/material.dart';

class ToastAnimationWrapper extends StatefulWidget {
  final Widget toast;  // toast UI层组件
  final Function(ToastAnimationController) emitController;

  ToastAnimationWrapper({
    Key key,
    this.toast,
    this.emitController
  }) : super(key: key);

  @override
  _ToastAnimationWrapperState createState() => _ToastAnimationWrapperState();
}

class _ToastAnimationWrapperState extends State<ToastAnimationWrapper> with SingleTickerProviderStateMixin {
  Animation<double> translateY;
  Animation<double> scale;
  Animation<double> opacity;
  AnimationController animationController;
  // 由于对动画值的赋值是在动画方法中进行的，所有动画值的初始值为null，无法渲染
  // 所以要用这个变量进行判断，如果为false时不渲染内容
  bool animationReady = false;

  @override
  void initState() {
    super.initState();
    animationController = AnimationController(vsync: this);
    widget.emitController(ToastAnimationController(show, hide));
  }

  // show和hide方法都返回一个Future，用于告知动画已经结束
  Future<void> show() {
    animationController.duration = const Duration(milliseconds: 300);
    
    setState(() {
      translateY = Tween(begin: 5.0, end: 0.0)
        .animate(CurvedAnimation(
          parent: animationController,
          curve: Interval(0.0, 0.5, curve: Curves.ease)
        ));
      
      scale = TweenSequence([
        TweenSequenceItem(tween: Tween(begin: 1.0, end: 1.1), weight: 1),
        TweenSequenceItem(tween: Tween(begin: 1.1, end: 1.0), weight: 1),
      ]).animate(CurvedAnimation(
        parent: animationController,
        curve: Curves.ease
      ));

      opacity = Tween(begin: 0.0, end: 1.0)
        .animate(CurvedAnimation(
          parent: animationController,
          curve: Interval(0.0, 0.5, curve: Curves.ease)
        ));

      // 动画已经准备好，设置animationReady为true
      animationReady = true
    })

    return animationController.forward().orCancel;
  }

  Future<void> hide() {
    animationController.reset();
    animationController.duration = const Duration(milliseconds: 150);
    
    setState(() {
      translateY = Tween(begin: 0.0, end: 5.0)
        .chain(CurveTween(curve: Curves.ease))
        .animate(animationController);
      
      scale = Tween(begin: 1.0, end: 0.8)
        .chain(CurveTween(curve: Curves.ease))
        .animate(animationController);

      opacity = Tween(begin: 1.0, end: 0.0)
        .chain(CurveTween(curve: Curves.ease))
        .animate(animationController);
    })

    return animationController.forward().orCancel;
  }
  
  @override
  Widget build(BuildContext context) {
    // 判断动画未准备好时，返回空内容
    if (!animationReady) return Container(width: 0, height: 0);

    return AnimatedBuilder(
      animation: translateY,
      child: FadeTransition(
        opacity: opacity ?? 0,
        child: ScaleTransition(
          scale: scale,
          child: widget.toast,
        )
      ),
      builder: (context, child) => (
        Transform(
          transform: Matrix4.translationValues(0, translateY.value, 0),
          child: child,
        )
      )
    );
  }
}

// 动画控制器
class ToastAnimationController {
  final Future Function() show;
  final Future<void> Function() hide;

  ToastAnimationController(this.show, this.hide);
}
```

### 逻辑层

这里实现的也就是给外部调用的函数。

首先要简单了解下[Overlay](https://api.flutter.dev/flutter/widgets/Overlay-class.html)的概念，Overlay是Flutter中一个独立的页面栈，显示在所有页面的最上层，利用这个就可以比较方便地实现toast、tooltip、dialog等组件的展示。

需要将包裹了动画层的UI层放入Overlay中，在toast的声明周期结束后(显示动画 -> 持续时间过后 -> 隐藏动画)移出Overlay。

``` dart
void toast (String text, {
  ToastPosition position = ToastPosition.bottom,
  int duration = 3000
}) async {
  // new一个Completer用来异步接收动画控制器
  var controllerCompleter = Completer<ToastAnimationController>();
  
  // 注意这里的放入Overlay的写法
  final overlayEntry = OverlayEntry(
    builder: (context) => Toast(
      text: text, 
      position: position,
      emitController: controllerCompleter.complete,
    )
  );
  
  // OneContext是一个flutter库，可以比较方便地保存路由的navigatorKey，然后全局使用。
  // 使用GlobalKey也是可以的，只要能拿到上下文对象就行，具体用法请自行百度，这里不再赘述
  Overlay.of(OneContext().context).insert(overlayEntry);
  final controller = await controllerCompleter.future;  // 拿到控制器
  controller.show();
  await Future.delayed(Duration(milliseconds: duration));
  await controller.hide();
  overlayEntry.remove();  // 从Overlay中移除
}
```

以上就手动实现了一个带有动画，封装好的完整toast功能。