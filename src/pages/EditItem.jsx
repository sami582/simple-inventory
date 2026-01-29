// src/pages/EditItem.jsx
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useInventory } from '../contexts/InventoryContext'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from 'react-i18next'
import './EditItem.css'

const EditItem = () => {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const { getItemById, updateItem } = useInventory()
  const { user } = useAuth()

  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    unit: 'pcs',
    category: '',
    description: '',
    minStock: ''
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    loadItem()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const loadItem = async () => {
    setLoading(true)
    setError('')
    try {
      const result = await getItemById(id)
      if (result.success) {
        const d = result.data
        setFormData({
          name: d.name || '',
          quantity: d.quantity != null ? String(d.quantity) : '',
          unit: d.unit || 'pcs',
          category: d.category || '',
          description: d.description || '',
          minStock: d.minStock != null ? String(d.minStock) : ''
        })
      } else {
        setNotFound(true)
        setError(result.error || t('err_item_not_found', 'Item not found'))
      }
    } catch (err) {
      console.error('loadItem error:', err)
      setNotFound(true)
      setError(t('err_failed_load_item', 'Failed to load item'))
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    if (!formData.name.trim()) {
      setError(t('err_name_required', 'Item name is required'))
      setSaving(false)
      return
    }

    if (!formData.category.trim()) {
      setError(t('err_category_required', 'Category is required'))
      setSaving(false)
      return
    }

    const quantity = Number(formData.quantity)
    if (isNaN(quantity) || quantity < 0) {
      setError(t('err_quantity_positive', 'Quantity must be a positive number'))
      setSaving(false)
      return
    }

    let minStock = null
    if (formData.minStock !== '' && formData.minStock !== null && formData.minStock !== undefined) {
      const m = Number(formData.minStock)
      if (isNaN(m) || m < 0) {
        setError(t('err_min_stock_nonneg', 'Minimum stock must be a non-negative number'))
        setSaving(false)
        return
      }
      minStock = Math.trunc(m)
    }

    const payload = {
      name: formData.name.trim(),
      quantity,
      unit: formData.unit,
      category: formData.category.trim(),
      description: formData.description.trim(),
      minStock
    }

    console.debug('[EditItem] payload', { id, payload })

    try {
      const result = await updateItem(id, payload)

      if (result.success) {
        navigate('/')
      } else {
        setError(result.error || t('err_update_failed', 'Failed to update item'))
      }
    } catch (err) {
      console.error('EditItem submit error:', err)
      setError(t('err_unexpected', 'An unexpected error occurred'))
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    navigate('/')
  }

  if (loading) {
    return (
      <div className="edit-item-container">
        <div className="loading">{t('loading_item', 'Loading item...')}</div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="edit-item-container">
        <div className="error-state">
          <h2>{t('item_not_found_title', 'Item Not Found')}</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/')} className="back-btn">
            {t('back_to_dashboard', 'Back to Dashboard')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="edit-item-container">
      <div className="edit-item-card">
        <div className="edit-item-header">
          <h1>{t('edit_item_title', 'Edit Item')}</h1>
          <p>{t('edit_item_subtitle', 'Update item details')}</p>
        </div>

        <form onSubmit={handleSubmit} className="edit-item-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label>{t('form_name', 'Item Name *')}</label>
            <input
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              disabled={saving}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>{t('form_quantity', 'Quantity *')}</label>
              <input
                name="quantity"
                type="number"
                min="0"
                value={formData.quantity}
                onChange={handleChange}
                disabled={saving}
                required
              />
            </div>

            <div className="form-group">
              <label>{t('form_unit', 'Unit *')}</label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                disabled={saving}
              >
                <option value="pcs">{t('unit_pcs', 'Pieces (pcs)')}</option>
                <option value="kg">{t('unit_kg', 'Kilograms (kg)')}</option>
                <option value="liters">{t('unit_liters', 'Liters')}</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>{t('form_category', 'Category *')}</label>
            <input
              name="category"
              type="text"
              value={formData.category}
              onChange={handleChange}
              disabled={saving}
              required
            />
          </div>

          <div className="form-group">
            <label>{t('form_description', 'Description')}</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <label>{t('form_min_stock', 'Minimum stock (optional)')}</label>
            <input
              name="minStock"
              type="number"
              min="0"
              value={formData.minStock}
              onChange={handleChange}
              disabled={saving}
              placeholder={t('ph_min_stock', 'Leave empty for no threshold')}
            />
            <small className="hint">{t('hint_min_stock','When quantity ≤ this value the item is marked Low Stock.')}</small>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={handleCancel}
              className="cancel-btn"
              disabled={saving}
            >
              {t('form_cancel', 'Cancel')}
            </button>

            <button
              type="submit"
              className="submit-btn"
              disabled={saving}
            >
              {saving ? t('saving_changes', 'Saving Changes...') : t('form_save', 'Save Changes')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditItem
