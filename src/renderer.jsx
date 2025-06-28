import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

import './styles/base.css'
import './styles/components/App.css'
import './styles/components/CategorySelector.css'
import './styles/components/ClipboardItem.css'
import './styles/components/HistoryList.css'
import './styles/components/Notification.css'
import './styles/components/SettingsModal.css'

const rootElement = document.getElementById('root')

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
} else {
  console.error('Root element not found!')
}
