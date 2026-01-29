// UPDATED: src/components/LangSelector.jsx
import React from 'react'
import { useTranslation } from 'react-i18next'

const options = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' }
]

const LangSelector = ({ className = '' }) => {
  const { i18n } = useTranslation()

  const change = (lng) => {
    i18n.changeLanguage(lng)
    try {
      localStorage.setItem('i18nextLng', lng)
    } catch (e) {
      // ignore
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lng
      // keep everything LTR only now
      document.documentElement.dir = 'ltr'
    }
  }

  React.useEffect(() => {
    const lng = i18n.language || localStorage.getItem('i18nextLng') || 'en'
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lng
      document.documentElement.dir = 'ltr'
    }
  }, [i18n.language])

  return (
    <select
      value={i18n.language || 'en'}
      onChange={(e) => change(e.target.value)}
      className={className}
      aria-label="Select language"
      style={{ padding: '6px 8px' }}
    >
      {options.map(o => (
        <option key={o.code} value={o.code}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

export default LangSelector
