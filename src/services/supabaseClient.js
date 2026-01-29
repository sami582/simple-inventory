// src/services/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  // eslint-disable-next-line no-console
  console.error('[supabaseClient] MISSING env vars: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // explicit localStorage so sessions persist across tabs/refreshes
    storage: window.localStorage
  }
})

// Helper to log the initial session (useful for debugging)
;(async function debugSessionOnLoad() {
  try {
    const {
      data: { session }
    } = await supabase.auth.getSession()

    // eslint-disable-next-line no-console
    console.debug('[supabaseClient] initial session present:', !!session)

    if (session) {
      // eslint-disable-next-line no-console
      console.debug('[supabaseClient] initial session user:', session.user?.email ?? session.user?.id)
    } else {
      // eslint-disable-next-line no-console
      console.debug('[supabaseClient] no session on load (expected in fresh anonymous)', session)
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[supabaseClient] error reading initial session', err)
  }
})()

// export small helpers that services can call
export async function getCurrentSession() {
  const {
    data: { session }
  } = await supabase.auth.getSession()
  return session
}

export async function getCurrentUser() {
  try {
    // Supabase v2 getUser returns { data: { user }, error}
    const { data, error } = await supabase.auth.getUser()
    if (error) {
      // eslint-disable-next-line no-console
      console.debug('[supabaseClient] getCurrentUser error', error)
      return null
    }
    return data?.user ?? null
  } catch (e) {
    // eslint-disable-next-line no-console
    console.debug('[supabaseClient] getCurrentUser catch', e)
    return null
  }
}
