import { Check, Checks, Trash } from '@phosphor-icons/react'

const ChatView = ({
  theme,
  chatLoading,
  chatMessages,
  staffByAuthId,
  session,
  chatEndRef,
  chatError,
  sendChatMessage,
  chatInput,
  setChatInput,
  chatSending,
  directChatUserId,
  directChatUser,
  messageReads,
  deleteChatMessage,
}) => {
  const chatTitle = directChatUserId
    ? `Chat mit ${directChatUser?.first_name || 'Unbekannt'}`
    : 'Gruppenchat'

  // Prüfen ob Nachricht gelesen wurde
  const isMessageRead = (messageId) => {
    const readers = messageReads?.[messageId] || []
    if (directChatUserId) {
      // Direktchat: Wurde vom Empfänger gelesen?
      return readers.includes(directChatUserId)
    } else {
      // Gruppenchat: Wurde von mindestens einer anderen Person gelesen?
      return readers.some((userId) => userId !== session?.user?.id)
    }
  }

  return (
  <>
    <h2 className="text-2xl lg:text-3xl font-semibold mb-6 tracking-tight">{chatTitle}</h2>
    <div className="flex flex-col h-[calc(100vh-180px)]">
      <div className={`flex-1 overflow-auto rounded-2xl border ${theme.border} ${theme.bg} p-4 space-y-4`}>
        {chatLoading && (
          <p className={theme.textMuted}>Nachrichten werden geladen...</p>
        )}
        {!chatLoading && chatMessages.length === 0 && (
          <p className={theme.textMuted}>Noch keine Nachrichten. Starte den Chat.</p>
        )}
        {/* Timeline Container */}
        <div className="relative">
          {/* Vertikale Mittellinie */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[#E5E7EB] -translate-x-1/2" />

          {chatMessages.map((entry) => {
            const sender = staffByAuthId[entry.user_id] || {}
            const senderName = sender.first_name || 'Unbekannt'
            const timeLabel = entry.created_at
              ? new Date(entry.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
              : ''
            const isOwn = entry.user_id === session.user.id
            const wasRead = isOwn && isMessageRead(entry.id)

            const Avatar = () => (
              sender.avatar_url ? (
                <img
                  src={sender.avatar_url}
                  alt={senderName}
                  className={`h-9 w-9 rounded-full object-cover border ${theme.border} flex-shrink-0`}
                />
              ) : (
                <div className={`h-9 w-9 rounded-full border ${theme.border} flex items-center justify-center text-xs ${theme.textMuted} flex-shrink-0 bg-white`}>
                  {senderName?.[0]?.toUpperCase() || '?'}
                </div>
              )
            )

            // Häkchen-Komponente für eigene Nachrichten
            const ReadStatus = () => {
              if (!isOwn) return null
              return wasRead ? (
                <Checks size={14} weight="bold" className="text-[#0D9488]" title="Gelesen" />
              ) : (
                <Check size={14} weight="bold" className="text-[#64748B]" title="Gesendet" />
              )
            }

            return (
              <div
                key={entry.id}
                className="relative flex items-start mb-2"
              >
                {/* Avatar zentriert auf der Mittellinie */}
                <div className={`absolute left-1/2 top-0 -translate-x-1/2 ${isOwn ? '-ml-[22px]' : 'ml-[22px]'}`}>
                  <Avatar />
                </div>

                {isOwn ? (
                  /* Eigene Nachricht: Links von der Mittellinie */
                  <>
                    <div className="w-1/2 pr-12 flex justify-end group">
                      <div className="max-w-[85%] text-right">
                        <div className={`text-xs ${theme.textMuted} flex items-center gap-2 justify-end mb-0.5`}>
                          {!entry.deleted_at && (
                            <button
                              type="button"
                              onClick={() => deleteChatMessage(entry.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-rose-400 hover:text-rose-500"
                              title="Nachricht löschen"
                            >
                              <Trash size={14} />
                            </button>
                          )}
                          <span>{senderName}</span>
                          {timeLabel && <span>{timeLabel}</span>}
                          <ReadStatus />
                        </div>
                        <div className={`inline-block rounded-2xl px-4 py-2 border ${entry.deleted_at ? `${theme.panel} ${theme.border}` : 'bg-[#F59E0B]/15 border-[#F59E0B]/30 text-[#1E293B]'}`}>
                          {entry.deleted_at ? (
                            <p className={`text-sm italic ${theme.textMuted}`}>Nachricht gelöscht</p>
                          ) : (
                            <p className="text-sm leading-relaxed whitespace-pre-wrap text-left">{entry.message}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="w-1/2" />
                  </>
                ) : (
                  /* Partner Nachricht: Rechts von der Mittellinie */
                  <>
                    <div className="w-1/2" />
                    <div className="w-1/2 pl-12 flex justify-start">
                      <div className="max-w-[85%]">
                        <div className={`text-xs ${theme.textMuted} flex items-center gap-2 mb-0.5`}>
                          <span>{senderName}</span>
                          {timeLabel && <span>{timeLabel}</span>}
                        </div>
                        <div className={`inline-block rounded-2xl px-4 py-2 border ${theme.panel} ${theme.border}`}>
                          {entry.deleted_at ? (
                            <p className={`text-sm italic ${theme.textMuted}`}>Nachricht gelöscht</p>
                          ) : (
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{entry.message}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
        <div ref={chatEndRef} />
      </div>

      {chatError && (
        <div className="mt-3 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
          <p className="text-rose-400 text-sm">{chatError}</p>
        </div>
      )}

      <form onSubmit={sendChatMessage} className="mt-4 flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={chatInput}
          onChange={(event) => setChatInput(event.target.value)}
          placeholder="Nachricht schreiben..."
          className={`flex-1 px-4 py-3 rounded-xl border ${theme.input} ${theme.inputPlaceholder}`}
        />
        <button
          type="submit"
          disabled={chatSending || !chatInput.trim()}
          className={`px-5 py-3 rounded-xl text-sm font-semibold ${theme.accent} text-white disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          {chatSending ? 'Senden...' : 'Senden'}
        </button>
      </form>
    </div>
  </>
  )
}

export default ChatView
