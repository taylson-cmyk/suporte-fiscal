import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { mockAuth, mockDb } from '../lib/mockDb'
import type { User, UserRole } from '../lib/types'

interface AuthContextType {
  session: { user: { id: string } } | null
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, nome: string, perfil: UserRole) => Promise<{ error: string | null }>
  signOut: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<{ user: { id: string } } | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadUser(id: string) {
    const u = await mockDb.getUser(id)
    setUser(u)
  }

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
      if (s) loadUser(s.user.id)
      else setUser(null)
    })
    return unsubscribe
  }, [])

  async function signIn(email: string, password: string) {
    return mockAuth.signIn(email, password)
  }

  async function signUp(email: string, password: string, nome: string, perfil: UserRole) {
    return mockAuth.signUp(email, password, nome, perfil)
  }

  function signOut() {
    mockAuth.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ session, user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
