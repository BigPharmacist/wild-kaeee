import { createContext, useContext, useState, useMemo } from 'react'
import { useEmail } from './EmailContext'
import { useAuth } from './AuthContext'
import { useStaff } from './StaffContext'
import { useUnreadCountsQuery } from '../features/chat/api'
import { useFaxCounts } from '../features/fax'
import { useGesundUnreadCount } from '../features/gesund-bestellungen'

const UnreadCountsContext = createContext(null)

/**
 * Aggregiert alle Unread-Badge-Zahlen für SidebarNav
 * Quellen: Fax (via useFaxCounts), Email, Chat (TanStack Query), Apo (AMK/Recall/LAV/RHB)
 */
export function UnreadCountsProvider({ children }) {
  const { session } = useAuth()
  const { staff } = useStaff()
  const { emailUnreadCount } = useEmail()

  // Staff lookup für Chat-Notifications
  const staffByAuthId = useMemo(() => {
    return staff?.reduce((acc, s) => {
      if (s.auth_user_id) acc[s.auth_user_id] = s
      return acc
    }, {}) || {}
  }, [staff])

  // Chat unread counts via TanStack Query (ersetzt Legacy ChatProvider)
  const { unreadCounts: chatUnreadCounts } = useUnreadCountsQuery({
    userId: session?.user?.id,
    staffByAuthId,
    enabled: !!session?.user?.id,
  })

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
