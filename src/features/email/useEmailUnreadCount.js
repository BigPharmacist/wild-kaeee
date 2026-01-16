import { useState, useEffect, useCallback, useRef } from 'react'
import { jmap } from '../../lib/jmap'

const POLLING_INTERVAL = 10000 // 10 Sekunden für schnelle Updates

/**
 * Hook für E-Mail Unread-Count mit schnellen Updates
 * - Trackt ungelesene E-Mails in der Inbox
 * - Schnelles Polling (10s) für reaktive UI
 * - Optimistic Updates für sofortige Feedback
 */
export default function useEmailUnreadCount({ account }) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [isConnected, setIsConnected] = useState(false)
  const pollingRef = useRef(null)
  const lastStateRef = useRef(null)
  const accountIdRef = useRef(null)

  const fetchUnreadCount = useCallback(async () => {
    if (!jmap.credentials || !jmap.accountId) return

    try {
      const mailboxes = await jmap.getMailboxes()
      const inbox = mailboxes.find(m => m.role === 'inbox')

      if (inbox) {
        setUnreadCount(inbox.unreadEmails || 0)
      }
    } catch (e) {
      console.error('Fehler beim Abrufen des Unread-Counts:', e)
    }
  }, [])

  // Schnelles State-basiertes Polling für neue E-Mails
  const startFastPolling = useCallback(async () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
    }

    const poll = async () => {
      if (!jmap.credentials || !jmap.accountId) return

      try {
        // Mailbox-State prüfen für schnelle Erkennung
        const responses = await jmap.request([
          ['Mailbox/get', { accountId: jmap.accountId, ids: [], properties: ['id'] }, 'state']
        ])

        const result = responses.find(r => r[0] === 'Mailbox/get')
        if (result) {
          const newState = result[1].state
          if (lastStateRef.current && newState !== lastStateRef.current) {
            // State hat sich geändert - Counts neu laden
            await fetchUnreadCount()
          }
          lastStateRef.current = newState
        }
      } catch (e) {
        console.error('Polling Fehler:', e)
      }
    }

    // Initial abrufen
    await fetchUnreadCount()
    await poll()

    pollingRef.current = setInterval(poll, POLLING_INTERVAL)
  }, [fetchUnreadCount])

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }, [])

  // Optimistic Update: E-Mail wurde gelesen
  const markAsRead = useCallback(() => {
    setUnreadCount(prev => Math.max(0, prev - 1))
  }, [])

  // Optimistic Update: E-Mail wurde als ungelesen markiert
  const markAsUnread = useCallback(() => {
    setUnreadCount(prev => prev + 1)
  }, [])

  // Optimistic Update: Neue E-Mail empfangen
  const incrementCount = useCallback(() => {
    setUnreadCount(prev => prev + 1)
  }, [])

  // Force Refresh
  const refresh = useCallback(async () => {
    await fetchUnreadCount()
  }, [fetchUnreadCount])

  // Account-Authentifizierung überwachen
  useEffect(() => {
    if (!account) {
      setUnreadCount(0)
      setIsConnected(false)
      stopPolling()
      accountIdRef.current = null
      return
    }

    // Nur starten wenn Account gewechselt hat
    if (accountIdRef.current === account.id) return
    accountIdRef.current = account.id

    const initializeConnection = async () => {
      try {
        // Prüfen ob bereits authentifiziert
        if (jmap.credentials && jmap.accountId) {
          setIsConnected(true)
          startFastPolling()
        } else {
          // Warten auf Authentifizierung
          await jmap.authenticate(account.email, account.password)
          setIsConnected(true)
          startFastPolling()
        }
      } catch (e) {
        console.error('E-Mail Verbindung fehlgeschlagen:', e)
        setIsConnected(false)
      }
    }

    initializeConnection()

    return () => {
      stopPolling()
    }
  }, [account, startFastPolling, stopPolling])

  // JMAP Event Listener für Updates
  useEffect(() => {
    if (!isConnected) return

    const unsubscribe = jmap.onUpdate((data) => {
      if (data.changed?.Email || data.changed?.Mailbox) {
        fetchUnreadCount()
      }
    })

    return unsubscribe
  }, [isConnected, fetchUnreadCount])

  // Optimistic Update Event Listener
  useEffect(() => {
    const handleEmailRead = () => {
      setUnreadCount(prev => Math.max(0, prev - 1))
    }

    window.addEventListener('email-read', handleEmailRead)
    return () => window.removeEventListener('email-read', handleEmailRead)
  }, [])

  return {
    unreadCount,
    isConnected,
    markAsRead,
    markAsUnread,
    incrementCount,
    refresh,
  }
}
