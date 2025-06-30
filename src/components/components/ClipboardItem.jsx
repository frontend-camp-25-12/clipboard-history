import { format } from 'date-fns'
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
              // 多文件展示
              <div className="multiple-files">
                <div className="file-count">
                  共 {item.content.length} 个文件
                </div>
                <div className="file-list">
                  {item.content.slice(0, 3).map((file, index) => (
                    <div key={index} className="file-item">
                      <div className="file-name">{getFileName(file)}</div>
                    </div>
                  ))}
                  {item.content.length > 3 && (
                    <div className="file-more">
                      + {item.content.length - 3} 个文件
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // 单文件展示
              <>
                <div className="file-name">{getFileName(item.content)}</div>
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
