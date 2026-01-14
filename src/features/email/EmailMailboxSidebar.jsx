import { PaperPlaneTilt } from '@phosphor-icons/react'

export default function EmailMailboxSidebar({
  theme,
  account,
  mailboxes,
  selectedMailbox,
  onSelectMailbox,
  onCompose,
  getMailboxIcon,
}) {
  return (
    <div className={`w-48 flex-shrink-0 border-r ${theme.border} ${theme.bg} hidden md:flex flex-col`}>
      <div className={`p-3 border-b ${theme.border}`}>
        <button
          type="button"
          onClick={() => onCompose('new')}
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
            onClick={() => onSelectMailbox(mailbox)}
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
  )
}
