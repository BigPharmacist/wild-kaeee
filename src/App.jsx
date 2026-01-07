import { useState, useEffect, useRef } from 'react'
import { supabase } from './lib/supabase'

// SVG Icons as components for modern look
const Icons = {
  Sun: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  Moon: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  ),
  Home: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  Chart: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  Settings: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Logout: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
  Menu: () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  X: () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
}

function App() {
  const [session, setSession] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [sidebarWidth, setSidebarWidth] = useState(256)
  const [darkMode, setDarkMode] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const isResizing = useRef(false)

  // Modern color palette with Slate + Violet accent
  const theme = darkMode ? {
    // Backgrounds
    bg: 'bg-slate-950',
    bgSecondary: 'bg-slate-900',
    bgTertiary: 'bg-slate-800',
    bgHover: 'hover:bg-slate-800',
    // Borders
    border: 'border-slate-800',
    borderLight: 'border-slate-700',
    // Text
    text: 'text-slate-50',
    textSecondary: 'text-slate-300',
    textMuted: 'text-slate-400',
    // Navigation
    navActive: 'bg-violet-600/20 text-violet-400',
    navHover: 'hover:bg-slate-800 hover:text-slate-200',
    // Inputs
    input: 'bg-slate-800 border-slate-700 focus:border-violet-500 focus:ring-1 focus:ring-violet-500',
    inputPlaceholder: 'placeholder-slate-500',
    // Accent
    accent: 'bg-violet-600 hover:bg-violet-500',
    accentText: 'text-violet-400',
    // Resize handle
    resizeHandle: 'bg-slate-800 hover:bg-violet-500',
    // Danger
    danger: 'text-rose-400 hover:text-rose-300 hover:bg-rose-500/10',
    // Card
    cardShadow: 'shadow-2xl shadow-slate-950/50',
  } : {
    // Backgrounds
    bg: 'bg-slate-50',
    bgSecondary: 'bg-white',
    bgTertiary: 'bg-slate-100',
    bgHover: 'hover:bg-slate-100',
    // Borders
    border: 'border-slate-200',
    borderLight: 'border-slate-300',
    // Text
    text: 'text-slate-900',
    textSecondary: 'text-slate-600',
    textMuted: 'text-slate-500',
    // Navigation
    navActive: 'bg-violet-100 text-violet-700',
    navHover: 'hover:bg-slate-100 hover:text-slate-900',
    // Inputs
    input: 'bg-white border-slate-300 focus:border-violet-500 focus:ring-1 focus:ring-violet-500',
    inputPlaceholder: 'placeholder-slate-400',
    // Accent
    accent: 'bg-violet-600 hover:bg-violet-700',
    accentText: 'text-violet-600',
    // Resize handle
    resizeHandle: 'bg-slate-200 hover:bg-violet-500',
    // Danger
    danger: 'text-rose-600 hover:text-rose-700 hover:bg-rose-50',
    // Card
    cardShadow: 'shadow-xl shadow-slate-200/50',
  }

  const startResizing = () => {
    isResizing.current = true
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', stopResizing)
  }

  const handleMouseMove = (e) => {
    if (!isResizing.current) return
    const newWidth = e.clientX
    if (newWidth >= 64 && newWidth <= 320) {
      setSidebarWidth(newWidth)
    }
  }

  const stopResizing = () => {
    isResizing.current = false
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', stopResizing)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignIn = async (e) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setMessage(error.message)
    else setMessage('')
    setLoading(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setMessage('')
    setMobileMenuOpen(false)
  }

  const navItems = [
    { icon: Icons.Home, label: 'Dashboard', active: true },
    { icon: Icons.Chart, label: 'Statistiken', active: false },
    { icon: Icons.Settings, label: 'Einstellungen', active: false },
  ]

  // Dashboard view
  if (session) {
    return (
      <div className={`min-h-screen ${theme.bg} ${theme.text} flex flex-col`}>
        {/* Header */}
        <header className={`${theme.bgSecondary} border-b ${theme.border} px-4 lg:px-6 py-3 flex items-center justify-between sticky top-0 z-40`}>
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`lg:hidden p-2 rounded-lg ${theme.bgHover} ${theme.textMuted}`}
            >
              {mobileMenuOpen ? <Icons.X /> : <Icons.Menu />}
            </button>
            <h1 className="text-xl font-semibold tracking-tight">Kaeee</h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Theme toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg ${theme.bgHover} ${theme.textMuted} transition-colors`}
              title={darkMode ? 'Hellmodus' : 'Dunkelmodus'}
            >
              {darkMode ? <Icons.Sun /> : <Icons.Moon />}
            </button>

            {/* User email - hidden on mobile */}
            <span className={`hidden sm:block ${theme.textMuted} text-sm truncate max-w-[200px]`}>
              {session.user.email}
            </span>

            {/* Sign out button */}
            <button
              onClick={handleSignOut}
              className={`p-2 rounded-lg ${theme.danger} transition-colors`}
              title="Ausloggen"
            >
              <Icons.Logout />
            </button>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden relative">
          {/* Mobile sidebar overlay */}
          {mobileMenuOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-30 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
          )}

          {/* Sidebar */}
          <aside
            className={`
              ${theme.bgSecondary} border-r ${theme.border}
              flex-shrink-0 overflow-hidden z-40
              fixed lg:relative inset-y-0 left-0 top-[57px] lg:top-0
              transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
              transition-transform duration-200 ease-out
              w-64 lg:w-auto
            `}
            style={{ width: typeof window !== 'undefined' && window.innerWidth >= 1024 ? sidebarWidth : undefined }}
          >
            <nav className="p-3 space-y-1">
              {navItems.map((item, index) => (
                <a
                  key={index}
                  href="#"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium
                    transition-colors whitespace-nowrap overflow-hidden
                    ${item.active ? theme.navActive : `${theme.textMuted} ${theme.navHover}`}
                  `}
                >
                  <item.icon />
                  {(sidebarWidth > 100 || mobileMenuOpen) && <span>{item.label}</span>}
                </a>
              ))}
            </nav>
          </aside>

          {/* Resize Handle - hidden on mobile */}
          <div
            className={`hidden lg:block w-1 ${theme.resizeHandle} cursor-col-resize flex-shrink-0 transition-colors`}
            onMouseDown={startResizing}
          />

          {/* Main Content */}
          <main className="flex-1 p-4 lg:p-8 overflow-auto">
            <div className="max-w-4xl">
              <h2 className="text-2xl lg:text-3xl font-semibold mb-6 tracking-tight">Dashboard</h2>

              <div className={`${theme.bgSecondary} rounded-2xl p-6 lg:p-8 border ${theme.border} ${theme.cardShadow}`}>
                <h3 className={`text-lg font-medium mb-2 ${theme.text}`}>Willkommen bei Kaeee</h3>
                <p className={theme.textMuted}>
                  Dein persönliches Dashboard ist bereit.
                </p>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  // Login view
  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} flex items-center justify-center p-4`}>
      <div className={`${theme.bgSecondary} p-6 sm:p-8 rounded-2xl border ${theme.border} ${theme.cardShadow} max-w-sm w-full`}>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Kaeee</h1>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-lg ${theme.bgHover} ${theme.textMuted} transition-colors`}
            title={darkMode ? 'Hellmodus' : 'Dunkelmodus'}
          >
            {darkMode ? <Icons.Sun /> : <Icons.Moon />}
          </button>
        </div>

        <form onSubmit={handleSignIn} className="space-y-5">
          <div>
            <label className={`block text-sm font-medium mb-2 ${theme.textSecondary}`}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-4 py-2.5 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text}`}
              placeholder="email@example.com"
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${theme.textSecondary}`}>
              Passwort
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full px-4 py-2.5 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text}`}
              placeholder="••••••••"
            />
          </div>

          {message && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
              <p className="text-rose-400 text-sm">{message}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full ${theme.accent} text-white font-medium py-2.5 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? 'Wird geladen...' : 'Einloggen'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default App
