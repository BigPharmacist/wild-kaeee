import { useState, useRef, useEffect } from 'react'
import { ArrowBendUpLeft, ArrowBendUpRight, CaretDown, CircleNotch, EnvelopeOpen, EnvelopeSimple, Paperclip, PaperPlaneTilt, Printer, Trash } from '@phosphor-icons/react'

export default function EmailListPane({
  theme,
  mailboxes,
  selectedMailbox,
  onSelectMailbox,
  getMailboxIcon,
  emailsTotal,
  emailsLoading,
  emailsLoadingMore,
  emails,
  selectedEmail,
  onSelectEmail,
  onCompose,
  onScroll,
  listRef,
  formatDate,
  isSearchActive = false,
  onReply,
  onForward,
  onDelete,
  onToggleRead,
  onPrint,
}) {
  // Hilfsfunktion: Ordnername aus mailboxIds ermitteln
  const getMailboxName = (mailboxIds) => {
    if (!mailboxIds || !mailboxes.length) return null
    const mailboxId = Object.keys(mailboxIds)[0]
    const mailbox = mailboxes.find(m => m.id === mailboxId)
    return mailbox?.name || null
  }
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Kontextmenü State
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, email: null })
  const contextMenuRef = useRef(null)

  // Dropdown schließen bei Klick außerhalb
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [dropdownOpen])

  // Kontextmenü schließen bei Klick außerhalb
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target)) {
        setContextMenu(prev => ({ ...prev, visible: false }))
      }
    }
    if (contextMenu.visible) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [contextMenu.visible])

  // Kontextmenü Handler
  const handleContextMenu = (e, email) => {
    e.preventDefault()
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      email
    })
  }

  const closeContextMenu = () => {
    setContextMenu(prev => ({ ...prev, visible: false }))
  }

  const handleContextAction = (action) => {
    const email = contextMenu.email
    if (!email) return

    switch (action) {
      case 'reply':
        onReply?.(email)
        break
      case 'forward':
        onForward?.(email)
        break
      case 'delete':
        onDelete?.(email.id)
        break
      case 'toggleRead':
        onToggleRead?.(email.id, email.keywords?.['$seen'])
        break
      case 'print':
        onPrint?.(email)
        break
    }
    closeContextMenu()
  }

  const handleSelectMailbox = (mailbox) => {
    onSelectMailbox(mailbox)
    setDropdownOpen(false)
  }

  return (
    <div className={`w-80 flex-shrink-0 border-r ${theme.border} flex flex-col ${selectedEmail ? 'hidden lg:flex' : 'flex'}`}>
      <div className={`h-[52px] px-3 border-b ${theme.border} flex items-center gap-2`}>
        {/* Ordner-Dropdown */}
        <div className="relative flex-1" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border ${theme.border} ${theme.surface} ${theme.bgHover} text-sm font-medium`}
          >
            <span className={theme.textMuted}>{getMailboxIcon(selectedMailbox?.role)}</span>
            <span className="flex-1 text-left truncate">{selectedMailbox?.name || 'Ordner wählen'}</span>
            {selectedMailbox?.unreadEmails > 0 && (
              <span className={`text-xs font-medium ${theme.accentText}`}>{selectedMailbox.unreadEmails}</span>
            )}
            <CaretDown size={16} className={`${theme.textMuted} transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className={`absolute top-full left-0 right-0 mt-1 ${theme.surface} border ${theme.border} rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto`}>
              {mailboxes.map(mailbox => (
                <button
                  key={mailbox.id}
                  type="button"
                  onClick={() => handleSelectMailbox(mailbox)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
                    selectedMailbox?.id === mailbox.id
                      ? theme.navActive
                      : `${theme.text} ${theme.bgHover}`
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
          )}
        </div>

        {/* Verfassen Button */}
        <button
          type="button"
          onClick={() => onCompose('new')}
          className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg ${theme.primaryBg} text-white font-medium text-sm ${theme.primaryHover}`}
          title="Neue E-Mail verfassen"
        >
          <PaperPlaneTilt size={18} />
          <span className="hidden sm:inline">Verfassen</span>
        </button>
      </div>

      <div className={`px-3 py-1.5 border-b ${theme.border} flex items-center justify-end`}>
        <span className={`text-xs ${theme.textMuted}`}>{emailsTotal} E-Mails</span>
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto" onScroll={onScroll}>
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
              const folderName = isSearchActive ? getMailboxName(email.mailboxIds) : null

              return (
                <button
                  key={email.id}
                  type="button"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('emailId', email.id)
                    e.dataTransfer.effectAllowed = 'move'
                  }}
                  onClick={() => onSelectEmail(email)}
                  onContextMenu={(e) => handleContextMenu(e, email)}
                  className={`w-full text-left p-3 border-b ${theme.border} transition-colors cursor-grab active:cursor-grabbing ${
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
                        {folderName && (
                          <span className={`text-xs px-1.5 py-0.5 rounded ${theme.bg} ${theme.textMuted}`}>
                            {folderName}
                          </span>
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
            {emailsLoadingMore && (
              <div className="flex items-center justify-center py-4">
                <CircleNotch size={20} className={`animate-spin ${theme.textMuted}`} />
              </div>
            )}
            {!emailsLoadingMore && emails.length >= emailsTotal && emails.length > 0 && (
              <div className={`text-center py-3 text-xs ${theme.textMuted}`}>
                Alle {emailsTotal} E-Mails geladen
              </div>
            )}
          </>
        )}
      </div>

      {/* Kontextmenü */}
      {contextMenu.visible && (
        <div
          ref={contextMenuRef}
          className={`fixed ${theme.surface} border ${theme.border} rounded-lg shadow-lg z-[100] py-1 min-w-[180px]`}
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
        >
          <button
            type="button"
            onClick={() => handleContextAction('reply')}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm ${theme.text} ${theme.bgHover} text-left`}
          >
            <ArrowBendUpLeft size={18} className={theme.textMuted} />
            Antworten
          </button>
          <button
            type="button"
            onClick={() => handleContextAction('forward')}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm ${theme.text} ${theme.bgHover} text-left`}
          >
            <ArrowBendUpRight size={18} className={theme.textMuted} />
            Weiterleiten
          </button>
          <div className={`my-1 border-t ${theme.border}`} />
          <button
            type="button"
            onClick={() => handleContextAction('toggleRead')}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm ${theme.text} ${theme.bgHover} text-left`}
          >
            <EnvelopeOpen size={18} className={theme.textMuted} />
            {contextMenu.email?.keywords?.['$seen'] ? 'Als ungelesen markieren' : 'Als gelesen markieren'}
          </button>
          <button
            type="button"
            onClick={() => handleContextAction('print')}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm ${theme.text} ${theme.bgHover} text-left`}
          >
            <Printer size={18} className={theme.textMuted} />
            Drucken
          </button>
          <div className={`my-1 border-t ${theme.border}`} />
          <button
            type="button"
            onClick={() => handleContextAction('delete')}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-[#E5533D] hover:bg-[#FDE8E5] text-left`}
          >
            <Trash size={18} />
            Löschen
          </button>
        </div>
      )}
    </div>
  )
}
