import '../styles/components/CategorySelector.css'
import {  useTranslation } from 'react-i18next'

const CategorySelector = ({ currentCategory, onChange, history }) => {
  const categoryCounts = {
    all: history.length,
    text: history.filter((item) => item.type === 'text').length,
    image: history.filter((item) => item.type === 'image').length,
    file: history.filter((item) => item.type === 'file').length,
    star: history.filter((item) => item.star).length
  }
  const { t } = useTranslation()
  return (
    <div className="category-selector">
      {['all', 'text', 'image', 'file', 'star'].map((category) => (
        <button
          key={category}
          className={`category-btn ${currentCategory === category ? 'active' : ''}`}
          onClick={() => onChange(category)}
        >
          {t(`category.${category}`)} {/* 使用翻译 */}
          <span className="count-badge">({categoryCounts[category]})</span>
        </button>
      ))}
    </div>
  )
}

export default CategorySelector
