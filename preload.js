const clipboardListener = require('clipboard-event');
const clipboardEx = require('electron-clipboard-ex');
const { clipboard, nativeImage, shell } = require('electron');
const fs = require('fs');
const path = require('path');

// ==================== 常量定义 ====================
const IMAGE_EXTENSIONS = [
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.bmp',
  '.webp',
  '.tiff',
  '.svg'
];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_HISTORY = 100000;
const SYNC_INTERVAL = 60 * 1000;

// ==================== 状态管理 ====================
let localStore = {
  history: [],
  settings: {
    enableAudio: true,
    shouldCapture: true,
    theme: 'system'
  }
};

let lastContent = [];
let syncTimer = null;
let isStoreInitialized = false;
let hasChanges = false;

// ==================== 工具函数 ====================
/**
 * 规范化文件路径
 * @param {string} filePath - 原始文件路径
 * @returns {string} 规范化后的路径
 */
function normalizePath(filePath) {
  try {
    return path.normalize(filePath);
  } catch (error) {
    console.error(`路径规范化失败: ${filePath}`, error);
    return filePath;
  }
}

/**
 * 比较剪贴板内容是否相同
 * @param {any} lastContent - 上一次的内容
 * @param {any} newContent - 新的内容
 * @returns {boolean} 是否相同
 */
function compareContent(lastContent, newContent) {
  try {
    if (Array.isArray(lastContent) && Array.isArray(newContent)) {
      return (
        lastContent.length === newContent.length &&
        lastContent.every((val, index) => val === newContent[index])
      );
    }
    return lastContent === newContent;
  } catch (error) {
    console.error('内容比较失败:', error);
    return false;
  }
}

// ==================== 存储管理 ====================
/**
 * 初始化本地存储
 */
async function initStore() {
  try {
    console.log('正在初始化本地存储...');

    const [history, settings] = await Promise.all([
      window.platform.configGet('clipboard.history', []),
      window.platform.configGet('clipboard.settings', {
        enableAudio: true,
        shouldCapture: true,
        theme: 'system'
      })
    ]);

    localStore.history = Array.isArray(history) ? history : [];
    localStore.settings = settings || localStore.settings;
    isStoreInitialized = true;

    console.log('本地存储初始化完成', {
      historyCount: localStore.history.length,
      settings: localStore.settings
    });
  } catch (error) {
    console.error('存储初始化失败:', error);
    isStoreInitialized = true; // 即使出错也标记完成，避免阻塞
  }
}

/**
 * 启动定时同步
 */
function startSyncTimer() {
  if (syncTimer) clearInterval(syncTimer);

  syncTimer = setInterval(async () => {
    if (hasChanges) {
      await syncToPlatform();
    } else {
      console.log('定时同步: 无变化，跳过');
    }
  }, SYNC_INTERVAL);
}

/**
 * 手动同步到平台
 */
async function syncToPlatform() {
  if (!hasChanges) {
    console.log('无变化，跳过同步');
    return;
  }
  try {
    console.log('开始手动同步...');
    await Promise.all([
      window.platform.configSet('clipboard.history', localStore.history),
      window.platform.configSet('clipboard.settings', localStore.settings)
    ]);
    console.log('手动同步完成');
    hasChanges = false;
  } catch (error) {
    console.error('手动同步失败:', error);
  }
}

// ==================== 音频管理 ====================
const audioPaths = {
  success: path.join(__dirname, './src/assets/sounds/success.mp3'),
  error: path.join(__dirname, './src/assets/sounds/error.mp3'),
  trash: path.join(__dirname, './src/assets/sounds/trash.mp3'),
  copy: path.join(__dirname, './src/assets/sounds/copy.mp3')
};

// 启动时验证音频路径
console.log('音频路径验证:', {
  success: fs.existsSync(audioPaths.success),
  error: fs.existsSync(audioPaths.error),
  trash: fs.existsSync(audioPaths.trash),
  copy: fs.existsSync(audioPaths.copy)
});

/**
 * 播放音频
 * @param {string} type - 音频类型 (success, error, trash, copy)
 */
function playAudio(type) {
  try {
    if (!localStore.settings.enableAudio) return;
    if (!audioPaths[type] || !fs.existsSync(audioPaths[type])) {
      console.warn(`音频文件不存在: ${type}`);
      return;
    }

    const audio = new Audio(audioPaths[type]);
    audio.volume = 0.5; // 设置合适音量

    audio.play().catch((error) => {
      if (error.name === 'NotAllowedError') {
        console.warn('播放被用户阻止，请检查浏览器设置');
      } else {
        console.error('播放失败:', error);
      }
    });
  } catch (error) {
    console.error('创建音频对象失败:', error);
  }
}

// ==================== 剪贴板检查 ====================
/**
 * 检查剪贴板内容
 * @returns {object|null} 剪贴板内容对象或null
 */
function checkClipboard() {
  try {
    const isWindows = process.platform === 'win32';
    const isMac = process.platform === 'darwin';

    if (!isWindows && !isMac) {
      console.warn('当前平台不支持剪贴板监听');
      return null;
    }

    const timestamp = new Date().toISOString();
    const filePaths = clipboardEx.readFilePaths();
    let result = null;

    // 处理多个文件
    if (filePaths.length > 1) {
      const isSame = compareContent(lastContent, filePaths);
      if (!isSame) {
        lastContent = filePaths;
        result = {
          type: 'file',
          content: filePaths,
          timestamp,
          isImage: false,
          star: false
        };
        console.log('检测到多个文件变更:', filePaths);
      }
      return result;
    }

    let handled = false;

    // 1. 优先检测图像数据
    const image = clipboard.readImage('clipboard');
    if (!image.isEmpty()) {
      const curImage = image.toDataURL();
      if (curImage.startsWith('data:image/') && curImage.length > 50) {
        if (!compareContent(curImage, lastContent)) {
          lastContent = curImage;
          result = {
            type: 'image',
            content: curImage,
            timestamp,
            preview: curImage,
            star: false
          };
          console.log('检测到图像数据');
          handled = true;
        }
      }
    }

    // 2. 检测文件路径
    if (!handled && clipboard.has('FileNameW')) {
      try {
        const buffer = clipboard.readBuffer('FileNameW');
        const filePath = buffer.toString('ucs2').replace(/\0/g, '');
        const normalizedPath = normalizePath(filePath);

        if (
          normalizedPath &&
          normalizedPath.length > 0 &&
          normalizedPath !== lastContent
        ) {
          lastContent = normalizedPath;

          const fileExt = path.extname(normalizedPath).toLowerCase();
          const isImageFile = IMAGE_EXTENSIONS.includes(fileExt);

          // 如果是小图片文件，优先返回图像数据
          if (isImageFile && fs.existsSync(normalizedPath)) {
            try {
              const stats = fs.statSync(normalizedPath);
              if (stats.size <= MAX_IMAGE_SIZE) {
                const fileImage = nativeImage.createFromPath(normalizedPath);
                const curImage = fileImage.toDataURL();

                if (curImage) {
                  result = {
                    type: 'image',
                    content: curImage,
                    timestamp,
                    preview: curImage,
                    star: false
                  };
                  handled = true;
                  console.log('检测到图像文件:', normalizedPath);
                }
              }
            } catch (error) {
              console.error('读取图片文件失败:', error);
            }
          }

          // 如果未处理，返回文件路径
          if (!handled) {
            result = {
              type: 'file',
              content: normalizedPath,
              timestamp,
              isImage: false,
              star: false
            };
            handled = true;
            console.log('检测到文件路径:', normalizedPath);
          }
        }
      } catch (error) {
        console.error('读取 FileNameW 失败:', error);
      }
    }

    // 3. 检测文本
    if (!handled) {
      const text = clipboard.readText();
      if (text && !compareContent(text, lastContent)) {
        lastContent = text;
        result = { type: 'text', content: text, timestamp, star: false };
        console.log(
          '检测到文本内容:',
          text.substring(0, 50) + (text.length > 50 ? '...' : '')
        );
      }
    }

    return result;
  } catch (error) {
    console.error('剪贴板检查失败:', error);
    return null;
  }
}

// ==================== 插件API ====================
const pluginAPI = {
  // 获取历史记录
  getHistory: () => {
    try {
      return localStore.history;
    } catch (error) {
      console.error('获取历史记录失败:', error);
      return [];
    }
  },

  // 获取设置
  getSettings: () => {
    try {
      return localStore.settings;
    } catch (error) {
      console.error('获取设置失败:', error);
      return {
        enableAudio: true,
        shouldCapture: true,
        theme: 'system'
      };
    }
  },

  // 更新设置
  updateSettings: (settings) => {
    try {
      console.log('更新设置:', settings);
      localStore.settings = settings;
      hasChanges = true;
      syncToPlatform();
    } catch (error) {
      console.error('更新设置失败:', error);
    }
  },

  // 删除项目
  deleteItem: (id) => {
    try {
      console.log(`删除项目: ${id}`);
      localStore.history = localStore.history.filter(
        (item) => item.timestamp !== id
      );
      hasChanges = true;
      syncToPlatform();
      return localStore.history;
    } catch (error) {
      console.error('删除项目失败:', error);
      return localStore.history;
    }
  },

  // 清空历史
  clearHistory: () => {
    try {
      console.log('清空历史记录');
      localStore.history = [];
      playAudio('trash');
      hasChanges = true;
      syncToPlatform();
      return [];
    } catch (error) {
      console.error('清空历史失败:', error);
      return localStore.history;
    }
  },

  // 切换收藏状态
  toggleStar: (id) => {
    try {
      console.log(`切换收藏状态: ${id}`);
      const newHistory = [...localStore.history];
      const index = newHistory.findIndex((item) => item.timestamp === id);

      if (index !== -1) {
        newHistory[index] = {
          ...newHistory[index],
          star: !newHistory[index].star
        };
        localStore.history = newHistory;
        hasChanges = true;
        syncToPlatform();
      }

      return newHistory;
    } catch (error) {
      console.error('切换收藏状态失败:', error);
      return localStore.history;
    }
  },

  // 复制到剪贴板
  copyToClipboard: (type, content) => {
    try {
      console.log(
        `复制内容: ${type}`,
        type === 'text'
          ? content.substring(0, 50) + (content.length > 50 ? '...' : '')
          : ''
      );

      switch (type) {
        case 'text':
          clipboard.writeText(content);
          playAudio('copy');
          break;

        case 'image':
          if (content.startsWith('data:image')) {
            const image = nativeImage.createFromDataURL(content);
            clipboard.writeImage(image);
          } else {
            const image = nativeImage.createFromPath(content);
            clipboard.writeImage(image);
          }
          playAudio('copy');
          break;

        case 'file':
          if (typeof content === 'string') {
            clipboardEx.writeFilePaths([content]);
          } else if (Array.isArray(content)) {
            clipboardEx.writeFilePaths(content);
          }
          playAudio('copy');
          break;

        default:
          console.warn(`未知的复制类型: ${type}`);
      }
    } catch (error) {
      console.error('复制到剪贴板失败:', error);
      playAudio('error');
    }
  },

  // 开始监听剪贴板
  startClipboardListening: (onUpdateCallback) => {
    try {
      console.log('启动剪贴板监听...');
      clipboardListener.startListening();

      const changeHandler = () => {
        try {
          // 如果存储尚未初始化，跳过处理
          if (!isStoreInitialized) {
            console.log('剪贴板变化但存储未初始化，跳过处理');
            return;
          }

          if (!localStore.settings.shouldCapture) return;

          const updatedContent = checkClipboard();
          if (updatedContent !== null) {
            hasChanges = true;
            let newHistory = [...localStore.history];

            // 检查是否已有相同记录
            const existingIndex = newHistory.findIndex(
              (item) =>
                item.type === updatedContent.type &&
                compareContent(item.content, updatedContent.content) === true
            );

            // 移除旧记录
            if (existingIndex !== -1) {
              newHistory.splice(existingIndex, 1);
            }

            // 添加新记录到开头
            newHistory.unshift(updatedContent);

            // 限制历史记录数量
            if (newHistory.length > MAX_HISTORY) {
              newHistory = newHistory.slice(0, MAX_HISTORY);
            }

            // 更新存储
            localStore.history = newHistory;

            // 通知渲染进程
            if (onUpdateCallback) onUpdateCallback(newHistory);

            // 播放音效
            if (localStore.settings.enableAudio) {
              playAudio('success');
            }

            console.log('剪贴板内容已添加到历史记录');
          }
        } catch (error) {
          console.error('剪贴板变化处理失败:', error);
        }
      };

      clipboardListener.on('change', changeHandler);

      // 返回停止监听函数
      return () => {
        try {
          console.log('停止剪贴板监听');
          clipboardListener.stopListening();
        } catch (error) {
          console.error('停止监听失败:', error);
        }
      };
    } catch (error) {
      console.error('启动剪贴板监听失败:', error);
      return () => {};
    }
  },

  // 检查文件是否存在
  checkFileExists: (filePath) => {
    try {
      const exists = fs.existsSync(filePath);
      console.log(`检查文件存在: ${filePath} - ${exists ? '存在' : '不存在'}`);
      return exists;
    } catch (error) {
      console.error(`检查文件存在失败: ${filePath}`, error);
      return false;
    }
  },

  // 打开文件
  openFile: (filePath) => {
    try {
      console.log(`打开文件: ${filePath}`);
      shell.openPath(filePath).then((error) => {
        if (error) {
          console.error('打开文件失败:', error);
          playAudio('error');
        }
      });
    } catch (error) {
      console.error('打开文件失败:', error);
      playAudio('error');
    }
  }
};

// ==================== 初始化 ====================
// 初始化存储并启动定时同步
initStore().then(() => {
  startSyncTimer();

  // 应用退出前同步数据
  window.addEventListener('beforeunload', async () => {
    console.log('应用退出，执行最终同步...');
    try {
      await syncToPlatform();
      console.log('最终同步完成');
    } catch (error) {
      console.error('最终同步失败:', error);
    }
  });
});

// 暴露API到全局对象
window.clipboardPlugin = pluginAPI;
console.log('剪贴板插件已初始化');
