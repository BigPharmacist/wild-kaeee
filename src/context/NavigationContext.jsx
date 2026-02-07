import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react'

const NavigationContext = createContext(null)

export function NavigationProvider({ children }) {
  const isInitialMount = useRef(true)
  const mobileNavTimerRef = useRef(null)

  // Navigation State (with migration for old view names)
  const [activeView, setActiveView] = useState(() => {
    const stored = localStorage.getItem('nav_activeView') || 'dashboard'
    const migrations = { apo: 'pharma', calendar: 'planung', plan: 'planung', archiv: 'dokumente', rechnungen: 'dokumente', scan: 'misc' }
    return migrations[stored] || stored
  })
  const [secondaryTab, setSecondaryTab] = useState(() => localStorage.getItem('nav_secondaryTab') || 'overview')
  const [settingsTab, setSettingsTab] = useState(() => localStorage.getItem('nav_settingsTab') || 'pharmacies')
  const [chatTab, setChatTab] = useState(() => localStorage.getItem('nav_chatTab') || 'group')
  const [dokumenteTab, setDokumenteTab] = useState(() => localStorage.getItem('nav_dokumenteTab') || 'briefe')
  const [apoTab, setApoTab] = useState(() => localStorage.getItem('nav_apoTab') || 'amk')
  const [botendienstTab, setBotendienstTab] = useState(() => localStorage.getItem('nav_botendienstTab') || 'overview')
  const [planungTab, setPlanungTab] = useState(() => localStorage.getItem('nav_planungTab') || 'calendar')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('nav_activeView', activeView)
  }, [activeView])

  useEffect(() => {
    localStorage.setItem('nav_secondaryTab', secondaryTab)
  }, [secondaryTab])

  useEffect(() => {
    localStorage.setItem('nav_settingsTab', settingsTab)
  }, [settingsTab])

  useEffect(() => {
    localStorage.setItem('nav_chatTab', chatTab)
  }, [chatTab])

  useEffect(() => {
    localStorage.setItem('nav_apoTab', apoTab)
  }, [apoTab])

  useEffect(() => {
    localStorage.setItem('nav_botendienstTab', botendienstTab)
  }, [botendienstTab])

  useEffect(() => {
    localStorage.setItem('nav_dokumenteTab', dokumenteTab)
  }, [dokumenteTab])

  useEffect(() => {
    localStorage.setItem('nav_planungTab', planungTab)
  }, [planungTab])

  // Mobile Nav auto-close timer
  useEffect(() => {
    if (mobileNavTimerRef.current) {
      clearTimeout(mobileNavTimerRef.current)
      mobileNavTimerRef.current = null
    }
    if (mobileNavOpen) {
      mobileNavTimerRef.current = setTimeout(() => {
        setMobileNavOpen(false)
      }, 5000)
    }
    return () => {
      if (mobileNavTimerRef.current) {
        clearTimeout(mobileNavTimerRef.current)
      }
    }
  }, [activeView, mobileNavOpen])

  // Body overflow when mobile nav is open
  useEffect(() => {
    document.body.style.overflow = mobileNavOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileNavOpen])

  // Helper to get active secondary ID based on current view
  const getActiveSecondaryId = useCallback(() => {
    if (activeView === 'settings') return settingsTab
    if (activeView === 'pharma') return apoTab
    if (activeView === 'chat') return chatTab
    if (activeView === 'dokumente') return dokumenteTab
    if (activeView === 'botendienst') return botendienstTab
    if (activeView === 'planung') return planungTab
    return secondaryTab
  }, [activeView, settingsTab, apoTab, chatTab, dokumenteTab, botendienstTab, planungTab, secondaryTab])

  // Handle secondary navigation selection
  const handleSecondarySelect = useCallback((id) => {
    if (activeView === 'settings') {
      setSettingsTab(id)
    } else if (activeView === 'pharma') {
      setApoTab(id)
    } else if (activeView === 'chat') {
      setChatTab(id)
    } else if (activeView === 'dokumente') {
      setDokumenteTab(id)
    } else if (activeView === 'botendienst') {
      setBotendienstTab(id)
    } else if (activeView === 'planung') {
      setPlanungTab(id)
    } else {
      setSecondaryTab(id)
    }
  }, [activeView])

  // Update secondary tab when view changes (except for views with their own tabs)
  const updateSecondaryForView = useCallback((secondaryNavMap) => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    if (activeView === 'settings' || activeView === 'pharma' || activeView === 'chat' || activeView === 'dokumente' || activeView === 'botendienst' || activeView === 'planung') return
    const nextItems = secondaryNavMap[activeView] || []
    if (nextItems.length) {
      setSecondaryTab(nextItems[0].id)
    }
  }, [activeView])

  const value = useMemo(() => ({
    // State
    activeView,
    secondaryTab,
    settingsTab,
    chatTab,
    dokumenteTab,
    apoTab,
    botendienstTab,
    planungTab,
    mobileNavOpen,

    // Setters
    setActiveView,
    setSecondaryTab,
    setSettingsTab,
    setChatTab,
    setDokumenteTab,
    setApoTab,
    setBotendienstTab,
    setPlanungTab,
    setMobileNavOpen,

    // Helpers
    getActiveSecondaryId,
    handleSecondarySelect,
    updateSecondaryForView,
  }), [
    activeView,
    secondaryTab,
    settingsTab,
    chatTab,
    dokumenteTab,
    apoTab,
    botendienstTab,
    planungTab,
    mobileNavOpen,
    getActiveSecondaryId,
    handleSecondarySelect,
    updateSecondaryForView,
  ])

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigation() {
  const context = useContext(NavigationContext)
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider')
  }
  return context
}
