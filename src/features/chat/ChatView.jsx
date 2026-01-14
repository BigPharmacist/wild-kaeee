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
}) => (
  <>
    <h2 className="text-2xl lg:text-3xl font-semibold mb-6 tracking-tight">Chat</h2>
    <div className="flex flex-col h-[70vh]">
      <div className={`flex-1 overflow-auto rounded-2xl border ${theme.border} ${theme.bg} p-4 space-y-4`}>
        {chatLoading && (
          <p className={theme.textMuted}>Nachrichten werden geladen...</p>
        )}
        {!chatLoading && chatMessages.length === 0 && (
          <p className={theme.textMuted}>Noch keine Nachrichten. Starte den Chat.</p>
        )}
        {chatMessages.map((entry) => {
          const sender = staffByAuthId[entry.user_id] || {}
          const senderName = sender.first_name || 'Unbekannt'
          const timeLabel = entry.created_at
            ? new Date(entry.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
            : ''
          const isOwn = entry.user_id === session.user.id
          return (
            <div
              key={entry.id}
              className={`flex items-start gap-3 ${isOwn ? 'flex-row-reverse text-right' : ''}`}
            >
              {sender.avatar_url ? (
                <img
                  src={sender.avatar_url}
                  alt={senderName}
                  className={`h-9 w-9 rounded-full object-cover border ${theme.border}`}
                />
              ) : (
                <div className={`h-9 w-9 rounded-full border ${theme.border} flex items-center justify-center text-xs ${theme.textMuted}`}>
                  {senderName?.[0]?.toUpperCase() || '?'}
                </div>
              )}
              <div className="max-w-[75%]">
                <div className={`text-xs ${theme.textMuted} flex items-center gap-2 ${isOwn ? 'justify-end' : ''}`}>
                  <span>{senderName}</span>
                  {timeLabel && <span>{timeLabel}</span>}
                </div>
                <div
                  className={`inline-block mt-2 rounded-2xl px-4 py-2 border ${
                    isOwn
                      ? 'bg-[#FD8916]/15 border-[#FD8916]/30 text-[#173B61]'
                      : `${theme.panel} ${theme.border}`
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{entry.message}</p>
                </div>
              </div>
            </div>
          )
        })}
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

export default ChatView
