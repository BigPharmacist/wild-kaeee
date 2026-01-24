import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react'

const NavigationContext = createContext(null)

export function NavigationProvider({ children }) {
  const isInitialMount = useRef(true)
  const mobileNavTimerRef = useRef(null)

  // Navigation State
  const [activeView, setActiveView] = useState(() => localStorage.getItem('nav_activeView') || 'dashboard')
  const [secondaryTab, setSecondaryTab] = useState(() => localStorage.getItem('nav_secondaryTab') || 'overview')
  const [settingsTab, setSettingsTab] = useState(() => localStorage.getItem('nav_settingsTab') || 'pharmacies')
  const [chatTab, setChatTab] = useState(() => localStorage.getItem('nav_chatTab') || 'group')
  const [dokumenteTab, setDokumenteTab] = useState(() => localStorage.getItem('nav_dokumenteTab') || 'briefe')
  const [archivTab, setArchivTab] = useState(() => localStorage.getItem('nav_archivTab') || 'alle')
  const [rechnungenTab, setRechnungenTab] = useState(() => localStorage.getItem('nav_rechnungenTab') || 'alt')
  const [apoTab, setApoTab] = useState(() => localStorage.getItem('nav_apoTab') || 'amk')
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
    localStorage.setItem('nav_dokumenteTab', dokumenteTab)
  }, [dokumenteTab])

  useEffect(() => {
    localStorage.setItem('nav_archivTab', archivTab)
  }, [archivTab])

  useEffect(() => {
    localStorage.setItem('nav_rechnungenTab', rechnungenTab)
  }, [rechnungenTab])

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
    if (activeView === 'apo') return apoTab
    if (activeView === 'chat') return chatTab
    if (activeView === 'dokumente') return dokumenteTab
    if (activeView === 'archiv') return archivTab
    if (activeView === 'rechnungen') return rechnungenTab
    return secondaryTab
  }, [activeView, settingsTab, apoTab, chatTab, dokumenteTab, archivTab, rechnungenTab, secondaryTab])

  // Handle secondary navigation selection
  const handleSecondarySelect = useCallback((id) => {
    if (activeView === 'settings') {
      setSettingsTab(id)
    } else if (activeView === 'apo') {
      setApoTab(id)
    } else if (activeView === 'chat') {
      setChatTab(id)
    } else if (activeView === 'dokumente') {
      setDokumenteTab(id)
    } else if (activeView === 'archiv') {
      setArchivTab(id)
    } else if (activeView === 'rechnungen') {
      setRechnungenTab(id)
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
    if (activeView === 'settings' || activeView === 'apo' || activeView === 'chat' || activeView === 'dokumente') return
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
    archivTab,
    rechnungenTab,
    apoTab,
    mobileNavOpen,

    // Setters
    setActiveView,
    setSecondaryTab,
    setSettingsTab,
    setChatTab,
    setDokumenteTab,
    setArchivTab,
    setRechnungenTab,
    setApoTab,
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
    archivTab,
    rechnungenTab,
    apoTab,
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
