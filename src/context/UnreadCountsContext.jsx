import { createContext, useContext, useState, useMemo } from 'react'
import { useEmail } from './EmailContext'
import { useChatContext } from './ChatContext'
import { useFaxCounts } from '../features/fax'
import { useGesundUnreadCount } from '../features/gesund-bestellungen'

const UnreadCountsContext = createContext(null)

/**
 * Aggregiert alle Unread-Badge-Zahlen für SidebarNav
 * Quellen: Fax (via useFaxCounts), Email, Chat, Apo (AMK/Recall/LAV/RHB)
 */
export function UnreadCountsProvider({ children }) {
  const { emailUnreadCount } = useEmail()
  const { chatUnreadCounts } = useChatContext()

  // Fax count (via existierendem useFaxCounts Hook)
  const { count: faxCount } = useFaxCounts()

  // Gesund.de unread count
  const { count: gesundCount } = useGesundUnreadCount()

  // Apo unread counts (wird von ApoView/useApoState gesetzt)
  const [apoUnreadCounts, setApoUnreadCounts] = useState({ amk: 0, recall: 0, lav: 0, rhb: 0 })

  const value = useMemo(() => ({
    faxCount,
    emailUnreadCount,
    gesundCount,
    chatUnreadCounts,
    apoUnreadCounts,
    setApoUnreadCounts,
    // Aggregiertes Object für SidebarNav
    unreadCounts: {
      ...apoUnreadCounts,
      fax: faxCount,
      email: emailUnreadCount,
      gesund: gesundCount,
      chat: chatUnreadCounts,
    },
  }), [faxCount, emailUnreadCount, gesundCount, chatUnreadCounts, apoUnreadCounts])

  return (
    <UnreadCountsContext.Provider value={value}>
      {children}
    </UnreadCountsContext.Provider>
  )
}

export function useUnreadCounts() {
  const context = useContext(UnreadCountsContext)
  if (!context) {
    throw new Error('useUnreadCounts must be used within UnreadCountsProvider')
  }
  return context
}
