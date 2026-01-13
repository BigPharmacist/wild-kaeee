import { useState, useEffect, useCallback, useRef } from 'react'
import { jmap } from '../lib/jmap'
import {
  EnvelopeSimple,
  PaperPlaneTilt,
  Trash,
  ArrowBendUpLeft,
  ArrowBendUpRight,
  Paperclip,
  CircleNotch,
  Tray,
  PaperPlaneRight,
  File,
  Folder,
  Warning,
  X,
  CaretLeft,
  GearSix
} from '@phosphor-icons/react'

export default function EmailView({ theme, account, hasAccess, onConfigureClick }) {
  // Berechtigungsprüfung
  if (!hasAccess) {
    return (
      <div className={`${theme.panel} rounded-2xl p-8 border ${theme.border} ${theme.cardShadow}`}>
        <div className="flex flex-col items-center justify-center py-12">
          <EnvelopeSimple size={64} className={`${theme.textMuted} mb-4 opacity-50`} />
          <h3 className="text-lg font-semibold mb-2">Kein Zugriff</h3>
          <p className={`${theme.textMuted} text-center max-w-md`}>
            Du hast keine Berechtigung, E-Mails zu sehen. Bitte wende dich an einen Administrator.
          </p>
        </div>
      </div>
    )
  }

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState('')

  // Mail State
  const [mailboxes, setMailboxes] = useState([])
  const [selectedMailbox, setSelectedMailbox] = useState(null)
  const [emails, setEmails] = useState([])
  const [emailsTotal, setEmailsTotal] = useState(0)
  const [emailsLoading, setEmailsLoading] = useState(false)
  const [emailsLoadingMore, setEmailsLoadingMore] = useState(false)
  const [selectedEmail, setSelectedEmail] = useState(null)
  const [emailDetail, setEmailDetail] = useState(null)
  const [emailDetailLoading, setEmailDetailLoading] = useState(false)

  // Compose State
  const [showCompose, setShowCompose] = useState(false)
  const [composeMode, setComposeMode] = useState('new') // 'new', 'reply', 'forward'
  const [composeData, setComposeData] = useState({
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    body: ''
  })
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')

  // Refs
  const emailListRef = useRef(null)
  const lastAccountId = useRef(null)

  // Automatisch authentifizieren wenn Account vorhanden
  useEffect(() => {
    if (!account) {
      setIsAuthenticated(false)
      setMailboxes([])
      setEmails([])
      setSelectedMailbox(null)
      setSelectedEmail(null)
      setEmailDetail(null)
      return
    }

    // Nur neu authentifizieren wenn Account gewechselt hat
    if (lastAccountId.current === account.id && isAuthenticated) {
      return
    }

    lastAccountId.current = account.id
    authenticateAccount(account)
  }, [account])

  const authenticateAccount = async (acc) => {
    setAuthLoading(true)
    setAuthError('')
    setIsAuthenticated(false)

    try {
      await jmap.authenticate(acc.email, acc.password)
      setIsAuthenticated(true)

      // Mailboxen laden
      const boxes = await jmap.getMailboxes()
      setMailboxes(boxes)

      // Inbox als Standard auswählen
      const inbox = boxes.find(m => m.role === 'inbox')
      if (inbox) {
        setSelectedMailbox(inbox)
      }

      // Polling für Updates starten (alle 30 Sekunden)
      jmap.startPolling((data) => {
        console.log('JMAP Update:', data)
        if (data.changed?.Email) {
          loadEmails(selectedMailbox?.id)
        }
      }, 30000)
    } catch (e) {
      setAuthError(e.message || 'Verbindung fehlgeschlagen')
    } finally {
      setAuthLoading(false)
    }
  }

  // Emails laden
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

  // Weitere Emails nachladen (Infinite Scroll)
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

  // Scroll-Handler für Infinite Scroll
  const handleEmailListScroll = useCallback((e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target
    // Nachladen wenn 100px vor dem Ende
    if (scrollHeight - scrollTop - clientHeight < 100) {
      loadMoreEmails()
    }
  }, [loadMoreEmails])

  // Bei Mailbox-Wechsel E-Mails laden
  useEffect(() => {
    if (selectedMailbox && isAuthenticated) {
      loadEmails(selectedMailbox.id)
      setSelectedEmail(null)
      setEmailDetail(null)
    }
  }, [selectedMailbox, isAuthenticated, loadEmails])

  // E-Mail Details laden
  const loadEmailDetail = async (emailId) => {
    setEmailDetailLoading(true)
    try {
      const detail = await jmap.getEmail(emailId)
      setEmailDetail(detail)

      // Als gelesen markieren
      if (!detail.keywords?.['$seen']) {
        await jmap.setEmailRead(emailId, true)
        setEmails(prev => prev.map(e =>
          e.id === emailId ? { ...e, keywords: { ...e.keywords, '$seen': true } } : e
        ))
      }
    } catch (e) {
      console.error('Fehler beim Laden der E-Mail:', e)
    } finally {
      setEmailDetailLoading(false)
    }
  }

  // E-Mail auswählen
  const handleSelectEmail = (email) => {
    setSelectedEmail(email)
    loadEmailDetail(email.id)
  }

  // Zurück zur Liste (Mobile)
  const handleBackToList = () => {
    setSelectedEmail(null)
    setEmailDetail(null)
  }

  // E-Mail löschen
  const handleDeleteEmail = async (emailId) => {
    try {
      await jmap.deleteEmail(emailId)
      setEmails(prev => prev.filter(e => e.id !== emailId))
      if (selectedEmail?.id === emailId) {
        setSelectedEmail(null)
        setEmailDetail(null)
      }
    } catch (e) {
      console.error('Fehler beim Löschen:', e)
    }
  }

  // Compose öffnen
  const openCompose = (mode = 'new', replyToEmail = null) => {
    setComposeMode(mode)
    setSendError('')

    if (mode === 'new') {
      setComposeData({ to: '', cc: '', bcc: '', subject: '', body: '' })
    } else if (mode === 'reply' && replyToEmail) {
      const from = replyToEmail.from?.[0]
      setComposeData({
        to: from?.email || '',
        cc: '',
        bcc: '',
        subject: `Re: ${replyToEmail.subject || ''}`,
        body: `\n\n---\nAm ${formatDate(replyToEmail.receivedAt)} schrieb ${from?.name || from?.email}:\n> ${replyToEmail.preview || ''}`
      })
    } else if (mode === 'forward' && replyToEmail) {
      setComposeData({
        to: '',
        cc: '',
        bcc: '',
        subject: `Fwd: ${replyToEmail.subject || ''}`,
        body: `\n\n---\nWeitergeleitete Nachricht:\nVon: ${replyToEmail.from?.[0]?.email}\nDatum: ${formatDate(replyToEmail.receivedAt)}\nBetreff: ${replyToEmail.subject}\n\n${replyToEmail.preview || ''}`
      })
    }

    setShowCompose(true)
  }

  // E-Mail senden
  const handleSend = async () => {
    if (!composeData.to.trim()) {
      setSendError('Bitte Empfänger angeben')
      return
    }

    setSending(true)
    setSendError('')

    try {
      const toAddresses = composeData.to.split(',').map(e => e.trim()).filter(Boolean)
      const ccAddresses = composeData.cc ? composeData.cc.split(',').map(e => e.trim()).filter(Boolean) : undefined
      const bccAddresses = composeData.bcc ? composeData.bcc.split(',').map(e => e.trim()).filter(Boolean) : undefined

      await jmap.sendEmail({
        to: toAddresses,
        cc: ccAddresses,
        bcc: bccAddresses,
        subject: composeData.subject,
        textBody: composeData.body
      })

      setShowCompose(false)
      setComposeData({ to: '', cc: '', bcc: '', subject: '', body: '' })

      if (selectedMailbox?.role === 'sent') {
        loadEmails(selectedMailbox.id)
      }
    } catch (e) {
      setSendError(e.message || 'Senden fehlgeschlagen')
    } finally {
      setSending(false)
    }
  }

  // Hilfsfunktionen
  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()

    if (isToday) {
      return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
    }
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })
  }

  const getMailboxIcon = (role) => {
    switch (role) {
      case 'inbox': return <Tray size={18} weight="regular" />
      case 'sent': return <PaperPlaneRight size={18} weight="regular" />
      case 'drafts': return <File size={18} weight="regular" />
      case 'trash': return <Trash size={18} weight="regular" />
      case 'junk':
      case 'spam': return <Warning size={18} weight="regular" />
      default: return <Folder size={18} weight="regular" />
    }
  }

  const getEmailBody = (email) => {
    if (!email) return ''

    if (email.htmlBody?.length > 0) {
      const partId = email.htmlBody[0].partId
      return email.bodyValues?.[partId]?.value || ''
    }
    if (email.textBody?.length > 0) {
      const partId = email.textBody[0].partId
      const text = email.bodyValues?.[partId]?.value || ''
      return text.replace(/\n/g, '<br>')
    }
    return email.preview || ''
  }

  // Kein Account konfiguriert
  if (!account) {
    return (
      <div className={`${theme.panel} rounded-2xl p-8 border ${theme.border} ${theme.cardShadow}`}>
        <div className="flex flex-col items-center justify-center py-12">
          <div className={`${theme.textMuted} mb-6`}>
            <EnvelopeSimple size={80} weight="light" />
          </div>
          <p className={`text-lg ${theme.textMuted} mb-2`}>Kein E-Mail-Konto eingerichtet</p>
          <p className={`text-sm ${theme.textMuted} mb-6`}>Richte zuerst ein E-Mail-Konto in den Einstellungen ein.</p>
          <button
            type="button"
            onClick={onConfigureClick}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl ${theme.primaryBg} text-white font-medium ${theme.primaryHover}`}
          >
            <GearSix size={20} />
            Einstellungen öffnen
          </button>
        </div>
      </div>
    )
  }

  // Lädt...
  if (authLoading) {
    return (
      <div className={`${theme.panel} rounded-2xl p-8 border ${theme.border} ${theme.cardShadow}`}>
        <div className="flex flex-col items-center justify-center py-12">
          <CircleNotch size={48} className={`animate-spin ${theme.textMuted} mb-4`} />
          <p className={`text-lg ${theme.textMuted}`}>Verbinde mit {account.email}...</p>
        </div>
      </div>
    )
  }

  // Verbindungsfehler
  if (authError) {
    return (
      <div className={`${theme.panel} rounded-2xl p-8 border ${theme.border} ${theme.cardShadow}`}>
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-rose-500 mb-6">
            <Warning size={80} weight="light" />
          </div>
          <p className={`text-lg text-rose-500 mb-2`}>Verbindung fehlgeschlagen</p>
          <p className={`text-sm ${theme.textMuted} mb-6`}>{authError}</p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => authenticateAccount(account)}
              className={`px-4 py-2.5 rounded-xl ${theme.primaryBg} text-white font-medium ${theme.primaryHover}`}
            >
              Erneut versuchen
            </button>
            <button
              type="button"
              onClick={onConfigureClick}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border ${theme.border} ${theme.text} font-medium ${theme.bgHover}`}
            >
              <GearSix size={20} />
              Einstellungen
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Main Email View
  return (
    <div className={`${theme.panel} rounded-2xl border ${theme.border} ${theme.cardShadow} overflow-hidden`}>
      <div className="flex h-[calc(100vh-220px)] min-h-[500px]">
        {/* Sidebar - Mailboxen */}
        <div className={`w-48 flex-shrink-0 border-r ${theme.border} ${theme.bg} hidden md:flex flex-col`}>
          <div className={`p-3 border-b ${theme.border}`}>
            <button
              type="button"
              onClick={() => openCompose('new')}
              className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg ${theme.primaryBg} text-white font-medium text-sm ${theme.primaryHover}`}
            >
              <PaperPlaneTilt size={18} />
              Verfassen
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {mailboxes.map(mailbox => (
              <button
                key={mailbox.id}
                type="button"
                onClick={() => setSelectedMailbox(mailbox)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                  selectedMailbox?.id === mailbox.id
                    ? theme.navActive
                    : `${theme.text} ${theme.navHover}`
                }`}
              >
                <span className={theme.textMuted}>{getMailboxIcon(mailbox.role)}</span>
                <span className="flex-1 truncate">{mailbox.name}</span>
                {mailbox.unreadEmails > 0 && (
                  <span className={`text-xs font-medium ${theme.accentText}`}>{mailbox.unreadEmails}</span>
                )}
              </button>
            ))}
          </div>

          <div className={`p-3 border-t ${theme.border}`}>
            <p className={`text-xs ${theme.textMuted} truncate`}>{account.email}</p>
          </div>
        </div>

        {/* Email Liste */}
        <div className={`w-80 flex-shrink-0 border-r ${theme.border} flex flex-col ${selectedEmail ? 'hidden lg:flex' : 'flex'}`}>
          <div className={`p-3 border-b ${theme.border} flex items-center justify-between`}>
            <h4 className="font-medium text-sm">{selectedMailbox?.name || 'E-Mails'}</h4>
            <span className={`text-xs ${theme.textMuted}`}>{emailsTotal} E-Mails</span>
          </div>

          <div ref={emailListRef} className="flex-1 overflow-y-auto" onScroll={handleEmailListScroll}>
            {emailsLoading ? (
              <div className="flex items-center justify-center py-8">
                <CircleNotch size={24} className={`animate-spin ${theme.textMuted}`} />
              </div>
            ) : emails.length === 0 ? (
              <div className={`text-center py-8 ${theme.textMuted}`}>
                <EnvelopeSimple size={40} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">Keine E-Mails</p>
              </div>
            ) : (
              <>
                {emails.map(email => {
                  const isUnread = !email.keywords?.['$seen']
                  const from = email.from?.[0]

                  return (
                    <button
                      key={email.id}
                      type="button"
                      onClick={() => handleSelectEmail(email)}
                      className={`w-full text-left p-3 border-b ${theme.border} transition-colors ${
                        selectedEmail?.id === email.id ? theme.navActive : theme.bgHover
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm truncate ${isUnread ? 'font-semibold' : 'font-normal'} ${theme.text}`}>
                              {from?.name || from?.email || 'Unbekannt'}
                            </span>
                            {email.hasAttachment && (
                              <Paperclip size={14} className={theme.textMuted} />
                            )}
                          </div>
                          <p className={`text-sm truncate ${isUnread ? 'font-medium' : ''} ${theme.text}`}>
                            {email.subject || '(Kein Betreff)'}
                          </p>
                          <p className={`text-xs truncate ${theme.textMuted}`}>
                            {email.preview}
                          </p>
                        </div>
                        <span className={`text-xs flex-shrink-0 ${theme.textMuted}`}>
                          {formatDate(email.receivedAt)}
                        </span>
                      </div>
                    </button>
                  )
                })}
                {/* Infinite Scroll Loading */}
                {emailsLoadingMore && (
                  <div className="flex items-center justify-center py-4">
                    <CircleNotch size={20} className={`animate-spin ${theme.textMuted}`} />
                  </div>
                )}
                {/* Ende der Liste */}
                {!emailsLoadingMore && emails.length >= emailsTotal && emails.length > 0 && (
                  <div className={`text-center py-3 text-xs ${theme.textMuted}`}>
                    Alle {emailsTotal} E-Mails geladen
                  </div>
                )}
              </>
            )}
          </div>

          {/* Mobile: Verfassen Button */}
          <div className={`p-3 border-t ${theme.border} md:hidden`}>
            <button
              type="button"
              onClick={() => openCompose('new')}
              className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg ${theme.primaryBg} text-white font-medium text-sm ${theme.primaryHover}`}
            >
              <PaperPlaneTilt size={18} />
              Verfassen
            </button>
          </div>
        </div>

        {/* Email Detail */}
        <div className={`flex-1 flex flex-col ${!selectedEmail ? 'hidden lg:flex' : 'flex'}`}>
          {!selectedEmail ? (
            <div className={`flex-1 flex items-center justify-center ${theme.textMuted}`}>
              <div className="text-center">
                <EnvelopeSimple size={64} className="mx-auto mb-4 opacity-30" />
                <p>Wähle eine E-Mail aus</p>
              </div>
            </div>
          ) : emailDetailLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <CircleNotch size={32} className={`animate-spin ${theme.textMuted}`} />
            </div>
          ) : emailDetail ? (
            <>
              {/* Detail Header */}
              <div className={`p-4 border-b ${theme.border}`}>
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={handleBackToList}
                    className={`lg:hidden p-1.5 rounded-lg ${theme.bgHover}`}
                  >
                    <CaretLeft size={20} />
                  </button>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold truncate">{emailDetail.subject || '(Kein Betreff)'}</h3>
                    <div className={`text-sm ${theme.textSecondary} mt-1`}>
                      <span className="font-medium">{emailDetail.from?.[0]?.name || emailDetail.from?.[0]?.email}</span>
                      {emailDetail.from?.[0]?.name && (
                        <span className={theme.textMuted}> &lt;{emailDetail.from?.[0]?.email}&gt;</span>
                      )}
                    </div>
                    <div className={`text-xs ${theme.textMuted} mt-0.5`}>
                      An: {emailDetail.to?.map(t => t.email).join(', ')}
                    </div>
                    <div className={`text-xs ${theme.textMuted}`}>
                      {new Date(emailDetail.receivedAt).toLocaleString('de-DE')}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openCompose('reply', emailDetail)}
                      className={`p-2 rounded-lg ${theme.bgHover}`}
                      title="Antworten"
                    >
                      <ArrowBendUpLeft size={20} />
                    </button>
                    <button
                      type="button"
                      onClick={() => openCompose('forward', emailDetail)}
                      className={`p-2 rounded-lg ${theme.bgHover}`}
                      title="Weiterleiten"
                    >
                      <ArrowBendUpRight size={20} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteEmail(emailDetail.id)}
                      className={`p-2 rounded-lg ${theme.danger}`}
                      title="Löschen"
                    >
                      <Trash size={20} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Detail Body */}
              <div className="flex-1 overflow-y-auto p-4">
                <div
                  className={`prose prose-sm max-w-none ${theme.text}`}
                  dangerouslySetInnerHTML={{ __html: getEmailBody(emailDetail) }}
                />

                {/* Attachments */}
                {emailDetail.attachments?.length > 0 && (
                  <div className={`mt-6 pt-4 border-t ${theme.border}`}>
                    <h4 className={`text-sm font-medium mb-2 ${theme.textSecondary}`}>
                      Anhänge ({emailDetail.attachments.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {emailDetail.attachments.map((att, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={async () => {
                            try {
                              await jmap.downloadAttachment(att.blobId, att.name, att.type)
                            } catch (e) {
                              console.error('Download fehlgeschlagen:', e)
                            }
                          }}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${theme.border} ${theme.bgHover} text-sm cursor-pointer`}
                        >
                          <Paperclip size={16} />
                          <span className="truncate max-w-[200px]">{att.name}</span>
                          <span className={`text-xs ${theme.textMuted}`}>
                            {(att.size / 1024).toFixed(0)} KB
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* Compose Modal */}
      {showCompose && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${theme.overlay}`}>
          <div className={`${theme.panel} rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col ${theme.cardShadow}`}>
            <div className={`flex items-center justify-between p-4 border-b ${theme.border}`}>
              <h3 className="font-semibold">
                {composeMode === 'reply' ? 'Antworten' : composeMode === 'forward' ? 'Weiterleiten' : 'Neue E-Mail'}
              </h3>
              <button
                type="button"
                onClick={() => setShowCompose(false)}
                className={`p-1.5 rounded-lg ${theme.bgHover}`}
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {sendError && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
                  <p className="text-rose-500 text-sm">{sendError}</p>
                </div>
              )}

              <div>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-1`}>An</label>
                <input
                  type="text"
                  value={composeData.to}
                  onChange={(e) => setComposeData(prev => ({ ...prev, to: e.target.value }))}
                  placeholder="empfaenger@example.com"
                  className={`w-full px-3 py-2 rounded-lg border ${theme.input} ${theme.text} text-sm`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-sm font-medium ${theme.textSecondary} mb-1`}>CC</label>
                  <input
                    type="text"
                    value={composeData.cc}
                    onChange={(e) => setComposeData(prev => ({ ...prev, cc: e.target.value }))}
                    placeholder="Optional"
                    className={`w-full px-3 py-2 rounded-lg border ${theme.input} ${theme.text} text-sm`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${theme.textSecondary} mb-1`}>BCC</label>
                  <input
                    type="text"
                    value={composeData.bcc}
                    onChange={(e) => setComposeData(prev => ({ ...prev, bcc: e.target.value }))}
                    placeholder="Optional"
                    className={`w-full px-3 py-2 rounded-lg border ${theme.input} ${theme.text} text-sm`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-1`}>Betreff</label>
                <input
                  type="text"
                  value={composeData.subject}
                  onChange={(e) => setComposeData(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Betreff"
                  className={`w-full px-3 py-2 rounded-lg border ${theme.input} ${theme.text} text-sm`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-1`}>Nachricht</label>
                <textarea
                  value={composeData.body}
                  onChange={(e) => setComposeData(prev => ({ ...prev, body: e.target.value }))}
                  placeholder="Nachricht schreiben..."
                  rows={12}
                  className={`w-full px-3 py-2 rounded-lg border ${theme.input} ${theme.text} text-sm resize-none`}
                />
              </div>
            </div>

            <div className={`flex items-center justify-end gap-3 p-4 border-t ${theme.border}`}>
              <button
                type="button"
                onClick={() => setShowCompose(false)}
                className={`px-4 py-2 rounded-lg border ${theme.border} ${theme.text} font-medium text-sm ${theme.bgHover}`}
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleSend}
                disabled={sending || !composeData.to.trim()}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${theme.primaryBg} text-white font-medium text-sm ${theme.primaryHover} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {sending ? (
                  <>
                    <CircleNotch size={18} className="animate-spin" />
                    Senden...
                  </>
                ) : (
                  <>
                    <PaperPlaneTilt size={18} />
                    Senden
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
