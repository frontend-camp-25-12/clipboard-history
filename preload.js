const Store = require('electron-store')
const clipboardListener = require('clipboard-event')
const { clipboard, nativeImage } = require('electron')
const fs = require('fs')
const path = require('path')

const store = new Store({
  name: 'clipboard-history-plugin',
  defaults: {
    history: [],
    settings: {
      enableAudio: true,
      shouldCapture: true,
      theme: 'system'
    }
  }
})

let lastContent = null
const IMAGE_EXTENSIONS = [
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.bmp',
  '.webp',
  '.tiff',
  '.svg'
]
const MAX_IMAGE_SIZE = 5 * 1024 * 1024
const MAX_HISTORY = 100000

// 音频资源
const audioPaths = {
  success: path.join(__dirname, './src/assets/sounds/success.mp3'),
  error: path.join(__dirname, './src/assets/sounds/error.mp3'),
  trash: path.join(__dirname, './src/assets/sounds/trash.mp3'),
  copy: path.join(__dirname, './src/assets/sounds/copy.mp3')
}

// 音频缓存
const audioCache = {}

// 预加载音频文件
function preloadAudios() {
  Object.keys(audioPaths).forEach((type) => {
    try {
      const data = fs.readFileSync(audioPaths[type])
      audioCache[type] = 'data:audio/mp3;base64,' + data.toString('base64')
    } catch (error) {
      console.error(`预加载音频 ${type} 失败:`, error)
    }
  })
}

// 播放音频函数
function playAudio(type) {
  const settings = store.get('settings')
  if (!settings.enableAudio) return

  const audioData = audioCache[type]
  if (!audioData) return

  try {
    const audio = new Audio(audioData)
    audio.play().catch((error) => {
      console.error('播放音频失败:', error)
    })
  } catch (error) {
    console.error('创建音频对象失败:', error)
  }
}

function checkClipboard() {
  const timestamp = new Date().toISOString()
  let handled = false
  let result = null

  // 1. 优先检测实际图像数据
  const image = clipboard.readImage('clipboard')
  if (!image.isEmpty()) {
    const curImage = image.toDataURL()
    if (curImage.startsWith('data:image/') && curImage.length > 50) {
      if (curImage !== lastContent) {
        lastContent = curImage
        result = {
          type: 'image',
          content: curImage,
          timestamp,
          preview: curImage,
          star: false
        }
        handled = true
      }
    }
  }

  // 2. 如果图像数据无效或未处理，检测文件路径
  if (!handled && clipboard.has('FileNameW')) {
    try {
      const buffer = clipboard.readBuffer('FileNameW')
      const filePath = buffer.toString('ucs2').replace(/\0/g, '')

      if (filePath && filePath.length > 0 && filePath !== lastContent) {
        lastContent = filePath

        const fileExt = path.extname(filePath).toLowerCase()
        const isImageFile = IMAGE_EXTENSIONS.includes(fileExt)

        // 如果是小图片文件，优先返回图像数据
        if (isImageFile && fs.existsSync(filePath)) {
          try {
            const stats = fs.statSync(filePath)
            if (stats.size <= MAX_IMAGE_SIZE) {
              const fileImage = nativeImage.createFromPath(filePath)
              const curImage = fileImage.toDataURL()

              if (curImage) {
                result = {
                  type: 'image',
                  content: curImage,
                  timestamp,
                  preview: curImage,
                  star: false
                }
                handled = true
              }
            }
          } catch (error) {
            console.error('读取图片文件失败:', error)
          }
        }

        // 如果未处理，返回文件路径
        if (!handled) {
          result = { type: 'file', content: filePath, timestamp, star: false }
          handled = true
        }
      }
    } catch (error) {
      console.error('读取 FileNameW 失败:', error)
    }
  }

  // 3. 如果前两者未处理，检测文本
  if (!handled) {
    const text = clipboard.readText()
    if (text && text !== lastContent) {
      lastContent = text
      result = { type: 'text', content: text, timestamp }
    }
  }

  return result
}

preloadAudios()

// 存储供渲染进程调用的API
const pluginAPI = {
  getStorageSize: () => {
    const storePath = store.path
    try {
      const stats = fs.statSync(storePath)
      return stats.size
    } catch (error) {
      console.error('获取存储文件大小失败:', error)
      return 0
    }
  },
  getHistory: () => store.get('history', []),
  getSettings: () => store.get('settings', {}),
  updateSettings: (settings) => store.set('settings', settings),
  deleteItem: (id) => {
    let history = store.get('history', [])
    history = history.filter((item) => item.timestamp !== id)
    store.set('history', history)
    return history
  },
  clearHistory: () => {
    store.set('history', [])
    playAudio('trash')
    return []
  },
  toggleStar: (id) => {
    let history = store.get('history', [])
    const index = history.findIndex((item) => item.timestamp === id)
    if (index !== -1) {
      history[index].star = !history[index].star
      store.set('history', history)
    }
    return history
  },
  copyToClipboard: (type, content) => {
    try {
      switch (type) {
        case 'text':
          clipboard.writeText(content)
          playAudio('copy')
          break

        case 'image':
          // 处理base64图片
          if (content.startsWith('data:image')) {
            const image = nativeImage.createFromDataURL(content)
            clipboard.writeImage(image)
            playAudio('copy')
          }
          // 处理文件路径图片
          else {
            const image = nativeImage.createFromPath(content)
            clipboard.writeImage(image)
            playAudio('copy')
          }
          break

        case 'file':
          if (fs.existsSync(content)) {
            const filePath = path.resolve(content)
            const buffer = Buffer.alloc((filePath.length + 1) * 2)
            buffer.write(filePath, 0, buffer.length - 2, 'utf16le')
            buffer.writeUInt16LE(0, buffer.length - 2)
            clipboard.writeBuffer('FileNameW', buffer)
            playAudio('copy')
          }
          break

        default:
          console.warn(`未知的复制类型: ${type}`)
      }
    } catch (error) {
      console.error('复制到剪贴板失败:', error)
    }
  },

  // 剪贴板监听管理
  startClipboardListening: (onUpdateCallback) => {
    clipboardListener.startListening()

    const changeHandler = () => {
      try {
        const settings = store.get('settings')
        if (!settings.shouldCapture) return

        const updatedContent = checkClipboard()
        if (updatedContent !== null) {
          let history = store.get('history', [])

          // 检查是否已有相同记录
          const existingIndex = history.findIndex(
            (item) =>
              item.type === updatedContent.type &&
              item.content === updatedContent.content
          )

          // 如果存在相同记录，移除旧记录
          if (existingIndex !== -1) {
            history.splice(existingIndex, 1)
          }

          // 添加新记录到数组开头
          history.unshift(updatedContent)

          // 播放成功音效
          if (settings.enableAudio) {
            playAudio('success')
          }

          // 限制历史记录数量
          if (history.length > MAX_HISTORY) {
            history = history.slice(0, MAX_HISTORY)
          }

          // 更新存储并通知渲染进程
          store.set('history', history)
          if (onUpdateCallback) onUpdateCallback(history)
        }
      } catch (error) {
        console.error('changeHandler 执行失败:', error)
      }
    }

    clipboardListener.on('change', changeHandler)

    // 返回停止监听函数
    return () => {
      clipboardListener.stopListening()
    }
  }
}

// 直接暴露到window对象
window.clipboardPlugin = pluginAPI
