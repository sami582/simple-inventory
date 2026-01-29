// src/services/inventoryService.js
import { supabase } from './supabaseClient.js'

// =======================
// INVENTORY SERVICE (client does NOT send user_id — DB trigger will set it)
// =======================

export async function getItems() {
  const { data, error } = await supabase
    .from('inventory')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getItems error:', error)
    return { success: false, data: [], error }
  }

  const formatted = (data || []).map(item => ({
    id: item.id,
    name: item.name,
    quantity: item.quantity === null || item.quantity === undefined ? 0 : item.quantity,
    category: item.category,
    minStock: item.min_stock !== null && item.min_stock !== undefined ? item.min_stock : null,
    description: item.description,
    unit: item.unit || 'pcs',
    createdAt: item.created_at,
    userId: item.user_id ?? null
  }))

  return { success: true, data: formatted }
}

export async function getItemById(id) {
  if (!id) return { success: false, error: 'Missing id' }

  const { data, error } = await supabase
    .from('inventory')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('getItemById error:', error)
    return { success: false, data: null, error }
  }

  const item = {
    id: data.id,
    name: data.name,
    quantity: data.quantity === null || data.quantity === undefined ? 0 : data.quantity,
    category: data.category,
    minStock: data.min_stock !== null && data.min_stock !== undefined ? data.min_stock : null,
    description: data.description,
    unit: data.unit || 'pcs',
    createdAt: data.created_at,
    userId: data.user_id ?? null
  }

  return { success: true, data: item }
}

export async function addItem(item) {
  // NOTE: do not send user_id from client. DB trigger will set it from auth.uid().
  const payload = {
    name: item.name,
    quantity: Number(item.quantity),
    unit: item.unit || 'pcs',
    category: item.category || null,
    min_stock: item.minStock ?? null,
    description: item.description || null
  }

  // eslint-disable-next-line no-console
  console.debug('[inventoryService] addItem payload', payload)

  // return inserted row(s) using .select()
  const { data, error } = await supabase.from('inventory').insert([payload]).select()

  if (error) {
    // eslint-disable-next-line no-console
    console.error('addItem error:', error)
    return { success: false, error }
  }

  return { success: true, data }
}

export async function updateItem(id, item) {
  if (!id) return { success: false, error: 'Missing id' }

  const payload = {
    name: item.name,
    quantity: Number(item.quantity),
    unit: item.unit || 'pcs',
    category: item.category || null,
    min_stock: item.minStock ?? null,
    description: item.description || null
  }

  // eslint-disable-next-line no-console
  console.debug('[inventoryService] updateItem payload', id, payload)

  const { data, error } = await supabase
    .from('inventory')
    .update(payload)
    .eq('id', id)
    .select()

  if (error) {
    // eslint-disable-next-line no-console
    console.error('updateItem error:', error)
    return { success: false, error }
  }

  return { success: true, data }
}

export async function deleteItem(id) {
  if (!id) return { success: false, error: 'Missing id' }

  const { data, error } = await supabase
    .from('inventory')
    .delete()
    .eq('id', id)
    .select()

  if (error) {
    // eslint-disable-next-line no-console
    console.error('deleteItem error:', error)
    return { success: false, error }
  }

  return { success: true, data }
}

// =======================
// ACTIVITY LOG
// =======================

export async function logActivity(action, itemName, details = '') {
  // DB trigger will set user_id from the authenticated session; we don't send it from client
  const payload = {
    action,
    item_name: itemName,
    details
  }

  // eslint-disable-next-line no-console
  console.debug('[inventoryService] logActivity payload', payload)

  const { data, error } = await supabase.from('activity_logs').insert([payload]).select()

  if (error) {
    // eslint-disable-next-line no-console
    console.error('logActivity error:', error)
    return { success: false, error }
  }

  return { success: true, data }
}

export async function getActivityLogs() {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('getActivityLogs error:', error)
    return { success: false, data: [], error }
  }

  const formatted = (data || []).map(log => ({
    id: log.id,
    action: log.action,
    itemName: log.item_name,
    details: log.details,
    createdAt: log.created_at,
    userId: log.user_id ?? null
  }))

  return { success: true, data: formatted }
}

export const inventoryService = {
  getItems,
  getItemById,
  addItem,
  updateItem,
  deleteItem,
  logActivity,
  getActivityLogs
}
