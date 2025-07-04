import React, {
  memo,
  useRef,
  forwardRef,
  useState,
  useEffect,
  useCallback
} from 'react';
import { VariableSizeList } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import ClipboardItem from './ClipboardItem';
import '../styles/components/HistoryList.css';

const HistoryList = ({
  history,
  onDelete,
  onCopy,
  onToggleStar,
  onCopySuccess
}) => {
  const listRef = useRef();
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // 状态管理：存储每个项目的展开状态
  const [itemStates, setItemStates] = useState({});

  // 高度缓存（初始值150px）
  const sizeMap = useRef({});
  const setSize = useRef((index, size) => {
    sizeMap.current = { ...sizeMap.current, [index]: size };
    listRef.current.resetAfterIndex(index);
  }).current;

  // 获取项目高度（带缓存）
  const getItemSize = (index) => sizeMap.current[index] || 150;

  // 更新项目状态
  const updateItemState = useCallback((timestamp, newState) => {
    setItemStates((prev) => ({
      ...prev,
      [timestamp]: {
        ...prev[timestamp],
        ...newState
      }
    }));
  }, []);

  // 全局键盘事件处理
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 检查是否按下 Ctrl+C (Windows) 或 Cmd+C (Mac)
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && hoveredIndex !== null) {
        const item = history[hoveredIndex];
        if (item) {
          onCopy(item);
          onCopySuccess(item);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [hoveredIndex, history, onCopy, onCopySuccess]);

  // 行组件（使用forwardRef传递DOM引用）
  const Row = memo(
    forwardRef(({ index, style }, ref) => {
      const item = history[index];
      const itemState = itemStates[item.timestamp] || {};

      return (
        <div
          ref={ref}
          style={style}
          onMouseEnter={() => setHoveredIndex(index)}
          onMouseLeave={() => {
            if (hoveredIndex === index) setHoveredIndex(null);
          }}
        >
          <ClipboardItem
            item={item}
            onDelete={onDelete}
            onCopy={onCopy}
            onToggleStar={onToggleStar}
            onCopySuccess={onCopySuccess}
            reportHeight={(height) => setSize(index, height)}
            isHovered={hoveredIndex === index}
            itemState={itemState}
            updateItemState={updateItemState}
          />
        </div>
      );
    })
  );

  return (
    <div className="history-list">
      <AutoSizer>
        {({ height, width }) => (
          <VariableSizeList
            ref={listRef}
            height={height}
            width={width}
            itemCount={history.length}
            itemSize={getItemSize}
            overscanCount={5}
          >
            {Row}
          </VariableSizeList>
        )}
      </AutoSizer>
    </div>
  );
};

export default HistoryList;
