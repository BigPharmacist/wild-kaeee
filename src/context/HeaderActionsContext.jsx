import { createContext, useContext, useState, useMemo } from 'react'

const HeaderActionsContext = createContext(null)

/**
 * Stellt Feature-spezifische Header-Aktionen bereit
 * Wird von DashboardLayout befüllt (camera refs, scan handlers)
 * Wird von DashboardHeader gelesen
 */
export function HeaderActionsProvider({ children }) {
  const [headerActions, setHeaderActions] = useState(null)

  const value = useMemo(() => ({
    headerActions,
    setHeaderActions,
  }), [headerActions])

  return (
    <HeaderActionsContext.Provider value={value}>
      {children}
    </HeaderActionsContext.Provider>
  )
}

export function useHeaderActions() {
  const context = useContext(HeaderActionsContext)
  if (!context) {
    throw new Error('useHeaderActions must be used within HeaderActionsProvider')
  }
  return context
}
