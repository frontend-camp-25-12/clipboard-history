import React from 'react'
import ClipboardItem from './ClipboardItem'
import '../styles/components/HistoryList.css'

const HistoryList = ({
  history,
  onDelete,
  onCopy,
  onToggleStar,
  onCopySuccess
}) => {
  return (
    <div className="history-list">
      {history.map((item) => (
        <ClipboardItem
          key={item.timestamp}
          item={item}
          onDelete={onDelete}
          onCopy={onCopy}
          onToggleStar={onToggleStar}
          onCopySuccess={onCopySuccess}
        />
      ))}
    </div>
  )
}

export default HistoryList
