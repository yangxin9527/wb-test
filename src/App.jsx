import React, { useState, useMemo, useCallback } from 'react'
import './App.less'
import Envs from './Envs'
import Links from './Links'
function App() {
  const items = [
    '账号环境',
    '常用链接',
  ]
  const [selectedItem, setSelectedItem] = useState('账号环境')


  const changeToItemContent = useCallback(
    (item) => {
      console.log(item, selectedItem)
      if (item !== selectedItem) {
        setSelectedItem(item)
      }
    }
  )

  const renderItems = useMemo(() => {
    return items.map((item) => {
      const isSelected = item === selectedItem
      return (
        <div className={isSelected ? 'func-item selected' : 'func-item'} onClick={() => { changeToItemContent(item) }}>
          {item}
        </div>
      )
    })
  }, [selectedItem, items])
  const renderItemContent = useMemo(() => {
    if (selectedItem === '账号环境') {
      return <Envs />
    }
    if (selectedItem === '常用链接') {
      return <Links />
    }

    return (
      <div className="unknow-content">未定义内容</div>
    )
  }, [selectedItem])

  return (
    <div className="app">
      <div className="app-header">
        <div className="left">
          <img src="./icon.png" alt="" />
          <span>微伴开发小助手</span>
        </div>
        <div className="right">
          <a href="http://gitlab.yiban.io/innovation-team/we-work-development-tool/-/issues" target="_blank" title="提建议、提问题">
            <img src="./feedback.png" alt="" />
          </a>
        </div>
      </div>
      <div className="app-func-wrap">
        {/* {renderItems} */}
      </div>
      <div className="app-content">
        <div className="func-content">
          {
            renderItemContent
          }
        </div>
      </div>
    </div>
  )
}

export default App
