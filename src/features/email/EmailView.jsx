import { useCallback, useRef } from 'react'
import { CircleNotch, EnvelopeSimple, File, Folder, GearSix, PaperPlaneRight, Tray, Trash, Warning } from '@phosphor-icons/react'
import EmailComposeModal from './EmailComposeModal'
import EmailDetailPane from './EmailDetailPane'
import EmailListPane from './EmailListPane'
import EmailMailboxSidebar from './EmailMailboxSidebar'
import { formatEmailDate, getEmailBodyHtml } from './emailUtils'
import useEmailAttachments from './useEmailAttachments'
import useEmailCompose from './useEmailCompose'
import useJmapMail from './useJmapMail'

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
    setSelectedEmail,
    setEmailDetail,
  } = useJmapMail({ account })

  const {
    showCompose,
    composeMode,
    composeData,
    sending,
    sendError,
    openCompose,
    closeCompose,
    handleSend,
    setComposeData,
  } = useEmailCompose({ selectedMailbox, loadEmails, formatDate: formatEmailDate })

  const { downloadingAttachmentId, downloadAttachment } = useEmailAttachments()

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
        <EmailMailboxSidebar
          theme={theme}
          account={account}
          mailboxes={mailboxes}
          selectedMailbox={selectedMailbox}
          onSelectMailbox={setSelectedMailbox}
          onCompose={openCompose}
          getMailboxIcon={getMailboxIcon}
        />

        <EmailListPane
          theme={theme}
          selectedMailbox={selectedMailbox}
          emailsTotal={emailsTotal}
          emailsLoading={emailsLoading}
          emailsLoadingMore={emailsLoadingMore}
          emails={emails}
          selectedEmail={selectedEmail}
          onSelectEmail={handleSelectEmail}
          onCompose={openCompose}
          onScroll={handleEmailListScroll}
          listRef={emailListRef}
          formatDate={formatEmailDate}
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
        sendError={sendError}
        sending={sending}
        onClose={closeCompose}
        onSend={handleSend}
        setComposeData={setComposeData}
      />
    </div>
  )
}
