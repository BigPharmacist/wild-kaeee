import { useState } from 'react'
import { CaretLeft, CaretRight } from '@phosphor-icons/react'

export default function EmailFolderSidebar({
  theme,
  account,
  mailboxes,
  selectedMailbox,
  onSelectMailbox,
  onMoveEmail,
  getMailboxIcon,
  isExpanded,
  onToggle,
}) {
  const [dragOverMailboxId, setDragOverMailboxId] = useState(null)

  const handleDragOver = (e, mailboxId) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverMailboxId(mailboxId)
  }

  const handleDragLeave = () => {
    setDragOverMailboxId(null)
  }

  const handleDrop = (e, mailboxId) => {
    e.preventDefault()
    setDragOverMailboxId(null)
    const emailId = e.dataTransfer.getData('emailId')
    if (emailId && mailboxId) {
      onMoveEmail(emailId, mailboxId)
    }
  }

  return (
    <div
      className={`flex-shrink-0 border-r ${theme.border} ${theme.surface} flex flex-col transition-all duration-200 ${
        isExpanded ? 'w-48' : 'w-10'
      }`}
    >
      {/* Toggle Button - gleiche Höhe wie EmailListPane Header (h-[52px]) */}
      <div className={`h-[52px] px-2 border-b ${theme.border} flex items-center ${isExpanded ? 'justify-end' : 'justify-center'}`}>
        <button
          type="button"
          onClick={onToggle}
          className={`p-2 rounded-lg ${theme.bgHover} ${theme.textMuted} hover:${theme.text}`}
          title={isExpanded ? 'Ordner einklappen' : 'Ordner ausklappen'}
        >
          {isExpanded ? <CaretLeft size={18} /> : <CaretRight size={18} />}
        </button>
      </div>

      {/* Mailbox-Liste */}
      <div className="flex-1 overflow-y-auto p-1.5">
        {mailboxes.map(mailbox => {
          const isDragOver = dragOverMailboxId === mailbox.id
          const isCurrentMailbox = selectedMailbox?.id === mailbox.id

          return (
            <button
              key={mailbox.id}
              type="button"
              onClick={() => onSelectMailbox(mailbox)}
              onDragOver={(e) => handleDragOver(e, mailbox.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, mailbox.id)}
              className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm transition-colors mb-0.5 ${
                isDragOver
                  ? 'bg-[#4C8BF5]/20 ring-2 ring-[#4C8BF5]'
                  : isCurrentMailbox
                    ? theme.navActive
                    : `${theme.text} ${theme.navHover}`
              } ${!isExpanded ? 'justify-center' : ''}`}
              title={!isExpanded ? mailbox.name : undefined}
            >
              <span className={isCurrentMailbox ? theme.accentText : theme.textMuted}>
                {getMailboxIcon(mailbox.role)}
              </span>
              {isExpanded && (
                <>
                  <span className="flex-1 truncate text-left">{mailbox.name}</span>
                  {mailbox.unreadEmails > 0 && (
                    <span className={`text-xs font-medium ${theme.accentText}`}>{mailbox.unreadEmails}</span>
                  )}
                </>
              )}
              {!isExpanded && mailbox.unreadEmails > 0 && (
                <span className={`absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#4C8BF5]`} />
              )}
            </button>
          )
        })}
      </div>

      {/* Account Info (nur wenn ausgeklappt) */}
      {isExpanded && account && (
        <div className={`p-2 border-t ${theme.border}`}>
          <p className={`text-xs ${theme.textMuted} truncate`}>{account.email}</p>
        </div>
      )}
    </div>
  )
}
