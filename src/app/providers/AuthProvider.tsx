import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth'
import { auth } from '../../services/firebase/app'
import { isFirebaseConfigured } from '../../config/firebaseConfig'

interface AuthContextValue {
  configured: boolean
  loading: boolean
  user: User | null
  isAdmin: boolean
  signInAdmin: (email: string, password: string) => Promise<void>
  signOutAdmin: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

// Single source of Firebase auth state for the whole app. Public users get
// a transparent Anonymous Auth session (their poll-taking identity); an
// admin explicitly signs in with email/password. isAdmin reflects the
// `admin` custom claim on the ID token — this is read for UX only (to show
// the right screen); the real authorization boundary is firestore.rules,
// see docs/SECURITY.md. Never trust `isAdmin` from this context as a
// security check on its own.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const authInstance = auth
    if (!isFirebaseConfigured || !authInstance) {
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(authInstance, async (firebaseUser) => {
      if (!firebaseUser) {
        // No session at all yet — establish an anonymous one so the public
        // poll flow works with zero login friction.
        await signInAnonymously(authInstance).catch(() => undefined)
        return
      }

      const tokenResult = await firebaseUser.getIdTokenResult()
      setUser(firebaseUser)
      setIsAdmin(tokenResult.claims.admin === true)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  async function signInAdmin(email: string, password: string) {
    if (!auth) throw new Error('Firebase is not configured.')
    await signInWithEmailAndPassword(auth, email, password)
  }

  async function signOutAdmin() {
    if (!auth) return
    await signOut(auth)
  }

  return (
    <AuthContext.Provider value={{ configured: isFirebaseConfigured, loading, user, isAdmin, signInAdmin, signOutAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthState(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthState must be used within AuthProvider')
  return ctx
}
