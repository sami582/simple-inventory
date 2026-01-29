// src/contexts/InventoryContext.jsx
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { inventoryService } from '../services/inventoryService'
import { isLowStock } from '../utils/stockUtils'
import { useAuth } from './AuthContext'

const InventoryContext = createContext()

export const useInventory = () => {
  const context = useContext(InventoryContext)
  if (!context) throw new Error('useInventory must be used within InventoryProvider')
  return context
}

export const InventoryProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth()
  const [items, setItems] = useState([])
  const [activityLogs, setActivityLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // load when user changes (ensures RLS returns user-specific rows)
  useEffect(() => {
    if (authLoading) return

    if (!user) {
      setItems([])
      setActivityLogs([])
      return
    }

    loadItems()
    loadActivityLogs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading])

  const loadItems = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await inventoryService.getItems()
      if (res.success) {
        setItems(res.data)
        // eslint-disable-next-line no-console
        console.debug('[Inventory] loaded items:', res.data?.length ?? 0)
      } else {
        setError('Failed to load items')
        // eslint-disable-next-line no-console
        console.error('[Inventory] loadItems failed', res.error)
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('loadItems catch:', err)
      setError('Failed to load items')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadActivityLogs = useCallback(async () => {
    try {
      const res = await inventoryService.getActivityLogs()
      if (res.success) setActivityLogs(res.data)
      else {
        // eslint-disable-next-line no-console
        console.error('[Inventory] loadActivityLogs failed', res.error)
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('loadActivityLogs error:', err)
    }
  }, [])

  const getLowStockItems = useCallback(() => items.filter(i => isLowStock(i)), [items])

  const addItem = async (item) => {
    if (authLoading) return { success: false, error: 'Auth still loading' }
    if (!user) return { success: false, error: 'You must be logged in to add items' }

    setLoading(true)
    setError(null)

    const payload = {
      ...item,
      quantity: Number(item.quantity),
      minStock:
        item.minStock !== '' && item.minStock !== undefined
          ? Number(item.minStock)
          : null
    }

    // eslint-disable-next-line no-console
    console.debug('[InventoryContext] addItem payload', payload)

    const res = await inventoryService.addItem(payload)

    if (res.success) {
      // create activity entries (best-effort). DB trigger will set user_id.
      await inventoryService.logActivity(
        'ADD',
        payload.name,
        `Added ${payload.quantity} ${payload.unit || 'pcs'}`
      )

      if (isLowStock(payload)) {
        await inventoryService.logActivity(
          'LOW_STOCK',
          payload.name,
          `Quantity ${payload.quantity} ≤ min stock ${payload.minStock}`
        )
      }
    } else {
      setError(res.error?.message || res.error || 'Failed to add item')
    }

    await loadItems()
    await loadActivityLogs()
    setLoading(false)

    return res
  }

  const updateItem = async (id, updates) => {
    if (authLoading) return { success: false, error: 'Auth still loading' }
    if (!user) return { success: false, error: 'You must be logged in to update items' }

    setLoading(true)
    setError(null)

    const payload = {
      ...updates,
      quantity: Number(updates.quantity),
      minStock:
        updates.minStock !== '' && updates.minStock !== undefined
          ? Number(updates.minStock)
          : null
    }

    // eslint-disable-next-line no-console
    console.debug('[InventoryContext] updateItem payload', id, payload)

    const res = await inventoryService.updateItem(id, payload)

    if (res.success) {
      await inventoryService.logActivity(
        'UPDATE',
        payload.name,
        `Updated to ${payload.quantity} ${payload.unit || 'pcs'}`
      )

      if (isLowStock(payload)) {
        await inventoryService.logActivity(
          'LOW_STOCK',
          payload.name,
          `Quantity ${payload.quantity} ≤ min stock ${payload.minStock}`
        )
      }
    } else {
      setError(res.error?.message || res.error || 'Failed to update item')
    }

    await loadItems()
    await loadActivityLogs()
    setLoading(false)

    return res
  }

  const adjustQuantity = async (item, delta) => {
    const newQuantity = Number(item.quantity || 0) + Number(delta)
    return updateItem(item.id, {
      name: item.name,
      quantity: newQuantity,
      unit: item.unit,
      category: item.category,
      description: item.description,
      minStock: item.minStock
    })
  }

  const deleteItem = async (id) => {
    if (authLoading) return { success: false, error: 'Auth still loading' }
    if (!user) return { success: false, error: 'You must be logged in to delete items' }

    setLoading(true)
    const item = items.find(i => i.id === id)
    const res = await inventoryService.deleteItem(id)
    if (res.success && item) {
      await inventoryService.logActivity('DELETE', item.name, `Deleted item`)
    } else if (!res.success) {
      setError(res.error?.message || res.error || 'Failed to delete item')
    }
    await loadItems()
    await loadActivityLogs()
    setLoading(false)
    return res
  }

  const getItemById = async (id) => {
    try {
      const res = await inventoryService.getItemById(id)
      return res
    } catch (err) {
      return { success: false, error: 'Failed to get item' }
    }
  }

  return (
    <InventoryContext.Provider
      value={{
        items,
        activityLogs,
        loading,
        error,
        addItem,
        updateItem,
        adjustQuantity,
        deleteItem,
        getLowStockItems,
        getItemById,
        refreshItems: loadItems,
        refreshActivityLogs: loadActivityLogs // <-- exposed so assistant or other components can refresh logs
      }}
    >
      {children}
    </InventoryContext.Provider>
  )
}
