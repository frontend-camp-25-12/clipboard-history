import React from 'react'
import '../styles/components/CategorySelector.css'

const CategorySelector = ({ currentCategory, onChange, history }) => {
  // 统计各类别数量，添加收藏统计
  const categoryCounts = {
    all: history.length,
    text: history.filter((item) => item.type === 'text').length,
    image: history.filter((item) => item.type === 'image').length,
    file: history.filter((item) => item.type === 'file').length,
    star: history.filter((item) => item.star).length // 添加收藏统计
  }

  return (
    <div className="category-selector">
      {['all', 'text', 'image', 'file', 'star'].map((category) => (
        <button
          key={category}
          className={`category-btn ${
            currentCategory === category ? 'active' : ''
          }`}
          onClick={() => onChange(category)}
        >
          {
            {
              all: '全部',
              text: '文本',
              image: '图片',
              file: '文件',
              star: '收藏' // 添加收藏类别
            }[category]
          }
          <span className="count-badge">({categoryCounts[category]})</span>
        </button>
      ))}
    </div>
  )
}

export default CategorySelector
