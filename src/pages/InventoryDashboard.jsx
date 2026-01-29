// src/pages/InventoryDashboard.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useInventory } from '../contexts/InventoryContext'
import ItemCard from '../components/ItemCard'
import ActivityLog from '../components/ActivityLog'
import { generateInventoryReport } from '../utils/reportGenerator' // jsPDF generator (now supports Arabic shaping & font)
import generatePrintableReport from '../utils/printReport' // printable util
import { useTranslation } from 'react-i18next'
import './InventoryDashboard.css'

const InventoryDashboard = () => {
  const { t, i18n } = useTranslation()
  const {
    items,
    loading,
    error,
    deleteItem,
    adjustQuantity,
    getLowStockItems
  } = useInventory()

  const navigate = useNavigate()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showLowStockOnly, setShowLowStockOnly] = useState(false)
  const [lowStockItems, setLowStockItems] = useState([])
  const [reportRange, setReportRange] = useState('week')
  const [showRaw, setShowRaw] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.debug('[InventoryDashboard] mounted, items length:', items?.length)
  }, [])

  useEffect(() => {
    setLowStockItems(getLowStockItems())
  }, [items, getLowStockItems])

  const filteredItems = items.filter(item => {
    if (showLowStockOnly) {
      if (
        !(
          item.minStock !== null &&
          item.minStock !== undefined &&
          Number(item.quantity) <= Number(item.minStock)
        )
      ) {
        return false
      }
    }

    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase())

    const matchesCategory =
      selectedCategory === 'all' || item.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  const categories = ['all', ...Array.from(new Set(items.map(i => i.category)))]

  const handleDelete = async (id) => {
    if (window.confirm(t('confirm_delete', 'Delete this item?'))) {
      await deleteItem(id)
    }
  }

  const buildLabels = () => ({
    title: t('inventory_report_title', 'Inventory Report'),
    generatedOn: t('generated_on', 'Generated on'),
    summaryTitle: t('summary', 'Summary'),
    lowStockHeader: t('low_stock_alerts', 'Low Stock Alerts'),
    allGood: t('all_good', 'All items are above minimum stock levels ✅'),
    totalProductsLabel: t('total_products_label', 'Total products'),
    totalQuantityLabel: t('total_quantity_label', 'Total quantity in stock'),
    tableHeaders: [
      t('table_item', 'Item Name'),
      t('table_category', 'Category'),
      t('table_quantity', 'Quantity'),
      t('table_unit', 'Unit'),
      t('table_min_stock', 'Min Stock'),
      t('table_description', 'Description')
    ],
    printableNote: t('printable_note', '')
  })

  const handleDownloadReport = async () => {
    await generateInventoryReport({
      items: filteredItems.length ? filteredItems : items,
      labels: buildLabels(),
      locale: i18n.language || 'en'
    })
  }

  const handlePrintReport = () => {
    generatePrintableReport({
      items: filteredItems.length ? filteredItems : items,
      labels: buildLabels(),
      locale: i18n.language || 'en'
    })
  }

  const handleAddClick = (e) => {
    // eslint-disable-next-line no-console
    console.debug('[InventoryDashboard] Add button clicked, navigating to /add-item')
    navigate('/add-item')
  }

  if (loading && items.length === 0) {
    return <div className="loading">{t('loading_inventory', 'Loading inventory...')}</div>
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>{t('dashboard_title', 'Inventory Dashboard')}</h1>
          <p className="subtitle">{t('dashboard_subtitle', 'Fast stock tracking for small businesses')}</p>
        </div>

        <div className="dashboard-actions">
          <select
            value={reportRange}
            onChange={e => setReportRange(e.target.value)}
            className="report-range-select"
          >
            <option value="today">{t('today', 'Today')}</option>
            <option value="week">{t('this_week', 'This Week')}</option>
            <option value="lastWeek">{t('last_week', 'Last Week')}</option>
          </select>

          <button className="report-btn" onClick={handleDownloadReport}>
            📄 {t('download_report', 'Download Report')}
          </button>

          <button className="report-btn" onClick={handlePrintReport} style={{ marginLeft: 8 }}>
            🖨️ {t('print_report', 'Print Report')}
          </button>

          <button onClick={handleAddClick} className="add-item-btn" type="button" style={{ marginLeft: 12 }}>
            + {t('add_item', 'Add Item')}
          </button>
        </div>
      </div>

      <div className="stats-section">
        <div className="stat-card">
          <div className="stat-number">{items.length}</div>
          <div className="stat-label">{t('products', 'Products')}</div>
        </div>

        <div
          className={`stat-card low-stock clickable ${showLowStockOnly ? 'active' : ''}`}
          onClick={() => setShowLowStockOnly(prev => !prev)}
        >
          <div className="stat-number">{lowStockItems.length}</div>
          <div className="stat-label">{t('low_stock', 'Low Stock')} {showLowStockOnly && `(${t('filtered', 'Filtered')})`}</div>
        </div>

        <div style={{ marginLeft: 12 }}>
          <button onClick={() => setShowRaw(prev => !prev)}>
            {showRaw ? t('hide_raw', 'Hide raw items') : t('show_raw', 'Show raw items')}
          </button>
        </div>
      </div>

      <div className="filters-section">
        <input
          type="text"
          placeholder={t('search_placeholder', 'Search...')}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />

        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
        >
          {categories.map(cat => (
            <option key={String(cat)} value={cat}>
              {cat === 'all' ? t('all_categories', 'All Categories') : (cat || t('uncategorized', 'Uncategorized'))}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showRaw && (
        <pre style={{ maxHeight: 300, overflow: 'auto', background: '#fff', padding: 12 }}>
          {JSON.stringify(items, null, 2)}
        </pre>
      )}

      <div className="items-grid">
        {filteredItems.length === 0 ? (
          <div className="empty-state">
            <h3>{t('no_items_found', 'No items found')}</h3>
            <p>{t('try_changing_filters', 'Try changing filters')}</p>
          </div>
        ) : (
          filteredItems.map(item => (
            <ItemCard
              key={item.id}
              item={item}
              onDelete={handleDelete}
              onAdjust={adjustQuantity}
            />
          ))
        )}
      </div>

      <ActivityLog />
    </div>
  )
}

export default InventoryDashboard
