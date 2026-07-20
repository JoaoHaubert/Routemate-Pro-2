import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import { rowToCamel } from '../lib/caseMap.js'

const AuthContext = createContext(null)

// If Supabase's "Confirm email" is on, signUp() returns no session — the
// profile/tenant can't be provisioned until the user actually has an
// auth.uid() to run as. We stash what a pending signup was for here and
// finish provisioning it the moment a real session shows up (either
// immediately, if confirmation is off, or after the user clicks the
// confirmation link and signs in). This only works if that happens in
// the same browser, since it's read from localStorage.
const PENDING_KEY = 'fleetcost:pendingSignup'

// getSession() on mount and the onAuthStateChange('SIGNED_IN') listener
// can both resolve around the same time right after signUp(); without this
// guard both would call the provisioning RPC concurrently.
let pendingSignupInFlight = null

function consumePendingSignup() {
  if (pendingSignupInFlight) return pendingSignupInFlight
  pendingSignupInFlight = doConsumePendingSignup().finally(() => {
    pendingSignupInFlight = null
  })
  return pendingSignupInFlight
}

async function doConsumePendingSignup() {
  const raw = localStorage.getItem(PENDING_KEY)
  if (!raw) return
  const pending = JSON.parse(raw)
  try {
    if (pending.type === 'admin') {
      const { error } = await supabase.rpc('bootstrap_admin', { p_company_name: pending.companyName })
      if (error) throw error
    } else if (pending.type === 'driver') {
      const { error } = await supabase.rpc('join_fleet', {
        p_fleet_code: pending.fleetCode,
        p_full_name: pending.fullName,
        p_phone: pending.phone || null,
      })
      if (error) throw error
    }
    localStorage.removeItem(PENDING_KEY)
  } catch (err) {
    console.error('Failed to complete pending signup', err)
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null)
      return
    }
    let { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
    if (!data && localStorage.getItem(PENDING_KEY)) {
      await consumePendingSignup()
      ;({ data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle())
    }
    setProfile(rowToCamel(data))
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      loadProfile(data.session?.user?.id).finally(() => setLoading(false))
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      loadProfile(newSession?.user?.id)
    })

    return () => subscription.subscription.unsubscribe()
  }, [loadProfile])

  const signIn = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }, [])

  const signUpAdmin = useCallback(async (email, password, companyName) => {
    localStorage.setItem(PENDING_KEY, JSON.stringify({ type: 'admin', companyName: companyName || 'My Fleet' }))
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) {
      localStorage.removeItem(PENDING_KEY)
      throw error
    }
    if (!data.session) return { needsEmailConfirmation: true }
    await loadProfile(data.user.id)
    return { needsEmailConfirmation: false }
  }, [loadProfile])

  const signUpDriver = useCallback(async (email, password, fullName, phone, fleetCode) => {
    localStorage.setItem(PENDING_KEY, JSON.stringify({ type: 'driver', fullName, phone, fleetCode }))
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) {
      localStorage.removeItem(PENDING_KEY)
      throw error
    }
    if (!data.session) return { needsEmailConfirmation: true }
    await loadProfile(data.user.id)
    return { needsEmailConfirmation: false }
  }, [loadProfile])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  const value = { session, user: session?.user ?? null, profile, loading, signIn, signUpAdmin, signUpDriver, signOut }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
