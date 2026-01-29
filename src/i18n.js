// UPDATED: src/i18n.js
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import HttpBackend from 'i18next-http-backend'

// Keep a reference on window for debugging and manual checks
if (typeof window !== 'undefined') {
  window.__i18n_init_time__ = Date.now()
}

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    // ONLY English and French now
    supportedLngs: ['en', 'fr'],
    debug: false,
    backend: {
      loadPath: '/locales/{{lng}}/translation.json'
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage']
    },
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false
    }
  })
  .then(() => {
    if (typeof window !== 'undefined') {
      window.i18n = i18n
      console.debug('[i18n] initialized, language=', i18n.language)
      try {
        const loaded = Object.keys(i18n.services.resourceStore.data || {})
        console.debug('[i18n] loaded resource languages:', loaded)
      } catch (e) { /* ignore */ }
    }
  })
  .catch(err => {
    if (typeof window !== 'undefined') {
      window.i18n = i18n
      console.error('[i18n] initialization failed', err)
    } else {
      console.error('[i18n] initialization failed (no window)', err)
    }
  })

export default i18n
