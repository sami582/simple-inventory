// src/pages/Login.jsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from 'react-i18next'
import './Login.css'

const Login = () => {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Basic validation
    if (!email || !password) {
      setError(t('err_enter_email_password', 'Please enter both email and password'))
      setLoading(false)
      return
    }

    if (!email.includes('@')) {
      setError(t('err_valid_email', 'Please enter a valid email address'))
      setLoading(false)
      return
    }

    try {
      const result = await signIn({ email, password })

      if (result && result.success) {
        navigate('/')
      } else {
        const msg =
          result?.error?.message ||
          result?.error ||
          t('err_login_failed', 'Login failed. Please check your credentials and try again.')
        setError(msg)
      }
    } catch (err) {
      setError(err?.message || t('err_unexpected', 'An unexpected error occurred. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>{t('app_name', 'Simple Inventory')}</h1>
          <p>{t('login_subtitle', 'Sign in to manage your inventory')}</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">{t('login_email', 'Email Address')}</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('ph_email', 'Enter your email')}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">{t('login_password', 'Password')}</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('ph_password', 'Enter your password')}
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="login-btn"
            disabled={loading}
          >
            {loading ? t('signing_in', 'Signing in...') : t('login_submit', 'Sign In')}
          </button>
        </form>

        <div className="login-footer">
          <p>
            {t('no_account', "Don't have an account?")} <Link to="/signup">{t('signup', 'Create one')}</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
