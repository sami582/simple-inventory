import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import './ItemCard.css'
import { isLowStock } from '../utils/stockUtils'

const ItemCard = ({ item, onDelete, onAdjust }) => {
  const { t } = useTranslation()
  const [showDetails, setShowDetails] = useState(false)
  const low = isLowStock(item)
  const unit = item.unit || 'pcs'

  const toggleDetails = () => {
    setShowDetails(prev => !prev)
  }

  return (
    <div
      className={`item-card ${low ? 'low-stock' : ''}`}
      onClick={toggleDetails}
    >
      <div className="item-header">
        <div className="item-name">
          <h3>{item.name}</h3>
          {low && <span className="low-stock-badge">{t('low_stock', 'Low Stock')}</span>}
        </div>

        <div className="item-quantity">
          <span className="quantity-number">
            {Number(item.quantity ?? 0)} {unit}
          </span>
        </div>
      </div>

      <div className="item-category">
        <span className="category-tag">{item.category || t('uncategorized', 'Uncategorized')}</span>
      </div>

      {showDetails && (
        <div className="item-description">
          <p>
            {t('form_quantity', 'Quantity')}: <strong>{Number(item.quantity ?? 0)} {unit}</strong>
            <br />
            {t('min_stock_label', 'Minimum stock alert at')}: {' '}
            <strong>
              {item.minStock != null ? `${Number(item.minStock)} ${unit}` : t('na', 'N/A')}
            </strong>
          </p>
          {item.description && <p>{item.description}</p>}
        </div>
      )}

      <div
        className="item-footer"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="item-actions">
          <button aria-label={t('decrease_qty','Decrease quantity')} onClick={() => onAdjust(item, -1)}>➖</button>
          <button aria-label={t('increase_qty','Increase quantity')} onClick={() => onAdjust(item, 1)}>➕</button>

          <Link
            to={`/edit-item/${item.id}`}
            className="edit-btn"
            onClick={(e) => e.stopPropagation()}
          >
            {t('item_edit', 'Edit')}
          </Link>

          <button
            onClick={() => onDelete(item.id)}
            className="delete-btn"
          >
            {t('item_delete', 'Delete')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ItemCard
