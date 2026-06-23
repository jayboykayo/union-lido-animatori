import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, getProfile } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined) // undefined = loading
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Prendi sessione iniziale
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) loadProfile(session.user.id)
      else setLoading(false)
    })

    // Ascolta cambiamenti auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)
        if (session?.user) {
          await loadProfile(session.user.id)
        } else {
          setProfile(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const loadProfile = async (userId) => {
    const { data } = await getProfile(userId)
    setProfile(data)
    setLoading(false)
  }

  const refreshProfile = async () => {
  if (session?.user) await loadProfile(session.user.id)
}

  const value = {
    session,
    profile,
    loading,
    user: session?.user ?? null,
    isAuthenticated: !!session,
    isModerator: profile?.ruolo === 'moderatore',
    isCapo: profile?.ruolo === 'capo' || profile?.ruolo === 'moderatore',
    isAnimatore: profile?.ruolo === 'animatore',
    primoAccesso: profile?.primo_accesso === true,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve essere usato dentro AuthProvider')
  return ctx
}
