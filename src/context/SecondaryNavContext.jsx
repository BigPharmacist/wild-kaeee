import { createContext, useContext, useState, useCallback, useMemo } from 'react'

const SecondaryNavContext = createContext(null)

/**
 * Stellt dynamische Daten für die sekundäre Navigation bereit
 * Wird von Feature-Pages befüllt (projects etc.)
 * Wird von SidebarNav gelesen
 */
export function SecondaryNavProvider({ children }) {
  const [dynamicNavData, setDynamicNavDataRaw] = useState({
    projects: [],
  })

  // Merge-Setter: each feature page can update only its own portion
  const setDynamicNavData = useCallback((data) => {
    setDynamicNavDataRaw(prev => ({ ...prev, ...data }))
  }, [])

  // Optional: Override für handleSecondarySelect (z.B. archiv/tasks Filter-Logik)
  const [secondarySelectOverride, setSecondarySelectOverride] = useState(null)

  // Optional: Callbacks für Task/Project Modals
  const [sidebarCallbacks, setSidebarCallbacks] = useState({
    onAddTask: null,
    onAddProject: null,
  })

  const value = useMemo(() => ({
    dynamicNavData,
    setDynamicNavData,
    secondarySelectOverride,
    setSecondarySelectOverride,
    sidebarCallbacks,
    setSidebarCallbacks,
  }), [dynamicNavData, secondarySelectOverride, sidebarCallbacks])

  return (
    <SecondaryNavContext.Provider value={value}>
      {children}
    </SecondaryNavContext.Provider>
  )
}

export function useSecondaryNav() {
  const context = useContext(SecondaryNavContext)
  if (!context) {
    throw new Error('useSecondaryNav must be used within SecondaryNavProvider')
  }
  return context
}
