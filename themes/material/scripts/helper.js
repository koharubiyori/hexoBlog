hexo.extend.helper.register('css', function(...paths) {
  return paths.map(path => `<link rel="stylesheet" href="/${path}.css?timestamp=${new Date().getTime()}">`).join('\n') 
})

hexo.extend.helper.register('js', function(...paths) {
  return paths.map(path => `<script src="/${path}.js?timestamp=${new Date().getTime()}"></script>`).join('\n') 
})