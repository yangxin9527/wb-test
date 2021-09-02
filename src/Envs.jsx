import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import './Envs.less'

const Envs = (() => {

    const [cookieList, setCookies] = useState([])
    // 当前使用的账号cookie
    const [currentCookie, setCurrentCookie] = useState({
        avatar: '',
        corpName: '',
        userName: '',
        roleName: '',
        extId: '',
        corpId: '',
        env: '',
        url: '',
    })
    // 当前页url
    const [currentUrl, setCurrentUrl] = useState('')


    const DEV_URL = 'dev.weibanzhushou.com'
    const RELEASE_URL = 'weibanzhushou.com'
    const localEnvUrl = 'http://localhost:1376'
    //

    /** 常量 */
    const envs =
        [
            {
                name: '测试环境',
                description: 'dev.weibanzhushou.com 点石互动',
                corpId: '1703429757388935169',
                url: DEV_URL,
                backgroundColor: '#FFCE5499',
            },
            {
                name: '开发环境',
                description: 'dev.weibanzhushou.com 未闻花名',
                corpId: '1654076894948099073',
                url: DEV_URL,
                backgroundColor: '#FDE19999',
            },
            {
                name: '小租户',
                description: 'weibanzhushou.com 未闻花名',
                corpId: '1653682321878942721',
                url: RELEASE_URL,
                backgroundColor: '#A0D46899',
            },
            {
                name: '大租户',
                description: 'weibanzhushou.com 点石互动',
                corpId: '1686018253352272897',
                url: RELEASE_URL,
                backgroundColor: '#48CFAD99',
            }
        ]

    /** -------- 按钮事件  start */
    /** 复制事件 */
    const copyText = useCallback(text => {
        const el = document.createElement('section')
        el.innerText = text
        document.body.appendChild(el)
        const sel = window.getSelection()
        const range = document.createRange()
        range.selectNodeContents(el)
        sel.removeAllRanges()
        sel.addRange(range)
        const bool = document.execCommand('copy')
        el.remove()

        toast.success('复制成功')
    })

    /** 删除 */
    const deleteAccount = useCallback(cookie => {
        chrome.storage.sync.get(['cookie'], function (result) {
            let cookieList = []
            if (result && result.cookie) {
                cookieList = result.cookie
            }
            const newCookieList = cookieList.filter(item => {
                return item.corpId !== cookie.corpId || item.extId !== cookie.extId
            })

            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs.length > 0) {
                    var currentTab = tabs[0]
                    // TODO 不是当前环境 直接跳转新页面
                    let isLocalhost = currentUrl.includes(':1376')
                    let url = isLocalhost ? 'http://' + currentUrl : "https://" + cookie.url

                    chrome.cookies.remove(
                        {
                            name: 'session',
                            url
                        },
                        () => {
                            chrome.storage.sync.set({ 'cookie': newCookieList }, () => {
                                chrome.tabs.reload(tabs[0].id);
                            })
                        }
                    )
                }
            })

            setCookies(newCookieList)
            toast.success('删除成功')
        })
    })


    /** 切换环境 */
    const switchToEnv = useCallback((cookie, currentUrl) => {
        console.log('当前url: ' + currentUrl)

        console.log('向', currentUrl, 'cookie: ', currentCookie, '尝试写入session: ', cookie.session)
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length > 0) {
                var currentTab = tabs[0]
                // TODO 不是当前环境 直接跳转新页面
                let isLocalhost = currentUrl.includes(':1376')
                // 这里如果是localhost ， 从dev 到 release 相互切换时， 不要跳转了， 提示先修改winged.js配置的HOST地址
                if (currentCookie.session && isLocalhost && currentCookie.url !== cookie.url) {
                    toast.warning('请先修改微伴项目中的[winged.js] 中的HOST配置为：' + cookie.url, { autoClose: 3000 })
                    return
                }

                let url = isLocalhost ? 'http://' + currentUrl : "https://" + cookie.url
                chrome.cookies.remove(
                    {
                        name: 'session',
                        url
                    },
                    () => {
                        chrome.cookies.set(
                            {
                                name: 'session',
                                url,
                                value: cookie.session,
                            },
                            () => {
                                if (isLocalhost || cookie.url === currentUrl) {
                                    chrome.tabs.update(currentTab.id, {
                                        url: url + "/dashboard"
                                    });
                                    setCurrentCookie(cookie)
                                } else {
                                    chrome.tabs.create({ url: 'https://' + cookie.url + "/dashboard" });
                                }

                            }
                        )
                    }
                )
            }
        })
    })
    /** -------- 按钮事件  end */

    /** 获取存储的已登录cookies */
    const getStorageCookies = useCallback(() => {
        chrome.storage.sync.get(['cookie'], function (result) {
            let cookieList = []
            if (result && result.cookie) {
                cookieList = result.cookie
            }
            setCookies(cookieList)
            analysisCurrentEnv(cookieList)
        })
    })
    const analysisCurrentEnv = useCallback((cookieList) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length > 0) {
                var currentTab = tabs[0]
                if (currentTab.url) {
                    let currentTabUrl = currentTab.url
                    let urlSlices = currentTabUrl.split('/')
                    const url = urlSlices[2]
                    if (!url) {
                        // 不完整的url
                        return
                    }
                    console.log('---------- 从 chrome cookies 中区分当前Tab环境:')
                    console.log(cookieList)

                    setCurrentUrl(url)

                    listenMessage(cookieList)
                    chrome.tabs.sendMessage(currentTab.id, { type: 'validate' })
                }
            }
        })
    })

    const clearAllStorageCookies = useCallback(() => {
        chrome.storage.sync.set({ cookie: [] })
        setCookies([])
    })

    const listenMessage = useCallback((cookieList) => {
        chrome.runtime.onMessage.addListener((res) => {
            console.log('jsx 收到消息： ', res)
            if (res.type === 'validate') {
                // 获取到了当前tab下的真实登录信息
                let currentTabCookie
                cookieList.forEach(cookie => {
                    if (cookie.corpId === res.corp_id && cookie.extId === res.ext_id) {
                        currentTabCookie = cookie
                    }
                })
                if (currentTabCookie) {
                    console.log('当前登录信息： ', currentTabCookie)
                    setCurrentCookie(currentTabCookie)
                    console.log(currentCookie)
                }
            }
        })
    })

    useEffect(() => {
        // clearAllStorageCookies()
        getStorageCookies()
    }, [])

    const renderAccountList = useCallback((env, cookieList) => {
        let envCookieList = cookieList.filter(cookie => {
            return cookie.corpId === env.corpId
        })
        if (env.name === envs[3].name) {
            console.log('---------------')
            console.log(cookieList)
            // 大租户可能有多个未知的， 这里把不在预设范围内的全部认为是大租户
            const allDefaultCorpIds = [envs[0].corpId, envs[1].corpId, envs[2].corpId, envs[3].corpId]
            const otherCookies = cookieList.filter(cookie => {
                return allDefaultCorpIds.indexOf(cookie.corpId) === -1
            })
            envCookieList = [...envCookieList, ...otherCookies]
        }
        if (!envCookieList || envCookieList.length === 0) {
            return (
                <div className="account-empty-wrap">
                    <a className="account-empty" target='_blank' href={"https://" + env.url}>
                        当前无登录账号，去登录
                    </a>
                </div>
            )
        }

        return envCookieList.map((cookie) => {
            const corpId = cookie.corpId
            const corpName = cookie.corpName
            const loginName = cookie.userName
            const roleName = cookie.roleName
            const avatar = cookie.avatar
            const isLogin = currentCookie.session === cookie.session
            // const isLogin = false
            return (
                <div className={isLogin ? 'account-wrap login' : 'account-wrap'}>
                    <div className="account-left">
                        <div className="account-user">
                            <img src={avatar} alt="" />
                            <span title={loginName}>{loginName}</span>
                        </div>
                        <div className="account-role-wrap">
                            <div className="account-role">{roleName}</div>
                            <button className="account-copy" title={'复制' + corpName + '的corpId'} onClick={() => copyText(corpId)}>{corpName}</button>
                        </div>
                    </div>
                    <div className="account-right">
                        <button className="account-delete" onClick={() => { deleteAccount(cookie) }}>删除</button>
                        <button className={isLogin ? 'account-switch login' : 'account-switch'}
                            onClick={() => { switchToEnv(cookie, currentUrl) }}>
                            {
                                isLogin ? '当前使用' : '一键登录'
                            }
                        </button>
                    </div>
                </div>
            )
        })
    }, [currentCookie, currentUrl])

    const renderEnvList = useMemo(() => {
        return envs.map(env => {
            let sidebarUrl = "http://" + currentUrl + '/client/side_window/customer_info?source=wx_customer_service'
            const isLocalhost = currentUrl.includes(':1376')
            let isCurrentEnvLogin = false
            if (currentCookie.corpId === env.corpId) {
                isCurrentEnvLogin = true
            }
            const allDefaultCorpIds = [envs[0].corpId, envs[1].corpId, envs[2].corpId, envs[3].corpId]
            if (allDefaultCorpIds.indexOf(currentCookie.corpId) === -1 && env === envs[3]) {
                // 其他大租户（非点石科技）
                isCurrentEnvLogin = true
            }

            return (
                <div className="env-content" style={{ background: env.backgroundColor }}>
                    <div className="env-header">
                        <a className="env-title" title={env.description} target='_blank' href={"https://" + env.url + '/dashboard'} >{env.name}</a>
                        <div className={isLocalhost && isCurrentEnvLogin ? 'env-btns-wrap' : 'env-btns-wrap hidden'}>
                            <a className="env-btn" title={sidebarUrl} target="_blank" href={sidebarUrl}>微信侧边栏</a>
                        </div>
                    </div>
                    {renderAccountList(env, cookieList)}
                </div>
            )
        })
    }, [cookieList, renderAccountList])

    return (
        <div>
            {renderEnvList}
            <ToastContainer autoClose={1200} hideProgressBar></ToastContainer>
        </div>

    )
})

export default Envs