// 此处 注入到目标页
'use strict'
console.log('target.js 检测注入host: ',window.location.host, '- -port:', window.location.port)

if (window.location.host === 'dev.weibanzhushou.com' 
|| window.location.host === 'weibanzhushou.com' 
|| window.location.port === "1376"){

  console.log('注入微伴助手脚本')
  if (window.location.host === 'dev.weibanzhushou.com' 
  || window.location.host === 'weibanzhushou.com'){
    let timer = setInterval(() => {
      fetch('/api/staff/me')
        .then((response) => {
          return response.json();
        })
        .then((res) => {
          if (res && res.success) {
            timer && clearInterval(timer)
            chrome.runtime.sendMessage({...res,url:location.host}, (response) => {

            })
          }
        })
    }, 2000);
  }


  chrome.runtime.onMessage.addListener((msg, sender ) => {

      console.log('target.js 收到消息：', msg, sender)
      if (msg.type === 'validate'){
        fetch('/api/staff/me')
        .then((response) => {
          return response.json();
        })
        .then((res) => {
          if (res && res.success) {
            console.log('target.js 执行staff/me: ', res)
            chrome.runtime.sendMessage({...res, type: 'validate'}, (response) => {

            })
          }
        })
      }
  })
}