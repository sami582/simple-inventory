// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase, getCurrentSession, getCurrentUser } from '../services/supabaseClient'

const AuthContext = createContext()

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true

    const init = async () => {
      try {
        // Try both getSession and getUser to be resilient
        const currentSession = await getCurrentSession()
        const currentUser = await getCurrentUser()

        if (!mounted) return

        setSession(currentSession ?? null)

        // prefer the user from getCurrentUser if present (more explicit)
        setUser(currentUser ?? currentSession?.user ?? null)

        // eslint-disable-next-line no-console
        console.debug('[Auth] init — session:', !!currentSession, 'user:', currentUser?.email ?? currentSession?.user?.email ?? null)
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[Auth] init error', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    init()

    // Subscribe to auth state changes
    const { data } = supabase.auth.onAuthStateChange((event, sess) => {
      // sess is the session object, or null
      setSession(sess ?? null)
      setUser(sess?.user ?? null)

      // eslint-disable-next-line no-console
      console.debug('[Auth] onAuthStateChange', event, sess?.user?.email ?? null)
    })

    return () => {
      mounted = false
      try {
        if (data && typeof data.subscription?.unsubscribe === 'function') {
          data.subscription.unsubscribe()
        } else if (data && typeof data.unsubscribe === 'function') {
          data.unsubscribe()
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('[Auth] cleanup unsubscribe error', e)
      }
    }
  }, [])

  const signUp = async ({ email, password, metadata = {} }) => {
    setError(null)
    setLoading(true)
    try {
      const { data, error: err } = await supabase.auth.signUp({
        email,
        password,
        options: { data: metadata }
      })

      if (err) {
        setError(err.message || err)
        setLoading(false)
        return { success: false, error: err }
      }

      setLoading(false)
      return { success: true, data }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('signUp error', e)
      setError('Unexpected error')
      setLoading(false)
      return { success: false, error: e }
    }
  }

  const signIn = async ({ email, password }) => {
    setError(null)
    setLoading(true)
    try {
      const { data, error: err } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (err) {
        setError(err.message || err)
        setLoading(false)
        return { success: false, error: err }
      }

      // immediately update local state
      setSession(data.session ?? null)
      setUser(data.user ?? null)
      setLoading(false)
      return { success: true, data }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('signIn error', e)
      setError('Unexpected error')
      setLoading(false)
      return { success: false, error: e }
    }
  }

  const signOut = async () => {
    setLoading(true)
    setError(null)
    try {
      const { error: err } = await supabase.auth.signOut()
      if (err) {
        setError(err.message || err)
        setLoading(false)
        return { success: false, error: err }
      }
      setUser(null)
      setSession(null)
      setLoading(false)
      return { success: true }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('signOut error', e)
      setError('Unexpected error')
      setLoading(false)
      return { success: false, error: e }
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        error,
        signUp,
        signIn,
        signOut
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
