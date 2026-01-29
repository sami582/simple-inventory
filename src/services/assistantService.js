// UPDATED: src/services/assistantService.js
import i18n from 'i18next'

function safeNum(v, fallback = 0) {
  if (v === null || v === undefined || v === '') return fallback
  const n = Number(v)
  return Number.isNaN(n) ? fallback : n
}

function findBelowMin(items) {
  return items.filter(i => {
    if (i.minStock === null || i.minStock === undefined) return false
    return safeNum(i.quantity) < safeNum(i.minStock)
  })
}

function findApproaching(items, percent = 0.25) {
  return items.filter(i => {
    if (i.minStock === null || i.minStock === undefined) return false
    const q = safeNum(i.quantity)
    const m = safeNum(i.minStock)
    if (m === 0) return false
    return q >= m && (q - m) <= Math.max(1, Math.floor(m * percent))
  })
}

function findSlowMoving(items) {
  return items.filter(i => {
    if (i.minStock === null || i.minStock === undefined) return false
    return safeNum(i.quantity) >= safeNum(i.minStock) * 5
  })
}

function shortList(items, max = 5, locale = 'en') {
  const nf = new Intl.NumberFormat(locale)
  return items.slice(0, max).map(i => `${i.name} (${nf.format(safeNum(i.quantity))} ${i.unit || 'pcs'} / min ${i.minStock ?? 'N/A'})`)
}

export async function generateResponse(items = [], message = '', locale = null) {
  const currentLang = i18n.language
  if (locale && locale !== currentLang) {
    try { i18n.changeLanguage(locale) } catch (e) { /* ignore */ }
  }

  const lang = i18n.language || locale || 'en'
  const nf = new Intl.NumberFormat(lang)
  const text = (message || '').trim().toLowerCase()

  const below = findBelowMin(items)
  const approaching = findApproaching(items)
  const slow = findSlowMoving(items)

  // English + French basic keywords (we removed Arabic tokens)
  const keywords = {
    low: ['low stock', 'low', 'running low', 'out of stock', 'low stock?', 'stock faible', 'faible', 'bas'],
    approaching: ['approach', 'almost', 'soon', 'within', 'presque', 'proche', 'bientôt'],
    restock: ['restock', 'buy now', 'what should i buy', 'what to buy', 'reorder', 'commander', 'acheter', 'que dois-je', 'que dois je'],
    slow: ['slow', 'not moving', 'stagnant', 'lent', 'rotation lente'],
    summary: ['explain', 'status', 'overview', 'how am i doing', 'summary', 'résumé', 'état']
  }

  const matches = (arr) => arr.some(k => text.includes(k))

  if (!text) {
    return {
      type: 'text',
      text: i18n.t('assistant_help', 'I can help with restock suggestions, low stock alerts, and inventory summaries. Try: "What should I buy now?" or "Show low stock".')
    }
  }

  if (matches(keywords.low)) {
    if (below.length === 0) {
      return { type: 'text', text: i18n.t('assistant_no_low', 'No items are currently at or below their minimum stock thresholds.') }
    }
    return {
      type: 'text',
      text: i18n.t('assistant_low_list', 'Low stock items ({{count}}):\n{{items}}', {
        count: below.length,
        items: shortList(below, 10, lang).join('\n• ')
      })
    }
  }

  if (matches(keywords.approaching)) {
    if (approaching.length === 0) {
      return { type: 'text', text: i18n.t('assistant_no_approach', 'No items are close to their minimum stock right now.') }
    }
    return { type: 'text', text: i18n.t('assistant_approaching_list', 'Items approaching min stock:\n{{items}}', { items: shortList(approaching, 10, lang).join('\n• ') }) }
  }

  if (matches(keywords.restock)) {
    if (below.length === 0) {
      if (slow.length === 0) {
        return { type: 'text', text: i18n.t('assistant_no_reorder', 'No urgent restock needed. Everything looks OK.') }
      }
      return { type: 'text', text: i18n.t('assistant_overstock_suggest', 'No urgent restock needed. These appear overstocked:\n{{items}}', { items: shortList(slow, 10, lang).join('\n• ') }) }
    }

    const lines = below.map(i => {
      const q = safeNum(i.quantity)
      const m = safeNum(i.minStock)
      const need = Math.max(0, m - q)
      const qS = nf.format(q)
      const needS = nf.format(need)
      const targetS = nf.format(m)
      return i18n.t('assistant_reorder_line', '{{name}}: current {{qty}} {{unit}} → order {{need}} {{unit}} (target ~{{target}})', {
        name: i.name,
        qty: qS,
        unit: i.unit || 'pcs',
        need: needS,
        target: targetS
      })
    })

    return { type: 'text', text: `${i18n.t('assistant_reorder_header', 'Recommended restock:')}\n${lines.join('\n')}` }
  }

  if (matches(keywords.slow)) {
    if (slow.length === 0) return { type: 'text', text: i18n.t('assistant_no_slow', 'No obvious slow-moving items detected.') }
    return { type: 'text', text: i18n.t('assistant_slow_list', 'Slow-moving / overstocked items:\n{{items}}', { items: shortList(slow, 10, lang).join('\n• ') }) }
  }

  if (matches(keywords.summary)) {
    const total = items.length
    return {
      type: 'text',
      text: i18n.t('assistant_summary', 'Inventory summary:\n• Items: {{total}}\n• Low: {{low}}\n• Approaching min: {{approach}}\n• Slow-moving: {{slow}}\nAsk "what should I buy now" for reorder suggestions.', {
        total,
        low: below.length,
        approach: approaching.length,
        slow: slow.length
      })
    }
  }

  return {
    type: 'text',
    text: i18n.t('assistant_fallback', "I didn't understand that exactly. Try: \"What should I buy now?\", \"Show low stock\", or \"Summary\".") +
      '\n\n' +
      i18n.t('assistant_low_list', 'Low stock items ({{count}}):\n{{items}}', {
        count: below.length,
        items: below.length ? shortList(below, 5, lang).join('\n• ') : i18n.t('assistant_no_low', 'No items are currently at or below their minimum stock thresholds.')
      })
  }
}

export const assistantService = {
  generateResponse
}
