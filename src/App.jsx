import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import CategorySelector from './components/CategorySelector';
import HistoryList from './components/HistoryList';
import Notification from './components/Notification';
import SettingsModal from './components/SettingsModal';

import './styles/components/App.css';

function App() {
  const { t } = useTranslation();
  const [history, setHistory] = useState([]);
  const [settings, setSettings] = useState({
    enableAudio: true,
    shouldCapture: true,
    theme: 'system'
  });
  const [showSettings, setShowSettings] = useState(false);
  const [currentCategory, setCurrentCategory] = useState('all');
  const [notification, setNotification] = useState({
    show: false,
    message: ''
  });
  const [theme, setTheme] = useState('light');

  // 使用useMemo优化过滤性能
  const filteredHistory = useMemo(() => {
    if (currentCategory === 'all') return history;
    if (currentCategory === 'star') return history.filter((item) => item.star);
    return history.filter((item) => item.type === currentCategory);
  }, [history, currentCategory]);

  const handleCategoryChange = (category) => {
    setCurrentCategory(category);
  };

  const stopClipboardRef = useRef(null);

  // 应用主题设置
  const applyTheme = (themeValue) => {
    document.documentElement.setAttribute('data-theme', themeValue);
    setTheme(themeValue);
  };

  useEffect(() => {
    // 初始化加载历史记录和设置
    const loadedSettings = window.clipboardPlugin.getSettings();
    setSettings(loadedSettings);
    const initialHistory = window.clipboardPlugin.getHistory();
    setHistory(initialHistory);

    // 初始化主题
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
      .matches
      ? 'dark'
      : 'light';

    // 优先使用用户设置的主题
    const userTheme = loadedSettings.theme || 'system';

    if (userTheme === 'system') {
      applyTheme(systemTheme);
    } else {
      applyTheme(userTheme);
    }

    // 开始监听剪贴板
    if (
      window.clipboardPlugin &&
      window.clipboardPlugin.startClipboardListening
    ) {
      stopClipboardRef.current = window.clipboardPlugin.startClipboardListening(
        (newHistory) => {
          setHistory(newHistory);
        }
      );
    }

    // 监听系统主题变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e) => {
      if (settings.theme === 'system') {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);

    // 组件卸载时停止监听
    return () => {
      if (stopClipboardRef.current) {
        stopClipboardRef.current();
      }
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, []);

  // 更新设置
  const handleUpdateSettings = (newSettings) => {
    console.log('New Settings:', newSettings);
    setSettings(newSettings);
    window.clipboardPlugin.updateSettings(newSettings);

    // 如果主题变化，立即应用
    if (newSettings.theme !== settings.theme) {
      if (newSettings.theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
          .matches
          ? 'dark'
          : 'light';
        applyTheme(systemTheme);
      } else {
        applyTheme(newSettings.theme);
      }
    }
  };

  // 快速切换主题
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    handleUpdateSettings({
      ...settings,
      theme: newTheme
    });
  };

  // 删除项目
  const handleDeleteItem = (timestamp) => {
    const newHistory = window.clipboardPlugin.deleteItem(timestamp);
    setHistory(newHistory);
  };

  // 清空历史
  const handleClearHistory = () => {
    const newHistory = window.clipboardPlugin.clearHistory();
    setHistory(newHistory);
  };

  // 复制到剪贴板
  const handleCopy = (item) => {
    try {
      window.clipboardPlugin.copyToClipboard(item.type, item.content);
    } catch (error) {
      console.error('复制失败:', error);
    }
  };

  // 切换收藏
  const handleToggleStar = (timestamp) => {
    const newHistory = window.clipboardPlugin.toggleStar(timestamp);
    setHistory(newHistory);
  };

  // 弹出消息
  const handleCopySuccess = () => {
    setNotification({ show: true, message: '复制成功！' });
    setTimeout(() => {
      setNotification({ show: false, message: '' });
    }, 2000);
  };

  const [categoryCounts, setCategoryCounts] = useState({
    all: 0,
    text: 0,
    image: 0,
    file: 0,
    star: 0
  });

  useEffect(() => {
    const newCounts = {
      all: history.length,
      text: 0,
      image: 0,
      file: 0,
      star: 0
    };

    history.forEach((item) => {
      if (item.type === 'text') newCounts.text++;
      if (item.type === 'image') newCounts.image++;
      if (item.type === 'file') newCounts.file++;
      if (item.star) newCounts.star++;
    });

    setCategoryCounts(newCounts);
  }, [history]);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>{t('appTitle')}</h1>
        <div className="controls">
          <button
            className="theme-btn"
            onClick={toggleTheme}
            title={t('tooltip.toggleTheme')}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>

          <button
            className="clear-btn"
            onClick={handleClearHistory}
            title={t('tooltip.clearHistory')}
          >
            🗑️
          </button>
          <button
            className="settings-btn"
            onClick={() => setShowSettings(true)}
            title={t('tooltip.settings')}
          >
            ⚙️
          </button>
        </div>
      </header>

      <CategorySelector
        currentCategory={currentCategory}
        onChange={handleCategoryChange}
        categoryCounts={categoryCounts}
      />

      <div className="storage-info">
        {t('storageInfo', { count: history.length })}
      </div>

      <HistoryList
        history={filteredHistory}
        onDelete={handleDeleteItem}
        onCopy={handleCopy}
        onToggleStar={handleToggleStar}
        onCopySuccess={handleCopySuccess}
      />

      {showSettings && (
        <SettingsModal
          settings={settings}
          onUpdate={handleUpdateSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {history.length === 0 && (
        <div className="empty-state">
          <p>{t('emptyState.line1')}</p>
          <p>{t('emptyState.line2')}</p>
        </div>
      )}

      <Notification show={notification.show} message={notification.message} />
    </div>
  );
}

export default App;
