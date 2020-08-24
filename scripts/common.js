$(() => {
  // 首页搜索动效
  $('.headerSearchBar > input')
    .on('focus', () => $('.headerSearchBar').addClass('is-focused'))
    .on('blur', () => $('.headerSearchBar').removeClass('is-focused'))
})