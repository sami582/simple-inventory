// src/pages/ReviewPage.jsx
import React from 'react'
import ReviewQR from '../components/ReviewQR'
import { useTranslation } from 'react-i18next'

export default function ReviewPage() {
  const { t } = useTranslation()
  return (
    <main className="main-content">
      <h1>{t('review_page_title', 'Review QR')}</h1>
      <p>{t('review_page_subtitle', 'Create a QR that links customers to your Google Reviews page')}</p>
      <ReviewQR />
    </main>
  )
}
