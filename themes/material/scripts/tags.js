

/**
 * 警示块
 * @param {['info' | 'success' | 'warning' | 'danger', string])} args
 * @param {string} content
 */
function alertTag([type = 'info', text], content) {
  const alertContent = text || content
  return `<blockquote class="alertTag" data-type="${type}">
    <p>${alertContent}</p>
  </blockquote>`
}

hexo.extend.tag.register('alert', alertTag, { ends: true })