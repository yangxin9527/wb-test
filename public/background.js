
console.log('注入background.js')

const devEnvUrl = 'https://dev.weibanzhushou.com'
const releaseEnvUrl = 'https://weibanzhushou.com'
const devDomain = '.dev.weibanzhushou.com'
const releaseDomain = '.weibanzhushou.com'
const envs =
  [
    {
      name: '测试环境',
      description: 'dev.weibanzhushou.com 点石互动',
      corpId: '1703429757388935169',
      url: devEnvUrl,
      backgroundColor: '#FFCE5499',
    },
    {
      name: '开发环境',
      description: 'dev.weibanzhushou.com 未闻花名',
      corpId: '1654076894948099073',
      url: devEnvUrl,
      backgroundColor: '#FDE19999',
    },
    {
      name: '小租户',
      description: 'weibanzhushou.com 未闻花名',
      corpId: '1653682321878942721',
      url: releaseEnvUrl,
      backgroundColor: '#A0D46899',
    },
    {
      name: '大租户',
      description: 'weibanzhushou.com',
      corpId: '1686018253352272897',
      url: releaseEnvUrl,
      backgroundColor: '#48CFAD99',
    }
  ]


function reComputeCookieList(message) {
  chrome.storage.sync.get(['cookie'], (result) => {
    let cookieList = []
    if (result && result.cookie) {
      cookieList = result.cookie
    }
    console.log('已存储所有cookie: ', cookieList)
    let isNew = true
    const newCookieList = cookieList.map((cookie) => {
      if (cookie.corpId === message.corpId && cookie.extId === message.extId) {
        isNew = false
        return {
          ...cookie,
          ...message
        }
      } else {
        return cookie
      }
    })
    if (isNew) {
      newCookieList.push(message)
    }
    chrome.storage.sync.set({ cookie: newCookieList })
  })
}

// 获取 target 捕获到的用户信息 存到storage
/**
 * res: { type: 'save' | 'validate' }
 * type: save: 该类型用于存储获取到的信息
 * type: validate: 该类型用于验证当前登录账号
 */
chrome.runtime.onMessage.addListener((res, sender, sendResponse) => {
  console.log('background.js 收到消息:', res)
  if (res.type === 'validate'){
    // 这是主动拉取的用户信息，仅用于验证， 不再存储
    return
  }

  let message = {
    avatar: res.avatar,
    corpName: res.corp_name,
    userName: res.name,
    roleName: res.role_name,
    extId: res.ext_id,
    corpId: res.corp_id,
    url: res.url
  }
  
  chrome.cookies.getAll(
    {
      name: "session",
      domain: res.url
    },
    (cookies) => {
      // 有时 cookie.domain .dev.weibanzhushou.com  dev.weibanzhushou.com weibanzhushou.com .weibanzhushou.com

      cookies.map((cookie) => {
        if (
          cookie.value
          && cookie.value.startsWith('.')
          && (cookie.domain === '.' + res.url || cookie.domain === res.url)
        ) {
          message.session = cookie.value
        }
      })
      reComputeCookieList(message)
    }
  )

  sendResponse('success');

});
