import format from 'date-fns/format';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/components/ClipboardItem.css';

const ClipboardItem = ({
  item,
  onDelete,
  onCopy,
  onToggleStar,
  onCopySuccess,
  reportHeight,
  isHovered
}) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [imageEnlarged, setImageEnlarged] = useState(false);
  const [expandedFiles, setExpandedFiles] = useState(false);
  const [fileStatusMap, setFileStatusMap] = useState({});

  const itemRef = useRef();

  const handleCopy = () => {
    onCopy(item);
    onCopySuccess(item);
  };

  const handleToggleStar = (e) => {
    e.stopPropagation();
    onToggleStar(item.timestamp);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(item.timestamp);
  };

  const toggleExpand = (e) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  const toggleImageEnlarge = (e) => {
    e.stopPropagation();
    setImageEnlarged(!imageEnlarged);
  };

  // 报告高度给父组件
  useEffect(() => {
    if (itemRef.current && reportHeight) {
      const height = itemRef.current.offsetHeight;
      reportHeight(height + 12);
    }
  }, [expanded, imageEnlarged, expandedFiles, reportHeight]);

  const toggleFileList = (e) => {
    e.stopPropagation();
    setExpandedFiles(!expandedFiles);
  };

  const openFile = (e, filePath) => {
    e.stopPropagation();
    try {
      const exists = window.clipboardPlugin.checkFileExists(filePath);

      // 2. 更新文件状态
      setFileStatusMap((prev) => ({
        ...prev,
        [filePath]: exists
      }));

      // 3. 如果文件存在则打开
      if (exists && window.clipboardPlugin.openFile) {
        window.clipboardPlugin.openFile(filePath);
      }
    } catch (error) {
      console.error('打开文件失败:', error);
      // 文件检查失败时标记为不存在
      setFileStatusMap((prev) => ({
        ...prev,
        [filePath]: false
      }));
    }
  };

  // 渲染文件项
  const renderFileItem = (file, index) => {
    const fileExists = fileStatusMap[file] !== false;

    return (
      <div
        key={index}
        className={`file-item ${fileExists ? '' : 'deleted'}`}
        onClick={(e) => openFile(e, file)}
        title={fileExists ? t('tooltip.openFile') : t('tooltip.fileDeleted')}
      >
        <div className="file-name">
          {getFileName(file)}
          {!fileExists && (
            <span className="file-deleted-badge">
              {t('tooltip.fileDeleted')}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div ref={itemRef} className="clipboard-item" onClick={handleCopy}>
      {isHovered && (
        <div className="copy-hint">
          <span>{t('tooltip.copy')}</span>
        </div>
      )}

      <div className="item-header">
        <span className="item-type">
          {item.type === 'text' && `📝 ${t('itemType.text')}`}
          {item.type === 'image' && `🖼️ ${t('itemType.image')}`}
          {item.type === 'file' &&
            (item.isImage
              ? `📷 ${t('itemType.imageFile')}`
              : Array.isArray(item.content)
                ? `📂 ${t('itemType.multipleFiles')}`
                : `📁 ${t('itemType.file')}`)}
        </span>
        <div className="item-actions">
          <button
            className={`star-btn ${item.star ? 'starred' : ''}`}
            onClick={handleToggleStar}
            title={item.star ? t('tooltip.unstar') : t('tooltip.star')}
          >
            {item.star ? '★' : '☆'}
          </button>
          <button
            className="delete-btn"
            onClick={handleDelete}
            title={t('tooltip.delete')}
          >
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
                {expanded ? t('button.collapse') : t('button.expand')}
              </button>
            )}
          </>
        )}

        {(item.type === 'image' || (item.type === 'file' && item.preview)) && (
          <div className="image-preview-container">
            <img
              src={item.type === 'image' ? item.content : item.preview}
              alt={
                item.type === 'image' ? t('itemType.image') : t('itemType.file')
              }
              className={`image-preview ${imageEnlarged ? 'enlarged' : ''}`}
              onClick={toggleImageEnlarge}
            />
            <button
              className="enlarge-btn"
              onClick={toggleImageEnlarge}
              title={imageEnlarged ? t('button.shrink') : t('button.enlarge')}
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
                  {t('fileInfo.multipleFiles', { count: item.content.length })}
                  {item.content.length > 3 && (
                    <button
                      className="file-expand-btn"
                      onClick={toggleFileList}
                    >
                      {expandedFiles
                        ? t('button.collapse')
                        : t('button.expand')}
                    </button>
                  )}
                </div>

                <div className={`file-list ${expandedFiles ? 'expanded' : ''}`}>
                  {item.content.map(renderFileItem)}
                </div>
              </div>
            ) : (
              <>
                {renderFileItem(item.content)}
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
  );
};

// 辅助函数：从路径获取文件名
function getFileName(path) {
  return path.split('\\').pop().split('/').pop();
}

export default ClipboardItem;
