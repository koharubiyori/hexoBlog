$(() => {
  // 移动端适应
  !isMobile() && $(document.body).css('min-width', 1100)

  const snackbar = createSnackbar()
  const drawer = createDrawer()

  // appBar
  initAppBar()
  
  // 首页搜索动效
  $('.headerSearchBar > input')
    .on('focus', () => $('.headerSearchBar').addClass('is-focused'))
    .on('blur', () => $('.headerSearchBar').removeClass('is-focused'))

  // 材料设计波纹效果
  $('.materialRipple')
    .addClass('mdc-ripple-surface')
    .each((index, item) => mdc.ripple.MDCRipple.attachTo(item))

  // 抽屉控制按钮
  $('#drawerButton').click(() => drawer.source.opened ? drawer.close() : drawer.open())

  // tab栏
  $('.mdc-tab-bar').each((index, item) => new mdc.tabBar.MDCTabBar(item))

  // 初始化目录
  initContents()

  // 只言片语渲染
  ;(() => {
    const katakoto = $('.katakoto-items')
    const maxIndex = katakoto.find('.katakoto-item').length - 1
    let currentIndex = 0
    setInterval(() => {
      currentIndex++
      if (currentIndex > maxIndex) currentIndex = 0
      katakoto.css('transform', `translateX(-${currentIndex * 254}px)`)
    }, 4000)
  })()

  // tooltip渲染
  ;(() => {
    $('.mdc-tooltip').each((index, item) => {
      const tooltip = new mdc.tooltip.MDCTooltip(item)
      tooltip.foundation.hideDelayMs = 0
    })
  })()

  // 文章页版权声明点击文章链接复制链接
  $('#articleLink').click(() => {
    const inputTag = $('<input>').val($('#articleLink').text())
    inputTag.css('position', 'fixed').css('left', '-9999px')
    $(document.body).append(inputTag)
    inputTag.focus()
    document.execCommand('selectAll')
    document.execCommand('copy')
    setTimeout(() => inputTag.remove(), 1000)
    snackbar('已复制链接')
  })

  // 搜索功能
  initSearchModal()

  // 回到顶部
  ;(() => {
    $('.backTopButton')
      .click(() => window.scrollTo({ top: 0, behavior: 'smooth' }))

    $(window).on('scroll', () => {
      if (window.scrollY > 300) {
        $('.backTopButton').removeClass('is-hide')
      } else {
        $('.backTopButton').addClass('is-hide')
      }
    })
  })()
  
  // 评论栏
  new Valine({
    el:'#post-comments',
    appId: 'Ul5NbwoIVOstKoK9Bwv36u4D-gzGzoHsz',
    appKey: 'FMzTWsKMYHIu83jzJwUkLwgQ',
    placeholder: '说点什么吧...'
  })

  // 为文章中的图片添加预览器
  ;(() => {
    const postPageContainerEl = document.querySelector('.page-post')
    if (postPageContainerEl) {
      postPageContainerEl.querySelectorAll('img').forEach(item => {
        const widgetVisibleLevel = 3  
        const toolbarItems = ['zoomIn', 'zoomOut', 'oneToOne', 'reset', 'rotateLeft', 'rotateRight', 'flipHorizontal', 'flipVertical']
        const toolbarItemsConfig = Object.fromEntries(
          toolbarItems.map(item => [item, widgetVisibleLevel])
        )
        
        new Viewer(item, {
          title: false,
          navbar: false,
          toolbar: toolbarItemsConfig
        })
      })
    }
  })()
})


// ------------------------- 函数分割 -----------------------------------


function isMobile() {
  return window.screen.width <= 720
}

function createSnackbar() {
  const html = `
    <div class="mdc-snackbar">
      <div class="mdc-snackbar__surface">
        <div class="mdc-snackbar__label" role="status" aria-live="polite"></div>
        <div class="mdc-snackbar__actions">
          <button type="button" class="mdc-button mdc-snackbar__action">
            <div class="mdc-button__ripple"></div>
            <span class="mdc-button__label">关闭</span>
          </button>
        </div>
      </div>
    </div>
  `
  
  $(document.body).append(html)
  const snackbar = new mdc.snackbar.MDCSnackbar($('.mdc-snackbar')[0])

  return (text, timeout = 2000) => {
    snackbar.labelText = text
    snackbar.open()
    setTimeout(() => snackbar.close(), timeout)
  }
}

function initAppBar() {
  new mdc.topAppBar.MDCTopAppBar($('.mdc-top-app-bar')[0])

  if (isMobile()) {
    $('.mdc-top-app-bar').css('transition', 'all 0.2s')

    let lastScroll = 0
    $(window).on('scroll', () => {
      if (window.scrollY < 100) {
        $('.mdc-top-app-bar').css('transform', 'translateY(0)')
      } else if (lastScroll < window.scrollY) {
        $('.mdc-top-app-bar').css('transform', 'translateY(-66px)')
      } else {
        $('.mdc-top-app-bar').css('transform', 'translateY(0)')
      }

      lastScroll = window.scrollY
    })
  }
}

// 抽屉
class MyDrawer {
  constructor(element, options = {}) {
    this.opened = false
    this.el = element
    this.options = options
    this.el.style.transition = 'all 0.3s'
  }

  open() {
    this.opened = true
    this.el.style.marginLeft = 0
  }

  close() {
    this.opened = false
    this.el.style.marginLeft = -265 + 'px'
  }
}

function createDrawer() {
  const drawer = new MyDrawer($('.drawer-body')[0])
  const drawerPlaceholder = new MyDrawer($('.drawer-placeholder')[0])

  function openDrawer() {
    drawer.open()
    drawerPlaceholder.open() 
    isMobile() && mask.addClass('is-active')
  }

  function closeDrawer() {
    drawer.close() 
    drawerPlaceholder.close() 
    isMobile() && mask.removeClass('is-active')
  }

  const mask = $('<div class="drawer-mask">')
    .click(closeDrawer)
    
  $('.page-drawer').append(mask)

  const drawerController = {
    source: drawer,
    open: openDrawer,
    close: closeDrawer
  }

  return drawerController
}

function initContents() {
  if ($('.page-post').length !== 0) {

    let contentsData = []
    let number = [0, 0]
    let lastLevel = 2

    const debounced = (fn, time = 0) => {
      let timeoutKey = 0
      return () => {
        clearTimeout(timeoutKey)
        setTimeoutKey = setTimeout(fn, time)
      }
    }

    new ResizeObserver(debounced(collectContentsData, 10)).observe($('html')[0])

    function collectContentsData() {
      console.log('exec')
      $('.articleContents > .articleContents-item').remove()
      contentsData = []
      number = [0, 0]
      lastLevel = 2

      $('.post-body--content > .contentContainer > h2, .post-body--content > .contentContainer > h3').each((index, item) => {
        // 收集目录标题
        const level = parseInt(item.tagName.replace('H', ''))
        if (level === 2) {
          number[0]++
          number[1] = 0
        }
        if (level === 3) number[1]++
        lastLevel = level
  
        contentsData.push({ 
          id: item.id,
          name: $(item).text(),
          level: parseInt(item.tagName.replace('H', '')),
          number: number.join('.').replace('.0', ''),
          offset: item.getBoundingClientRect().top + window.scrollY  // 记录每个标题的顶部偏移
        })
      })
  
      contentsData.forEach(item => {
        const contentsItem = $(`<a class="articleContents-item com-textLimit" data-level="${item.level}" href="${'#' + item.id}">- ${item.number} ${item.name}</a>`)
          .click(e => {
            e.preventDefault()
            location.hash = item.id
          })
        $('.articleContents').append(contentsItem)
      })
    }

    $(window).on('scroll', checkContents)
    
    function checkContents() {
      if (contentsData.length === 0) { return }
      const minusOffset = 50
      
      const articleContentsItems = $('.articleContents > .articleContents-item')

      articleContentsItems.removeClass('is-active')
      if (window.scrollY < contentsData[0].offset - minusOffset) {
        articleContentsItems.eq(0).addClass('is-active')
        return
      }

      if (window.scrollY > contentsData[contentsData.length - 1].offset - minusOffset) {
        articleContentsItems.eq(articleContentsItems.length - 1).addClass('is-active')
        return
      }

      contentsData.forEach((item, index) => {
        if (window.scrollY > item.offset - minusOffset && window.scrollY < contentsData[index + 1].offset - minusOffset) {
          articleContentsItems.eq(index).addClass('is-active')
          return
        }
      })
    }
  }
}

function initSearchModal() {
  let searchData = []
  const loadSearchData = () => searchData.length === 0 && $.get('/search.json')
    .then(data => searchData = data.posts.map(item => ({ 
      ...item, 
      categories: item.categories.map(item => item.name),
      tags: item.tags.map(item => item.name) 
    })))
  
  loadSearchData()

  $('#searchButton').click(() => {
    $('.page-search').fadeIn(300)
    $('.search-body').animate({ top: 40, opacity: 1 }, 300)
    loadSearchData()
  })
  
  $('.page-search').click(function(e) {
    if (e.target !== this) { return }
    $('.search-body')
      .animate({ top: 0, opacity: 0 }, 300, () => $('.page-search').hide())
    setTimeout(() => {
      $('.search-result').empty()
      $('.search-input').val('')
    }, 300)
  })

  $('.search-input').on('input', e => {
    $('.search-result').attr('data-dirty', 'true')

    const keyword = e.target.value.trim().toLowerCase()
    const searchResult = searchData.filter(item => {
      if (keyword === '') return false
      if (item.title.toLowerCase().indexOf(keyword) >= 0) return true
      if (item.excerpt && item.excerpt.toLowerCase().indexOf(keyword) >= 0) return true
      if (item.categories && item.categories.join('|').toLowerCase().indexOf(keyword) >= 0) return true
      if (item.tags && item.tags.join('|').toLowerCase().indexOf(keyword) >= 0) return true
      return false
    })
    
    $('.search-result').attr('data-emptyResult', (searchResult.length === 0).toString())

    const searchResultItemTemplate = data => `
      <a class="search-result--item" href="/${data.path}">
        <div class="title">${data.title}</div>
        <div class="excerpt">${data.excerpt}</div>
        <div class="footer flex-row flex-cross-center">
          ${(data.categories && false) ? `
            <div class="categories flex-row-inline flex-cross-center">
              <i class="material-icons">folder</i>
              <span class="flex-row-inline flex-cross-center">${data.categories.join('<i class="material-icons">chevron_right</i>')}</span>
            </div>
          ` : ''}
          ${data.tags ? `
            <div class="tags">
              ${data.tags.map(item => `
                <div class="tag flex-row-inline flex-cross-center">
                  <i class="material-icons">local_offer</i>
                  <span>${item}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      </a>
    `
    
    const searchResultEls = searchResult.map(searchResultItemTemplate)
    $('.search-result').empty().append(searchResultEls)
  })
}