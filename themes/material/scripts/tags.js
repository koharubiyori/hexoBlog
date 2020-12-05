

/**
 * 警示块
 * @param {['info' | 'success' | 'warning' | 'danger', string])} args
 * @param {string} content
 */
function alertTag([type = 'info', text], content) {
  const alertContent = text || content
  return `<div class="alertTag" data-type="${type}">${alertContent}</div>`
}

hexo.extend.tag.register('alert', alertTag, { ends: true })