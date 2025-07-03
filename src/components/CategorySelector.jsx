import { useTranslation } from 'react-i18next';
import '../styles/components/CategorySelector.css';

const CategorySelector = ({ currentCategory, onChange, categoryCounts }) => {
  const { t } = useTranslation();

  return (
    <div className="category-selector">
      {['all', 'text', 'image', 'file', 'star'].map((category) => (
        <button
          key={category}
          className={`category-btn ${currentCategory === category ? 'active' : ''}`}
          onClick={() => onChange(category)}
        >
          {t(`category.${category}`)}
          <span className="count-badge">({categoryCounts[category]})</span>
        </button>
      ))}
    </div>
  );
};

export default CategorySelector;
