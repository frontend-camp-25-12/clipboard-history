import React from 'react'
import '../styles/components/SettingsModal.css'

const SettingsModal = ({ settings, onUpdate, onClose }) => {
  const handleToggle = (key) => {
    console.log('Before:', settings)
    onUpdate({
      ...settings,
      [key]: !settings[key]
    })
  }

  const openHotkeySettings = () => {
    if (window.platform && window.platform.openHotkeySettings) {
      window.platform.openHotkeySettings('search')
    } else {
      alert('快捷键设置功能在当前环境中不可用')
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>设置</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-content">
          <div className="setting-item">
            <label>启用音效</label>
            <div className="switch">
              <input
                type="checkbox"
                checked={settings.enableAudio}
                onChange={() => handleToggle('enableAudio')}
              />
              <span className="slider"></span>
            </div>
          </div>

          <div className="setting-item">
            <label>监控剪贴板</label>
            <div className="switch">
              <input
                type="checkbox"
                checked={settings.shouldCapture}
                onChange={() => handleToggle('shouldCapture')}
              />
              <span className="slider"></span>
            </div>
          </div>

          <div className="setting-item">
            <label>全局快捷键</label>
            <button className="hotkey-btn" onClick={openHotkeySettings}>
              设置快捷键
            </button>
          </div>

          <div className="info-box">
            <p>图片文件预览仅支持小于 5MB 的图片</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsModal
