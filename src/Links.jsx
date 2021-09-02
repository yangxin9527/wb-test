import React, { useCallback, useMemo, useState, useEffect } from 'react'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import './Links.less'

const Links = (() => {

    const defaultLinks = [
        {
            name: 'GitLab',
            title: '点击跳转',
            url: 'http://gitlab.yiban.io/',
            content: ''
        },
        {
            name: '公司蓝湖',
            url: 'https://lanhuapp.com/web/#/item?cid=&fid=all&tid=9050a08b-0e61-473a-9aeb-dc0d0ae6b6d0',
            content: ''
        },
        {
            name: '微伴hosts配置',
            title: '点击复制',
            url: '',
            content:
                '#weiban-start \
                134.175.253.162 gitlab.yiban.io \
                134.175.253.162 gitlab-ssh.yiban.io \
                129.204.224.140  newjenkins.yiban.io sonar.yiban.io \
                193.112.194.157 doc.weibanzhushou.com \
                106.55.74.215 sentry.yiban.io \
                #weiban-end'
        },
        {
            name: '分支规范',
            title: '点击跳转',
            url: 'https://confluence.yiban.io/pages/viewpage.action?pageId=338402',
            content: ''
        },
        {
            name: '提交规范',
            title: '点击跳转',
            url: 'https://confluence.yiban.io/pages/viewpage.action?pageId=338067',
            content: ''
        },
    ]
    const [links, setLinks] = useState([])

    // 4个 input 对应的值 
    const [linkName, setlinkName] = useState('')
    const [linkTitle, setlinkTitle] = useState('')
    const [linkUrl, setlinkUrl] = useState('')
    const [linkContent, setlinkContent] = useState('')

    const getLocalLinks = useCallback(() => {
        chrome.storage.sync.get(['links'], function (result) {
            let localLinks = defaultLinks
            if (result && result.links) {
                localLinks = result.links
            }
            setLinks(localLinks)
        })
    })

    useEffect(() => {
        // setLinks(defaultLinks)
        getLocalLinks()
    }, [])

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

    const clickLink = useCallback((link) => {
        if (link.url) {
            chrome.tabs.create({ url: link.url })
            return
        }
        if (link.content) {
            copyText(link.content)
            return
        }
    })
    const deleteLink = useCallback((link, links) => {
        const index = links.indexOf(link)
        if (index === -1) {
            return
        }
        toast.success('删除成功')
        const allLinks = [...links]
        allLinks.splice(index, 1)
        setLinks(allLinks)
    })

    const renderLinks = useMemo(() => {
        return links.map(link => {
            return (
                <div className="link-item-wrap">
                    <div className="link-item" title={link.title} onClick={() => { clickLink(link) }}>{link.name}</div>
                    <div className="link-delete" onClick={() => { deleteLink(link, links) }}>
                        <img src="./delete.png" alt="" />
                    </div>
                </div>
            )
        })
    }, [links])

    const renderAddLinkView = useMemo(() => {
        return (
            <div className="links-add-wrap">
                <div className="link-name">
                    <span>名称：</span>
                    <input type="text" value={linkName} maxLength={10} />
                </div>
                <div className="link-title">
                    <span>描述：</span>
                    <input type="text" value={linkTitle} />
                </div>
                <div className="link-url">
                    <span>链接：</span>
                    <input type="text" value={linkUrl} />
                </div>
                <div className="link-content">
                    <span>内容：</span>
                    <textarea name="" id="" cols="30" rows="10" value={linkContent}></textarea>
                </div>
            </div>
        )
    })

    return (
        <div className="links-content">
            <div className="links-wrap">
                {renderLinks}
            </div>
            {/* { renderAddLinkView} */}
            <ToastContainer autoClose={1200} hideProgressBar></ToastContainer>
        </div>
    )
})

export default Links