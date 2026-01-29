// src/components/Navbar.jsx
import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from 'react-i18next'
import './Navbar.css'
import LangSelector from './LangSelector'

const Navbar = () => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const handleLogout = async () => {
    try {
      const result = await signOut()
      if (result?.success) {
        navigate('/login')
      } else {
        console.error('Logout failed', result?.error)
      }
    } catch (err) {
      console.error('Logout error', err)
    }
  }

  const appName = t('app_name', 'Simple Inventory')

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <Link to="/" className="brand-link">
            📦 {appName}
          </Link>
        </div>

        <div className="navbar-actions">
          <Link to="/" className="nav-link">
            {t('dashboard', 'Dashboard')}
          </Link>

          <Link to="/assistant" className="nav-link">
            🤖 {t('assistant', 'Assistant')}
          </Link>

          {/* show Add Item only to logged users */}
          {user && (
            <Link to="/add-item" className="nav-link">
              {t('add_item', 'Add Item')}
            </Link>
          )}

          {/* NEW: Reviews link (visible to logged users) */}
          {user && (
            <Link to="/reviews" className="nav-link">
              {t('reviews', 'Reviews')}
            </Link>
          )}

          {/* centralized language selector (EN / FR only) */}
          <LangSelector className="lang-select" />

          {user ? (
            <>
              <span className="nav-user">
                {t('hello', 'Hi')}, {user.email}
              </span>
              <button onClick={handleLogout} className="logout-btn">
                {t('logout', 'Logout')}
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">
                {t('login', 'Login')}
              </Link>
              <Link to="/signup" className="nav-link">
                {t('signup', 'Sign up')}
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
