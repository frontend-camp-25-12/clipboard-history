import React from 'react'
import { useTranslation } from 'react-i18next'
import '../styles/components/SettingsModal.css'

const SettingsModal = ({ settings, onUpdate, onClose }) => {
  const { t } = useTranslation()
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
          <h2>{t('settings.title')}</h2> {/* 使用翻译 */}
          <button
            className="close-btn"
            onClick={onClose}
            title={t('button.close')} // 使用翻译
          >
            ×
          </button>
        </div>

        <div className="modal-content">
          <div className="setting-item">
            <label>{t('settings.enableAudio')}</label> {/* 使用翻译 */}
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
            <label>{t('settings.shouldCapture')}</label> {/* 使用翻译 */}
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
            <label>{t('settings.globalHotkey')}</label> {/* 使用翻译 */}
            <button className="hotkey-btn" onClick={openHotkeySettings}>
              {t('button.setHotkey')} {/* 使用翻译 */}
            </button>
          </div>

          <div className="info-box">
            <p>{t('settings.previewInfo')}</p> {/* 使用翻译 */}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsModal
