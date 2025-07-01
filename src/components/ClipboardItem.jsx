import format from 'date-fns/format'
import { useCallback, useEffect, useState } from 'react'
import '../styles/components/ClipboardItem.css'

const ClipboardItem = ({
  item,
  onDelete,
  onCopy,
  onToggleStar,
  onCopySuccess
}) => {
  const [expanded, setExpanded] = useState(false)
  const [imageEnlarged, setImageEnlarged] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [expandedFiles, setExpandedFiles] = useState(false)
  const [fileStatus, setFileStatus] = useState({})

  const handleCopy = () => {
    onCopy(item)
    onCopySuccess(item)
  }

  const handleToggleStar = (e) => {
    e.stopPropagation()
    onToggleStar(item.timestamp)
  }

  const handleDelete = (e) => {
    e.stopPropagation()
    onDelete(item.timestamp)
  }

  const toggleExpand = (e) => {
    e.stopPropagation()
    setExpanded(!expanded)
  }

  const toggleImageEnlarge = (e) => {
    e.stopPropagation()
    setImageEnlarged(!imageEnlarged)
  }

  const handleKeyDown = useCallback(
    (e) => {
      // 检查是否按下 Ctrl+C (Windows) 或 Cmd+C (Mac)
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        if (isHovered) {
          handleCopy()
        }
      }
    },
    [isHovered, handleCopy]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])

  useEffect(() => {
    if (item.type === 'file' && Array.isArray(item.content)) {
      const checkFiles = () => {
        const status = {}
        item.content.forEach((filePath) => {
          try {
            if (
              window.clipboardPlugin &&
              window.clipboardPlugin.checkFileExists
            ) {
              status[filePath] =
                window.clipboardPlugin.checkFileExists(filePath)
            }
          } catch (error) {
            console.error('检查文件存在失败:', error)
            status[filePath] = true
          }
        })
        setFileStatus(status)
      }

      // 初始检查
      checkFiles()

      // 添加定期检查（每1分钟检查一次）
      const interval = setInterval(checkFiles, 60000)

      return () => clearInterval(interval)
    }
  }, [item])

  const toggleFileList = (e) => {
    e.stopPropagation()
    setExpandedFiles(!expandedFiles)
  }

  const openFile = (e, filePath) => {
    e.stopPropagation()
    try {
      if (window.clipboardPlugin && window.clipboardPlugin.openFile) {
        window.clipboardPlugin.openFile(filePath)
      }
    } catch (error) {
      console.error('打开文件失败:', error)
    }
  }

  return (
    <div
      className="clipboard-item"
      onClick={handleCopy}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 添加悬停提示 */}
      {isHovered && (
        <div className="copy-hint">
          <span>点击复制</span>
          <span>或按 Ctrl+C</span>
        </div>
      )}

      <div className="item-header">
        <span className="item-type">
          {item.type === 'text' && '📝 文本'}
          {item.type === 'image' && '🖼️ 图片'}
          {item.type === 'file' &&
            (item.isImage
              ? '📷 图片文件'
              : Array.isArray(item.content)
                ? '📂 多个文件'
                : '📁 文件')}
        </span>
        <div className="item-actions">
          <button
            className={`star-btn ${item.star ? 'starred' : ''}`}
            onClick={handleToggleStar}
            title={item.star ? '取消收藏' : '收藏'}
          >
            {item.star ? '★' : '☆'}
          </button>
          <button className="delete-btn" onClick={handleDelete}>
            ×
          </button>
        </div>
      </div>

      <div className="item-content">
        {item.type === 'text' && (
          <>
            <div className={`text-content ${expanded ? 'expanded' : ''}`}>
              {item.content}
            </div>
            {item.content.length > 200 && (
              <button className="expand-btn" onClick={toggleExpand}>
                {expanded ? '收起' : '展开'}
              </button>
            )}
          </>
        )}

        {(item.type === 'image' || (item.type === 'file' && item.preview)) && (
          <div className="image-preview-container">
            <img
              src={item.type === 'image' ? item.content : item.preview}
              alt={item.type === 'image' ? '剪贴板图片' : '文件预览'}
              className={`image-preview ${imageEnlarged ? 'enlarged' : ''}`}
              onClick={toggleImageEnlarge}
            />
            <button
              className="enlarge-btn"
              onClick={toggleImageEnlarge}
              title={imageEnlarged ? '缩小图片' : '放大图片'}
            >
              {imageEnlarged ? '↗' : '⛶'}
            </button>
          </div>
        )}

        {item.type === 'file' && !item.isImage && (
          <div className="file-info">
            {Array.isArray(item.content) ? (
              <div className="multiple-files">
                <div className="file-count">
                  共 {item.content.length} 个文件
                  {item.content.length > 3 && (
                    <button
                      className="file-expand-btn"
                      onClick={toggleFileList}
                    >
                      {expandedFiles ? '收起' : '展开'}
                    </button>
                  )}
                </div>

                <div className={`file-list ${expandedFiles ? 'expanded' : ''}`}>
                  {item.content.map((file, index) => {
                    const fileExists = fileStatus[file] !== false
                    return (
                      <div
                        key={index}
                        className={`file-item ${fileExists ? '' : 'deleted'}`}
                        onClick={(e) => openFile(e, file)}
                        title={fileExists ? '点击打开文件' : '文件已被删除'}
                      >
                        <div className="file-name">
                          {getFileName(file)}
                          {!fileExists && (
                            <span className="file-deleted-badge">已删除</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <>
                <div
                  className={`file-item ${fileStatus[item.content] !== false ? '' : 'deleted'}`}
                  onClick={(e) => openFile(e, item.content)}
                  title={
                    fileStatus[item.content] !== false
                      ? '点击打开文件'
                      : '文件已被删除'
                  }
                >
                  <div className="file-name">
                    {getFileName(item.content)}
                    {fileStatus[item.content] === false && (
                      <span className="file-deleted-badge">已删除</span>
                    )}
                  </div>
                </div>
                <div className="file-path">{item.content}</div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="item-footer">
        {format(new Date(item.timestamp), 'yyyy-MM-dd HH:mm:ss')}
      </div>
    </div>
  )
}

// 辅助函数：从路径获取文件名
function getFileName(path) {
  return path.split('\\').pop().split('/').pop()
}

export default ClipboardItem
