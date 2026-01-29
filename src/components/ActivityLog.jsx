// src/components/ActivityLog.jsx
import { useState } from 'react'
import { useInventory } from '../contexts/InventoryContext'
import { useTranslation } from 'react-i18next'
import './ActivityLog.css'

const timeAgoLocalized = (date, locale, t) => {
  if (!date) return ''
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000)
  if (seconds < 60) return t('just_now', 'just now')
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60)
    if (typeof Intl !== 'undefined' && Intl.RelativeTimeFormat) {
      const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
      return rtf.format(-mins, 'minute')
    }
    return `${mins} ${t('mins_ago', 'min ago')}`
  }
  if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600)
    if (typeof Intl !== 'undefined' && Intl.RelativeTimeFormat) {
      const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
      return rtf.format(-hours, 'hour')
    }
    return `${hours}h ${t('ago', 'ago')}`
  }
  const days = Math.floor(seconds / 86400)
  if (typeof Intl !== 'undefined' && Intl.RelativeTimeFormat) {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
    return rtf.format(-days, 'day')
  }
  return `${days}d ${t('ago', 'ago')}`
}

const formatAction = (action, t) => {
  switch (action) {
    case 'ADD':
      return t('activity_add', 'Item added')
    case 'UPDATE':
      return t('activity_update', 'Item updated')
    case 'DELETE':
      return t('activity_delete', 'Item deleted')
    case 'LOW_STOCK':
      return t('activity_low_stock', 'Low stock alert')
    case 'ASSISTANT_SUGGEST':
      return t('activity_assistant_suggest', 'Assistant suggestion')
    default:
      return action
  }
}

const formatDetails = (log, t, locale) => {
  const details = typeof log.details === 'string' ? log.details.trim() : ''
  if (!details) return ''

  const action = log.action

  if (action === 'ADD') {
    const m = details.match(/Added\s+(\d+)\s+(\w+)/i)
    if (m) {
      const count = Number(m[1])
      const unit = m[2]
      return t('activity_added_details', '{{count}} {{unit}} added', { count, unit })
    }
  }

  if (action === 'UPDATE') {
    const m = details.match(/Updated\s+to\s+(\d+)\s+(\w+)/i)
    if (m) {
      const count = Number(m[1])
      const unit = m[2]
      return t('activity_updated_details', 'Updated to {{count}} {{unit}}', { count, unit })
    }
  }

  if (action === 'LOW_STOCK') {
    const m = details.match(/Quantity\s+(\d+).+min\s+stock\s+(\d+)/i)
    if (m) {
      const qty = Number(m[1])
      const min = Number(m[2])
      return t('activity_lowstock_details', '{{qty}} (min {{min}})', { qty, min })
    }
  }

  // For assistant suggestions we expect a semicolon-separated summary, return it nicely
  if (action === 'ASSISTANT_SUGGEST') {
    return details.split(';').map(s => s.trim()).filter(Boolean).join('\n')
  }

  return details
}

const ActivityLog = () => {
  const { t, i18n } = useTranslation()
  const locale = i18n.language || 'en'
  const { activityLogs } = useInventory()
  const [openId, setOpenId] = useState(null)

  if (!activityLogs || activityLogs.length === 0) {
    return (
      <div className="activity-log">
        <h3>{t('activity_recent', 'Recent Activity')}</h3>
        <p className="empty">{t('activity_no_activity', 'No activity yet')}</p>
      </div>
    )
  }

  return (
    <div className="activity-log">
      <h3>{t('activity_recent', 'Recent Activity')}</h3>

      <ul className="activity-list">
        {activityLogs.slice(0, 10).map(log => {
          const isOpen = openId === log.id
          const hasDetails = typeof log.details === 'string' && log.details.trim().length > 0

          return (
            <li
              key={log.id}
              className={`log-item ${String(log.action).toLowerCase()} ${isOpen ? 'open' : ''}`}
              onClick={() => setOpenId(isOpen ? null : log.id)}
            >
              <div className="log-main">
                <span className="log-action">
                  {formatAction(log.action, t)}
                </span>

                <span className="log-text" style={{ marginLeft: 8 }}>
                  <strong>{log.itemName}</strong>
                </span>

                <span className="log-time" style={{ marginLeft: 'auto' }}>
                  {timeAgoLocalized(log.createdAt, locale, t)}
                </span>
              </div>

              {isOpen && (
                <div className="log-details">
                  {hasDetails ? formatDetails(log, t, locale) : t('activity_no_details', 'No additional details')}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default ActivityLog
