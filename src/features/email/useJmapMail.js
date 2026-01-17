import { useCallback, useEffect, useRef, useState } from 'react'
import { jmap } from '../../lib/jmap'

export default function useJmapMail({ account }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState('')
  const [mailboxes, setMailboxes] = useState([])
  const [selectedMailbox, setSelectedMailbox] = useState(null)
  const [emails, setEmails] = useState([])
  const [emailsTotal, setEmailsTotal] = useState(0)
  const [emailsLoading, setEmailsLoading] = useState(false)
  const [emailsLoadingMore, setEmailsLoadingMore] = useState(false)
  const [selectedEmail, setSelectedEmail] = useState(null)
  const [emailDetail, setEmailDetail] = useState(null)
  const [emailDetailLoading, setEmailDetailLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [searchLoading, setSearchLoading] = useState(false)

  const lastAccountId = useRef(null)
  const selectedMailboxIdRef = useRef(null)

  const loadEmails = useCallback(async (mailboxId) => {
    if (!mailboxId) return

    setEmailsLoading(true)
    try {
      const result = await jmap.getEmails(mailboxId, { limit: 50, position: 0 })
      setEmails(result.emails)
      setEmailsTotal(result.total)
    } catch (e) {
      console.error('Fehler beim Laden der E-Mails:', e)
    } finally {
      setEmailsLoading(false)
    }
  }, [])

  const loadMoreEmails = useCallback(async () => {
    if (!selectedMailbox || emailsLoadingMore || emails.length >= emailsTotal) return

    setEmailsLoadingMore(true)
    try {
      const result = await jmap.getEmails(selectedMailbox.id, { limit: 50, position: emails.length })
      setEmails(prev => [...prev, ...result.emails])
    } catch (e) {
      console.error('Fehler beim Nachladen der E-Mails:', e)
    } finally {
      setEmailsLoadingMore(false)
    }
  }, [selectedMailbox, emailsLoadingMore, emails.length, emailsTotal])

  const loadEmailDetail = useCallback(async (emailId) => {
    setEmailDetailLoading(true)
    try {
      const detail = await jmap.getEmail(emailId)
      setEmailDetail(detail)

      if (!detail.keywords?.['$seen']) {
        await jmap.setEmailRead(emailId, true)
        setEmails(prev => prev.map(e =>
          e.id === emailId ? { ...e, keywords: { ...e.keywords, '$seen': true } } : e
        ))
        // Optimistic Update Event für Badge
        window.dispatchEvent(new CustomEvent('email-read'))
      }
    } catch (e) {
      console.error('Fehler beim Laden der E-Mail:', e)
    } finally {
      setEmailDetailLoading(false)
    }
  }, [])

  const handleSelectEmail = useCallback((email) => {
    setSelectedEmail(email)
    loadEmailDetail(email.id)
  }, [loadEmailDetail])

  const handleDeleteEmail = useCallback(async (emailId) => {
    try {
      await jmap.deleteEmail(emailId)
      setEmails(prev => prev.filter(e => e.id !== emailId))
      setEmailsTotal(prev => Math.max(0, prev - 1))
      setEmailDetail(null)
      setSelectedEmail(prev => (prev?.id === emailId ? null : prev))
    } catch (e) {
      console.error('Fehler beim Löschen:', e)
    }
  }, [])

  const handleMoveEmail = useCallback(async (emailId, toMailboxId) => {
    try {
      await jmap.moveEmail(emailId, toMailboxId)
      // E-Mail aus aktueller Liste entfernen
      setEmails(prev => prev.filter(e => e.id !== emailId))
      setEmailsTotal(prev => Math.max(0, prev - 1))
      // Auch aus Suchergebnissen entfernen
      setSearchResults(prev => prev ? {
        ...prev,
        emails: prev.emails.filter(e => e.id !== emailId),
        total: Math.max(0, prev.total - 1)
      } : null)
      // Falls die verschobene E-Mail gerade angezeigt wird, Detail schließen
      setSelectedEmail(prev => (prev?.id === emailId ? null : prev))
      setEmailDetail(prev => (prev?.id === emailId ? null : prev))
      // Event für Badge-Update
      window.dispatchEvent(new CustomEvent('email-moved'))
    } catch (e) {
      console.error('Fehler beim Verschieben:', e)
    }
  }, [])

  const searchEmails = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchQuery('')
      setSearchResults(null)
      return
    }

    setSearchQuery(query)
    setSearchLoading(true)
    try {
      const result = await jmap.searchEmails(query, { limit: 100 })
      setSearchResults(result)
    } catch (e) {
      console.error('Fehler bei der Suche:', e)
      setSearchResults({ emails: [], total: 0 })
    } finally {
      setSearchLoading(false)
    }
  }, [])

  const clearSearch = useCallback(() => {
    setSearchQuery('')
    setSearchResults(null)
  }, [])

  const authenticateAccount = useCallback(async (acc) => {
    setAuthLoading(true)
    setAuthError('')
    setIsAuthenticated(false)

    try {
      await jmap.authenticate(acc.email, acc.password)
      setIsAuthenticated(true)

      const boxes = await jmap.getMailboxes()
      setMailboxes(boxes)

      const inbox = boxes.find(m => m.role === 'inbox')
      if (inbox) {
        setSelectedMailbox(inbox)
      }

      jmap.startPolling((data) => {
        if (data.changed?.Email) {
          loadEmails(selectedMailboxIdRef.current)
        }
      }, 30000)
    } catch (e) {
      setAuthError(e.message || 'Verbindung fehlgeschlagen')
    } finally {
      setAuthLoading(false)
    }
  }, [loadEmails])

  useEffect(() => {
    if (!account) {
      setIsAuthenticated(false)
      setMailboxes([])
      setEmails([])
      setEmailsTotal(0)
      setSelectedMailbox(null)
      setSelectedEmail(null)
      setEmailDetail(null)
      setAuthError('')
      jmap.stopPolling()
      return
    }

    if (lastAccountId.current === account.id && isAuthenticated) {
      return
    }

    lastAccountId.current = account.id
    authenticateAccount(account)

    return () => {
      jmap.stopPolling()
    }
  }, [account, authenticateAccount, isAuthenticated])

  useEffect(() => {
    selectedMailboxIdRef.current = selectedMailbox?.id || null
  }, [selectedMailbox?.id])

  useEffect(() => {
    if (selectedMailbox && isAuthenticated) {
      loadEmails(selectedMailbox.id)
      setSelectedEmail(null)
      setEmailDetail(null)
    }
  }, [selectedMailbox, isAuthenticated, loadEmails])

  return {
    isAuthenticated,
    authLoading,
    authError,
    mailboxes,
    selectedMailbox,
    emails,
    emailsTotal,
    emailsLoading,
    emailsLoadingMore,
    selectedEmail,
    emailDetail,
    emailDetailLoading,
    authenticateAccount,
    setSelectedMailbox,
    loadEmails,
    loadMoreEmails,
    handleSelectEmail,
    handleDeleteEmail,
    handleMoveEmail,
    setSelectedEmail,
    setEmailDetail,
    searchQuery,
    searchResults,
    searchLoading,
    searchEmails,
    clearSearch,
  }
}
