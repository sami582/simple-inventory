// src/utils/stockUtils.js
export function parseNumberSafe(value, fallback = 0) {
  if (value === null || value === undefined || value === '') return fallback
  const n = Number(value)
  return Number.isNaN(n) ? fallback : n
}

/**
 * Return true when an item is considered low stock.
 * - item.quantity and item.minStock may be number or string
 * - treat null/undefined minStock as "no threshold"
 */
export function isLowStock(item) {
  if (!item) return false
  // quantity fallback 0
  const q = parseNumberSafe(item.quantity, 0)
  // treat null/undefined/empty as no threshold
  if (item.minStock === null || item.minStock === undefined || item.minStock === '') return false
  const m = parseNumberSafe(item.minStock, null)
  if (m === null) return false
  return q <= m
}
