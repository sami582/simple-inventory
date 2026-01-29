// src/pages/Signup.jsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from 'react-i18next'
import './Signup.css'

const Signup = () => {
  const { t } = useTranslation()
  const { signUp, loading: authLoading, error: authError } = useAuth()
  const [form, setForm] = useState({ email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.email || !form.password) {
      setError(t('err_email_password_required', 'Email and password are required.'))
      return
    }
    if (form.password.length < 6) {
      setError(t('err_password_length', 'Password must be at least 6 characters.'))
      return
    }
    if (form.password !== form.confirm) {
      setError(t('err_password_match', 'Passwords do not match.'))
      return
    }

    const res = await signUp({ email: form.email, password: form.password })
    if (res.success) {
      navigate('/login', { replace: true })
    } else {
      setError(res.error?.message || t('err_signup_failed', 'Signup failed'))
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>{t('signup_title', 'Create Account')}</h1>
        <p>{t('signup_subtitle', 'Sign up and start tracking inventory.')}</p>

        <form onSubmit={handleSubmit} className="auth-form">
          {(error || authError) && (
            <div className="error-message" role="alert">{error || authError}</div>
          )}

          <div className="form-group">
            <label>{t('login_email', 'Email')}</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>{t('login_password', 'Password')}</label>
            <input name="password" type="password" value={form.password} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>{t('confirm_password', 'Confirm Password')}</label>
            <input name="confirm" type="password" value={form.confirm} onChange={handleChange} required />
          </div>

          <div className="form-actions">
            <button type="submit" className="submit-btn" disabled={authLoading}>
              {authLoading ? t('creating_account', 'Creating account...') : t('signup_submit', 'Create Account')}
            </button>
            <Link to="/login" className="link-btn">{t('already_have_account', 'Already have an account?')}</Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Signup
