import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { mockAuth, mockDb } from '../lib/mockDb'
import type { User, UserRole } from '../lib/types'

interface AuthContextType {
  session: { user: { id: string } } | null
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, nome: string, perfil: UserRole) => Promise<{ error: string | null }>
  signOut: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<{ user: { id: string } } | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const loadUser = useCallback(async (id: string) => {
    const u = await mockDb.getUser(id)
    setUser(u)
  }, [])

  const refreshUser = useCallback(async () => {
    const sess = mockAuth.getSession()
    if (sess) await loadUser(sess.user.id)
  }, [loadUser])

  useEffect(() => {
    const saved = mockAuth.getSession()
    setSession(saved)
    if (saved) {
      loadUser(saved.user.id).finally(() => setLoading(false))
    } else {
      setLoading(false)
    }

    const { unsubscribe } = mockAuth.onAuthStateChange(s => {
      setSession(s)
      if (s) {
        loadUser(s.user.id)
      } else {
        setUser(null)
      }
    })
    return unsubscribe
  }, [loadUser])

  async function signIn(email: string, password: string) {
    return mockAuth.signIn(email, password)
  }

  async function signUp(email: string, password: string, nome: string, perfil: UserRole) {
    const result = await mockAuth.signUp(email, password, nome, perfil)
    if (!result.error && result.userId) {
      // Auto-login após cadastro
      _session = { user: { id: result.userId } }
      localStorage.setItem('sf_session', JSON.stringify(_session))
      setSession(_session)
      await loadUser(result.userId)
    }
    return { error: result.error }
  }

  function signOut() {
    mockAuth.signOut()
    setUser(null)
    setSession(null)
  }

  return (
    <AuthContext.Provider value={{ session, user, loading, signIn, signUp, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

// Acesso interno ao _session (necessário para auto-login no signUp)
let _session: { user: { id: string } } | null = null

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
