// src/pages/AddItem.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useInventory } from '../contexts/InventoryContext'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from 'react-i18next'
import './AddItem.css'

const AddItem = () => {
  const { t } = useTranslation()

  useEffect(() => {
    window.__ADD_ITEM_CHECK__ = Date.now()
    console.debug('[AddItem] mounted — __ADD_ITEM_CHECK__ set:', window.__ADD_ITEM_CHECK__)
  }, [])

  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    unit: 'pcs',
    category: '',
    description: '',
    minStock: ''
  })

  const [error, setError] = useState('')
  const [loadingLocal, setLoadingLocal] = useState(false)

  const { addItem } = useInventory()
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    console.debug('[AddItem] current user:', user)
  }, [user])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault()
    setError('')
    setLoadingLocal(true)

    if (authLoading) {
      setError(t('err_auth_loading', 'Authentication still loading — please wait a moment'))
      setLoadingLocal(false)
      return
    }

    if (!user) {
      setError(t('err_must_login', 'You must be logged in to add items.'))
      setLoadingLocal(false)
      return
    }

    if (!formData.name.trim()) {
      setError(t('err_name_required', 'Item name is required'))
      setLoadingLocal(false)
      return
    }

    if (!formData.category.trim()) {
      setError(t('err_category_required', 'Category is required'))
      setLoadingLocal(false)
      return
    }

    const quantity = Number(formData.quantity)
    if (isNaN(quantity) || quantity < 0) {
      setError(t('err_quantity_positive', 'Quantity must be a positive number'))
      setLoadingLocal(false)
      return
    }

    let minStock = null
    if (formData.minStock !== '' && formData.minStock !== null && formData.minStock !== undefined) {
      const m = Number(formData.minStock)
      if (isNaN(m) || m < 0) {
        setError(t('err_min_stock_nonneg', 'Minimum stock must be a non-negative number'))
        setLoadingLocal(false)
        return
      }
      minStock = Math.trunc(m)
    }

    const payload = {
      name: formData.name.trim(),
      quantity,
      unit: formData.unit || 'pcs',
      category: formData.category.trim(),
      description: formData.description.trim() || null,
      minStock
    }

    console.debug('[AddItem] prepared payload', payload)

    try {
      const result = await addItem(payload)
      console.debug('[AddItem] addItem result', result)

      if (result && result.success) {
        navigate('/')
      } else {
        const errMsg = result?.error?.message || result?.error || t('err_add_failed', 'Failed to add item')
        setError(typeof errMsg === 'object' ? JSON.stringify(errMsg) : errMsg)
        console.error('[AddItem] add failed:', errMsg, result)
      }
    } catch (err) {
      console.error('[AddItem] unexpected error', err)
      setError(err?.message || t('err_unexpected', 'An unexpected error occurred'))
    } finally {
      setLoadingLocal(false)
    }
  }

  const handleCancel = () => {
    navigate('/')
  }

  const submitDisabled = loadingLocal || authLoading || !user

  return (
    <div className="add-item-container">
      <div className="add-item-card">
        <div className="add-item-header">
          <h1>{t('add_item_title', 'Add New Item')}</h1>
          <p>{t('add_item_subtitle', 'Add a new item to your inventory')}</p>
        </div>

        <form onSubmit={handleSubmit} className="add-item-form" noValidate>
          {error && <div className="error-message">{error}</div>}

          {!user && !authLoading && (
            <div className="error-message">{t('err_must_login', 'You are not logged in. Please sign in to add items.')}</div>
          )}

          <div className="form-group">
            <label>{t('form_name', 'Item Name *')}</label>
            <input
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              disabled={submitDisabled}
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
                disabled={submitDisabled}
                required
              />
            </div>

            <div className="form-group">
              <label>{t('form_unit', 'Unit *')}</label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                disabled={submitDisabled}
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
              disabled={submitDisabled}
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
              disabled={submitDisabled}
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
              disabled={submitDisabled}
              placeholder={t('ph_min_stock', 'Leave empty for no threshold')}
            />
            <small className="hint">{t('hint_min_stock','When quantity ≤ this value the item is marked Low Stock.')}</small>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={handleCancel}
              className="cancel-btn"
              disabled={submitDisabled}
            >
              {t('form_cancel', 'Cancel')}
            </button>

            <button
              type="submit"
              className="submit-btn"
              disabled={submitDisabled}
            >
              {loadingLocal ? t('adding_item', 'Adding Item...') : t('form_save', 'Add Item')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddItem
