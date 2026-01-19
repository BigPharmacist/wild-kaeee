import { useCallback, useEffect, useRef, useState } from 'react'
import { CircleNotch, EnvelopeSimple, File, Folder, GearSix, MagnifyingGlass, PaperPlaneRight, Tray, Trash, Warning, X } from '@phosphor-icons/react'
import EmailComposeModal from './EmailComposeModal'
import EmailDetailPane from './EmailDetailPane'
import EmailFolderSidebar from './EmailFolderSidebar'
import EmailListPane from './EmailListPane'
import { formatEmailDate, getEmailBodyHtml } from './emailUtils'
import useEmailAttachments from './useEmailAttachments'
import useEmailCompose from './useEmailCompose'
import useJmapMail from './useJmapMail'
import { jmap } from '../../lib/jmap'

export default function EmailView({ theme, account, hasAccess, onConfigureClick, aiSettings }) {
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

  const {
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
    handleToggleRead,
    setSelectedEmail,
    setEmailDetail,
    searchQuery,
    searchResults,
    searchLoading,
    searchEmails,
    clearSearch,
  } = useJmapMail({ account })

  const {
    showCompose,
    composeMode,
    composeData,
    originalEmail,
    attachments,
    sending,
    sendError,
    sendSuccess,
    openCompose,
    closeCompose,
    handleSend,
    setComposeData,
    addAttachment,
    removeAttachment,
  } = useEmailCompose({ selectedMailbox, loadEmails, formatDate: formatEmailDate, signature: account?.signature || '' })

  const { downloadingAttachmentId, downloadAttachment } = useEmailAttachments()

  // Suche (lokaler Input + debounced Server-Suche)
  const [searchInput, setSearchInput] = useState('')
  const searchTimeoutRef = useRef(null)

  // Debounced Suche auslösen
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (!searchInput.trim()) {
      clearSearch()
      return
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchEmails(searchInput.trim())
    }, 300)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchInput, searchEmails, clearSearch])

  // Folder-Sidebar (eingeklappt per default)
  const [folderSidebarExpanded, setFolderSidebarExpanded] = useState(false)

  // Refs
  const emailListRef = useRef(null)

  // Scroll-Handler für Infinite Scroll
  const handleEmailListScroll = useCallback((e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target
    // Nachladen wenn 100px vor dem Ende
    if (scrollHeight - scrollTop - clientHeight < 100) {
      loadMoreEmails()
    }
  }, [loadMoreEmails])

  // Zurück zur Liste (Mobile)
  const handleBackToList = () => {
    setSelectedEmail(null)
    setEmailDetail(null)
  }

  // Kontextmenü-Aktionen: Laden E-Mail-Details wenn nötig
  const handleContextReply = useCallback(async (email) => {
    const detail = await jmap.getEmail(email.id)
    openCompose('reply', detail)
  }, [openCompose])

  const handleContextForward = useCallback(async (email) => {
    const detail = await jmap.getEmail(email.id)
    openCompose('forward', detail)
  }, [openCompose])

  const handleContextPrint = useCallback(async (email) => {
    const detail = await jmap.getEmail(email.id)
    const printWindow = window.open('', '_blank')
    const from = detail.from?.[0]
    const to = detail.to?.map(t => t.email).join(', ')
    const date = new Date(detail.receivedAt).toLocaleString('de-DE')

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${detail.subject || 'E-Mail'}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
          .header { border-bottom: 1px solid #e5e7eb; padding-bottom: 16px; margin-bottom: 24px; }
          .subject { font-size: 24px; font-weight: 600; margin-bottom: 12px; }
          .meta { color: #6b7280; font-size: 14px; line-height: 1.6; }
          .meta strong { color: #374151; }
          .body { line-height: 1.6; }
          .body img { max-width: 100%; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="subject">${detail.subject || '(Kein Betreff)'}</div>
          <div class="meta">
            <div><strong>Von:</strong> ${from?.name || ''} &lt;${from?.email || ''}&gt;</div>
            <div><strong>An:</strong> ${to}</div>
            <div><strong>Datum:</strong> ${date}</div>
          </div>
        </div>
        <div class="body">${getEmailBodyHtml(detail)}</div>
      </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }, [])

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

  // Angezeigte E-Mails: Suchergebnisse oder normale Ordner-Ansicht
  const isSearchActive = searchResults !== null
  const displayedEmails = isSearchActive ? searchResults.emails : emails
  const displayedTotal = isSearchActive ? searchResults.total : emailsTotal

  // Main Email View
  return (
    <div className={`${theme.panel} rounded-2xl border ${theme.border} ${theme.cardShadow} overflow-hidden`}>
      {/* Suchfeld */}
      <div className={`p-3 border-b ${theme.border}`}>
        <div className="relative">
          {searchLoading ? (
            <CircleNotch size={18} className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme.textMuted} animate-spin`} />
          ) : (
            <MagnifyingGlass size={18} className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme.textMuted}`} />
          )}
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Alle E-Mails durchsuchen..."
            className={`w-full pl-10 pr-10 py-2 rounded-lg border ${theme.border} ${theme.surface} ${theme.text} text-sm outline-none focus:border-[#4C8BF5] focus:ring-1 focus:ring-[#4C8BF5]`}
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput('')}
              className={`absolute right-3 top-1/2 -translate-y-1/2 ${theme.textMuted} hover:${theme.text}`}
            >
              <X size={16} />
            </button>
          )}
        </div>
        {isSearchActive && (
          <div className={`mt-2 text-xs ${theme.textMuted}`}>
            {searchResults.total} Treffer in allen Ordnern
          </div>
        )}
      </div>

      <div className="flex h-[calc(100vh-280px)] min-h-[500px] overflow-hidden">
        <EmailFolderSidebar
          theme={theme}
          account={account}
          mailboxes={mailboxes}
          selectedMailbox={selectedMailbox}
          onSelectMailbox={setSelectedMailbox}
          onMoveEmail={handleMoveEmail}
          getMailboxIcon={getMailboxIcon}
          isExpanded={folderSidebarExpanded}
          onToggle={() => setFolderSidebarExpanded(!folderSidebarExpanded)}
        />

        <EmailListPane
          theme={theme}
          mailboxes={mailboxes}
          selectedMailbox={selectedMailbox}
          onSelectMailbox={setSelectedMailbox}
          getMailboxIcon={getMailboxIcon}
          emailsTotal={displayedTotal}
          emailsLoading={emailsLoading || searchLoading}
          emailsLoadingMore={emailsLoadingMore}
          emails={displayedEmails}
          selectedEmail={selectedEmail}
          onSelectEmail={handleSelectEmail}
          onCompose={openCompose}
          onScroll={handleEmailListScroll}
          listRef={emailListRef}
          formatDate={formatEmailDate}
          isSearchActive={isSearchActive}
          onReply={handleContextReply}
          onForward={handleContextForward}
          onDelete={handleDeleteEmail}
          onToggleRead={handleToggleRead}
          onPrint={handleContextPrint}
        />

        <EmailDetailPane
          theme={theme}
          selectedEmail={selectedEmail}
          emailDetailLoading={emailDetailLoading}
          emailDetail={emailDetail}
          onBack={handleBackToList}
          onReply={() => openCompose('reply', emailDetail)}
          onForward={() => openCompose('forward', emailDetail)}
          onDelete={() => handleDeleteEmail(emailDetail.id)}
          onDownloadAttachment={downloadAttachment}
          downloadingAttachmentId={downloadingAttachmentId}
          getEmailBody={getEmailBodyHtml}
        />
      </div>

      <EmailComposeModal
        theme={theme}
        show={showCompose}
        composeMode={composeMode}
        composeData={composeData}
        originalEmail={originalEmail}
        attachments={attachments}
        sendError={sendError}
        sending={sending}
        sendSuccess={sendSuccess}
        onClose={closeCompose}
        onSend={handleSend}
        setComposeData={setComposeData}
        onAddAttachment={addAttachment}
        onRemoveAttachment={removeAttachment}
        aiSettings={aiSettings}
      />
    </div>
  )
}
