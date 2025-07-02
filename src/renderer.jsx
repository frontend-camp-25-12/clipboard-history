import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './i18n' // 确保i18n被加载

import './styles/base.css'
import './styles/components/App.css'
import './styles/components/CategorySelector.css'
import './styles/components/ClipboardItem.css'
import './styles/components/HistoryList.css'
import './styles/components/Notification.css'
import './styles/components/SettingsModal.css'

const rootElement = document.getElementById('root')

if (rootElement) {
  // 动态导入i18n以确保正确初始化
  const { default: i18n } = await import('./i18n')
  
  // 获取初始语言
  const initialLocale = await window.platform.getLocalePreference()
  i18n.changeLanguage(initialLocale)

  // 监听语言变化
  window.platform.onLocalePreferenceChange((newLocale) => {
    i18n.changeLanguage(newLocale)
  })

  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
} else {
  console.error('Root element not found!')
}
