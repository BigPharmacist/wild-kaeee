import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [authView, setAuthView] = useState('login') // 'login' | 'forgot' | 'resetPassword'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [initializing, setInitializing] = useState(true)

  // Auth initialisieren
  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const searchParams = new URLSearchParams(window.location.search)
    const type = hashParams.get('type') || searchParams.get('type')
    const accessToken = hashParams.get('access_token')
    const refreshToken = hashParams.get('refresh_token')
    const isAuthLink = type === 'invite' || type === 'recovery'
    const hasAuthTokens = Boolean(accessToken && refreshToken)

    const initAuth = async () => {
      // If this is an invite or recovery link with tokens
      if (isAuthLink && hasAuthTokens) {
        const { data: { session: existingSession } } = await supabase.auth.getSession()
        if (existingSession) {
          setSession(existingSession)
          setAuthView('resetPassword')
          window.history.replaceState({}, document.title, window.location.pathname)
          setInitializing(false)
          return
        }

        // Set the new session from the tokens in the URL
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
        if (!error && data.session) {
          setSession(data.session)
          setAuthView('resetPassword')
          window.history.replaceState({}, document.title, window.location.pathname)
          setInitializing(false)
          return
        }
      }

      // Normal session check
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      if (session && isAuthLink) {
        setAuthView('resetPassword')
        window.history.replaceState({}, document.title, window.location.pathname)
      }
      setInitializing(false)
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      if (event === 'PASSWORD_RECOVERY') {
        setAuthView('resetPassword')
      }
      if (event === 'SIGNED_IN') {
        const nextHashParams = new URLSearchParams(window.location.hash.substring(1))
        const nextSearchParams = new URLSearchParams(window.location.search)
        const nextType = nextHashParams.get('type') || nextSearchParams.get('type')
        if (nextType === 'invite' || nextType === 'recovery') {
          setAuthView('resetPassword')
          window.history.replaceState({}, document.title, window.location.pathname)
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignIn = useCallback(async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setSuccessMessage('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setMessage(error.message)
    setLoading(false)
  }, [email, password])

  const handleForgotPassword = useCallback(async (e) => {
    e.preventDefault()
    if (!email.trim()) {
      setMessage('Bitte E-Mail-Adresse eingeben')
      return
    }
    setLoading(true)
    setMessage('')
    setSuccessMessage('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    })
    if (error) {
      setMessage(error.message)
    } else {
      setSuccessMessage('Falls ein Konto mit dieser E-Mail existiert, wurde ein Link zum Zurücksetzen gesendet.')
    }
    setLoading(false)
  }, [email])

  const handleResetPassword = useCallback(async (e) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setMessage('Passwörter stimmen nicht überein')
      return
    }
    if (newPassword.length < 6) {
      setMessage('Passwort muss mindestens 6 Zeichen lang sein')
      return
    }
    setLoading(true)
    setMessage('')
    setSuccessMessage('')
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      setMessage(error.message)
    } else {
      setSuccessMessage('Passwort erfolgreich geändert!')
      setNewPassword('')
      setConfirmPassword('')
      setAuthView('login')
    }
    setLoading(false)
  }, [newPassword, confirmPassword])

  const handleAuthViewChange = useCallback((view) => {
    setAuthView(view)
    setMessage('')
    setSuccessMessage('')
  }, [])

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut()
    setMessage('')
    setSuccessMessage('')
    setAuthView('login')
  }, [])

  const value = useMemo(() => ({
    // Session
    session,
    user: session?.user ?? null,
    userId: session?.user?.id ?? null,
    initializing,

    // Auth View State
    authView,
    setAuthView,

    // Form State
    email,
    setEmail,
    password,
    setPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    loading,
    message,
    successMessage,

    // Handlers
    handleSignIn,
    handleForgotPassword,
    handleResetPassword,
    handleAuthViewChange,
    handleSignOut,
  }), [
    session,
    initializing,
    authView,
    email,
    password,
    newPassword,
    confirmPassword,
    loading,
    message,
    successMessage,
    handleSignIn,
    handleForgotPassword,
    handleResetPassword,
    handleAuthViewChange,
    handleSignOut,
  ])

  // Loading-Spinner während der Initialisierung anzeigen
  if (initializing) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#DC2626] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-[#64748B]">Anmeldung wird geprüft...</p>
        </div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
