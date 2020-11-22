hexo.extend.helper.register('css', function(...paths) {
  return paths.map(path => `<link rel="stylesheet" href="/${path}.css?${Math.random()}">`).join('\n') 
})

hexo.extend.helper.register('js', function(...paths) {
  return paths.map(path => `<script src="/${path}.js?${Math.random()}"></script>`).join('\n') 
})