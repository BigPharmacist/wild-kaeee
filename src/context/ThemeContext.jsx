import { createContext, useContext, useState, useMemo, useCallback } from 'react'

const ThemeContext = createContext(null)

const lightTheme = {
  // Backgrounds - Leicht bläuliches Weiß
  bgApp: 'bg-[#F8FAFC]',
  bg: 'bg-[#F8FAFC]',
  surface: 'bg-white',
  panel: 'bg-white',
  bgHover: 'hover:bg-[#FEE2E2]/30',
  bgCard: 'bg-white',
  // Text - Navy & Slate-Grau
  textPrimary: 'text-[#1E293B]',
  text: 'text-[#1E293B]',
  textSecondary: 'text-[#64748B]',
  textMuted: 'text-[#94A3B8]',
  // Borders
  border: 'border-[#CBD5E1]',
  divider: 'border-[#1E293B]/20',
  // Navigation - Amber aktiv
  navActive: 'bg-[#FEE2E2] text-[#1E293B] border border-[#DC2626]/30',
  navHover: 'hover:bg-[#FEE2E2]/50 hover:text-[#1E293B]',
  // Amber (Primary) - CTA, wichtige Buttons
  accent: 'bg-[#DC2626] hover:bg-[#B91C1C]',
  accentText: 'text-[#DC2626]',
  primary: 'text-[#DC2626]',
  primaryBg: 'bg-[#DC2626]',
  primaryHover: 'hover:bg-[#B91C1C]',
  // Teal (Secondary)
  secondary: 'text-[#0D9488]',
  secondaryAccent: 'bg-[#0D9488] hover:bg-[#0F766E]',
  // Sidebar - Dunkles Navy-Slate
  sidebarBg: 'bg-[#1E293B]',
  sidebarHover: 'hover:bg-[#334155]',
  sidebarActive: 'border-[#DC2626] bg-transparent',
  sidebarText: 'text-[#E2E8F0]',
  sidebarTextActive: 'text-[#E2E8F0]',
  secondarySidebarBg: 'bg-[#334155]',
  secondaryActive: 'border-l-4 border-[#DC2626] bg-[#1E293B] text-[#FEE2E2]',
  // Inputs
  input: 'bg-white border-[#CBD5E1] focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]',
  inputPlaceholder: 'placeholder-[#94A3B8]',
  // Shadows
  cardShadow: 'shadow-[0_4px_12px_rgba(30,41,59,0.08)]',
  cardHoverShadow: 'hover:shadow-[0_8px_20px_rgba(30,41,59,0.12)]',
  overlay: 'bg-[#1E293B]/40',
  // Status Colors
  success: 'text-[#0D9488]',
  successBg: 'bg-[#0D9488] hover:bg-[#0F766E]',
  warning: 'text-[#DC2626]',
  warningBg: 'bg-[#DC2626] hover:bg-[#B91C1C]',
  danger: 'text-[#FF6500] hover:text-[#E65A00] hover:bg-[#FFF5EB]',
  dangerBg: 'bg-[#FF6500] hover:bg-[#E65A00]',
}

const darkTheme = {
  // Backgrounds - Dunkles Slate
  bgApp: 'bg-zinc-950',
  bg: 'bg-zinc-950',
  surface: 'bg-zinc-900',
  panel: 'bg-zinc-900',
  bgHover: 'hover:bg-zinc-800',
  bgCard: 'bg-zinc-900',
  // Text - Hell auf dunkel
  textPrimary: 'text-zinc-100',
  text: 'text-zinc-100',
  textSecondary: 'text-zinc-400',
  textMuted: 'text-zinc-500',
  // Borders
  border: 'border-zinc-700',
  divider: 'border-zinc-700',
  // Navigation - Amber aktiv
  navActive: 'bg-red-600/20 text-red-300 border border-red-600/30',
  navHover: 'hover:bg-zinc-800 hover:text-zinc-100',
  // Amber (Primary)
  accent: 'bg-red-600 hover:bg-red-700',
  accentText: 'text-red-400',
  primary: 'text-red-400',
  primaryBg: 'bg-red-600',
  primaryHover: 'hover:bg-red-700',
  // Teal (Secondary)
  secondary: 'text-teal-400',
  secondaryAccent: 'bg-teal-600 hover:bg-teal-700',
  // Sidebar
  sidebarBg: 'bg-zinc-900',
  sidebarHover: 'hover:bg-zinc-800',
  sidebarActive: 'border-red-600 bg-transparent',
  sidebarText: 'text-zinc-300',
  sidebarTextActive: 'text-zinc-100',
  secondarySidebarBg: 'bg-zinc-800',
  secondaryActive: 'border-l-4 border-red-600 bg-zinc-900 text-red-300',
  // Inputs
  input: 'bg-zinc-800 border-zinc-600 focus:border-teal-500 focus:ring-1 focus:ring-teal-500',
  inputPlaceholder: 'placeholder-zinc-500',
  // Shadows
  cardShadow: 'shadow-[0_4px_12px_rgba(0,0,0,0.3)]',
  cardHoverShadow: 'hover:shadow-[0_8px_20px_rgba(0,0,0,0.4)]',
  overlay: 'bg-black/60',
  // Status Colors
  success: 'text-teal-400',
  successBg: 'bg-teal-600 hover:bg-teal-700',
  warning: 'text-red-400',
  warningBg: 'bg-red-600 hover:bg-red-700',
  danger: 'text-orange-400 hover:text-orange-300 hover:bg-orange-500/20',
  dangerBg: 'bg-orange-500 hover:bg-orange-600',
}

export function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(() => {
    // localStorage Check für persistente Einstellung
    const saved = localStorage.getItem('darkMode')
    if (saved !== null) {
      return saved === 'true'
    }
    // Standard: Light Mode
    return false
  })

  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => {
      const next = !prev
      localStorage.setItem('darkMode', String(next))
      return next
    })
  }, [])

  const theme = darkMode ? darkTheme : lightTheme

  const value = useMemo(() => ({
    theme,
    darkMode,
    setDarkMode,
    toggleDarkMode,
  }), [theme, darkMode, toggleDarkMode])

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
