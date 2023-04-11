---
title: Windows环境变量配置之坑人的[U+202A]
date: 2023-04-11 09:15:00
tags: [Windows]
image: https://phx02pap003files.storage.live.com/y4mbg3nlJmjGFwvBcfR7pZ1TBPTEZPoW8Q62lJ6ETBvlTWBsysaa1ILI03OdjwRinQaU2Z5cahiqLh8eLvfblYICeEYnBAWux-NPkVsYNXBfZeiGNyerUEAxjsq-ZSmjRcSlOQPr1n1lPfqnHywHKGg2CD4_MmJ8GtYbA81DXFDdHWsLAKx2OlifDMhls6b-b8-?width=660&height=440&cropmode=none
imagePosition: 0 -100px
excerpt: 困扰我多年的环境变量配置问题终于找答案了...
---

图片来源：[pixiv:ハロウィンチマメ 作者：とけとう](https://www.pixiv.net/artworks/59744468)

不知道各位遇没遇到过这种情况：环境变量怎么配置都不生效，重启终端、资源管理器，甚至电脑都无济于事，明明所有操作都是正确的，就是不生效。在尝试了好几遍快要筋疲力竭的时候，终于莫名奇妙地配好了。然而此时已经记不得到底是哪一步做得和之前不一样。如果没有的话，可能你用得不是Windows，或者单纯只是我太笨了。终于我在最近一次又遇到这种问题后，排查到了问题所在。

## 引发问题的操作

查看路径时，相信有些人会用和我相同的办法：<u>文件或文件夹右键 > 属性 > 安全 > 对象名称</u>，问题就出现在这里。乍一看没什么不对，但要是就这么原封不动复制粘贴到环境变量的Path里，就会发生上面的情况。粘贴到新版VS Code里可以看到如下显示：

```
[U+202A]C:\xxx\xxx
```

复制的路径自动带上了一个名为`U+202A`的不可见Unicode，导致Windows无法正确读取环境变量的Path。

解决方法是：复制资源管理器中上方显示的路径就好了，不要再用对象名称的路径。

“所以说这个[U+202A]是个什么鬼？”，原因可以看这里：http://www.jintiankansha.me/t/Kcv26edoNH

至此，困扰我多年的Windows环境变量配置问题终于解决了。