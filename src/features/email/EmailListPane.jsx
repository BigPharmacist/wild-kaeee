import { CircleNotch, EnvelopeSimple, Paperclip, PaperPlaneTilt } from '@phosphor-icons/react'

export default function EmailListPane({
  theme,
  selectedMailbox,
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
}) {
  return (
    <div className={`w-80 flex-shrink-0 border-r ${theme.border} flex flex-col ${selectedEmail ? 'hidden lg:flex' : 'flex'}`}>
      <div className={`p-3 border-b ${theme.border} flex items-center justify-between`}>
        <h4 className="font-medium text-sm">{selectedMailbox?.name || 'E-Mails'}</h4>
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

              return (
                <button
                  key={email.id}
                  type="button"
                  onClick={() => onSelectEmail(email)}
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

      <div className={`p-3 border-t ${theme.border} md:hidden`}>
        <button
          type="button"
          onClick={() => onCompose('new')}
          className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg ${theme.primaryBg} text-white font-medium text-sm ${theme.primaryHover}`}
        >
          <PaperPlaneTilt size={18} />
          Verfassen
        </button>
      </div>
    </div>
  )
}
