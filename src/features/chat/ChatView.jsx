import { useState, useRef } from 'react'
import { Check, Checks, Trash, ArrowUp, PencilSimple, X, ArrowClockwise, Smiley, Paperclip, File, DownloadSimple, Image } from '@phosphor-icons/react'

const ChatView = ({
  theme,
  chatLoading,
  chatLoadingMore,
  chatMessages,
  staffByAuthId,
  session,
  chatEndRef,
  chatError,
  isSendError,
  sendChatMessage,
  chatInput,
  setChatInput,
  chatSending,
  directChatUserId,
  directChatUser,
  messageReads,
  messageReactions,
  deleteChatMessage,
  hasMoreMessages,
  loadMoreMessages,
  fetchChatMessages,
  editingMessageId,
  setEditingMessageId,
  editChatMessage,
  canEditMessage,
  toggleReaction,
  selectChatFile,
  pendingFile,
  setPendingFile,
  EMOJI_SET,
  ALLOWED_FILE_TYPES,
}) => {
  const [editText, setEditText] = useState('')
  const [emojiMenuOpenFor, setEmojiMenuOpenFor] = useState(null) // messageId oder null
  const [imagePreview, setImagePreview] = useState(null) // Bild-Vollansicht
  const fileInputRef = useRef(null)
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

  // Reaktionen für eine Nachricht gruppiert nach Emoji
  const getGroupedReactions = (messageId) => {
    const reactions = messageReactions?.[messageId] || []
    const grouped = {}
    reactions.forEach((r) => {
      if (!grouped[r.emoji]) grouped[r.emoji] = []
      grouped[r.emoji].push(r.user_id)
    })
    return grouped
  }

  // Prüfen ob der aktuelle User eine bestimmte Reaktion hat
  const hasUserReacted = (messageId, emoji) => {
    const reactions = messageReactions?.[messageId] || []
    return reactions.some((r) => r.user_id === session?.user?.id && r.emoji === emoji)
  }

  // Prüfen ob file_type ein Bild ist
  const isImage = (fileType) => fileType?.startsWith('image/')

  // Datei-Anhang Komponente
  const FileAttachment = ({ entry }) => {
    if (!entry.file_url) return null

    if (isImage(entry.file_type)) {
      return (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setImagePreview(entry.file_url)}
            className="block"
          >
            <img
              src={entry.file_url}
              alt={entry.file_name || 'Bild'}
              className="max-w-[200px] max-h-[200px] rounded-lg object-cover border border-[#CBD5E1] hover:opacity-90 transition-opacity cursor-pointer"
            />
          </button>
          <p className={`text-xs ${theme.textMuted} mt-1`}>{entry.file_name}</p>
        </div>
      )
    }

    // PDF oder andere Datei
    return (
      <a
        href={entry.file_url}
        target="_blank"
        rel="noopener noreferrer"
        className={`mt-2 flex items-center gap-2 px-3 py-2 rounded-lg border ${theme.border} ${theme.surface} hover:bg-[#FEF3C7]/30 transition-colors`}
      >
        <File size={20} className="text-[#F59E0B]" />
        <span className="text-sm flex-1 truncate">{entry.file_name || 'Datei'}</span>
        <DownloadSimple size={16} className={theme.textMuted} />
      </a>
    )
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
        {/* Ältere Nachrichten laden */}
        {hasMoreMessages && (
          <div className="flex justify-center mb-4">
            <button
              type="button"
              onClick={loadMoreMessages}
              disabled={chatLoadingMore}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border ${theme.border} ${theme.surface} ${theme.textSecondary} hover:bg-[#FEF3C7]/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
            >
              <ArrowUp size={16} />
              {chatLoadingMore ? 'Wird geladen...' : 'Ältere Nachrichten laden'}
            </button>
          </div>
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
            const isEditing = editingMessageId === entry.id
            const isEditable = canEditMessage(entry)

            const startEditing = () => {
              setEditText(entry.message)
              setEditingMessageId(entry.id)
            }

            const cancelEditing = () => {
              setEditText('')
              setEditingMessageId(null)
            }

            const saveEdit = async () => {
              if (editText.trim() && editText.trim() !== entry.message) {
                await editChatMessage(entry.id, editText)
              } else {
                cancelEditing()
              }
            }

            const avatar = sender.avatar_url ? (
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

            const readStatus = isOwn ? (
              wasRead ? (
                <Checks size={14} weight="bold" className="text-[#0D9488]" title="Gelesen" />
              ) : (
                <Check size={14} weight="bold" className="text-[#64748B]" title="Gesendet" />
              )
            ) : null

            return (
              <div
                key={entry.id}
                className="relative flex items-start mb-2"
              >
                {/* Avatar zentriert auf der Mittellinie */}
                <div className={`absolute left-1/2 top-0 -translate-x-1/2 ${isOwn ? '-ml-[22px]' : 'ml-[22px]'}`}>
                  {avatar}
                </div>

                {isOwn ? (
                  /* Eigene Nachricht: Links von der Mittellinie */
                  <>
                    <div className="w-1/2 pr-12 flex justify-end group">
                      <div className="max-w-[85%] text-right">
                        <div className={`text-xs ${theme.textMuted} flex items-center gap-2 justify-end mb-0.5`}>
                          {!entry.deleted_at && !isEditing && (
                            <>
                              {/* Emoji-Reaktion Button */}
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={() => setEmojiMenuOpenFor(emojiMenuOpenFor === entry.id ? null : entry.id)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity text-[#64748B] hover:text-[#F59E0B]"
                                  title="Reagieren"
                                >
                                  <Smiley size={14} />
                                </button>
                                {/* Emoji-Auswahl-Menü */}
                                {emojiMenuOpenFor === entry.id && (
                                  <div className="absolute bottom-full right-0 mb-1 flex gap-1 p-1.5 rounded-lg bg-white border border-[#CBD5E1] shadow-lg z-10">
                                    {EMOJI_SET?.map((emoji) => (
                                      <button
                                        key={emoji}
                                        type="button"
                                        onClick={() => {
                                          toggleReaction(entry.id, emoji)
                                          setEmojiMenuOpenFor(null)
                                        }}
                                        className={`text-lg hover:scale-125 transition-transform ${hasUserReacted(entry.id, emoji) ? 'opacity-100' : 'opacity-70 hover:opacity-100'}`}
                                        title={emoji}
                                      >
                                        {emoji}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                              {isEditable && (
                                <button
                                  type="button"
                                  onClick={startEditing}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity text-[#0D9488] hover:text-[#0F766E]"
                                  title="Nachricht bearbeiten"
                                >
                                  <PencilSimple size={14} />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => deleteChatMessage(entry.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-rose-400 hover:text-rose-500"
                                title="Nachricht löschen"
                              >
                                <Trash size={14} />
                              </button>
                            </>
                          )}
                          <span>{senderName}</span>
                          {timeLabel && <span>{timeLabel}</span>}
                          {entry.edited_at && <span className="italic">(bearbeitet)</span>}
                          {readStatus}
                        </div>
                        <div className={`inline-block rounded-2xl px-4 py-2 border ${entry.deleted_at ? `${theme.panel} ${theme.border}` : 'bg-[#F59E0B]/15 border-[#F59E0B]/30 text-[#1E293B]'}`}>
                          {entry.deleted_at ? (
                            <p className={`text-sm italic ${theme.textMuted}`}>Nachricht gelöscht</p>
                          ) : isEditing ? (
                            <div className="flex flex-col gap-2">
                              <input
                                type="text"
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveEdit()
                                  if (e.key === 'Escape') cancelEditing()
                                }}
                                className={`w-full px-3 py-1.5 text-sm rounded-lg border ${theme.input}`}
                                autoFocus
                              />
                              <div className="flex gap-2 justify-end">
                                <button
                                  type="button"
                                  onClick={cancelEditing}
                                  className={`p-1.5 rounded-lg ${theme.textMuted} hover:bg-[#E5E7EB]`}
                                  title="Abbrechen"
                                >
                                  <X size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={saveEdit}
                                  className="p-1.5 rounded-lg text-[#0D9488] hover:bg-[#0D9488]/10"
                                  title="Speichern"
                                >
                                  <Check size={14} weight="bold" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              {entry.message && <p className="text-sm leading-relaxed whitespace-pre-wrap text-left">{entry.message}</p>}
                              <FileAttachment entry={entry} />
                            </>
                          )}
                        </div>
                        {/* Reaktionen anzeigen */}
                        {!entry.deleted_at && Object.keys(getGroupedReactions(entry.id)).length > 0 && (
                          <div className="flex gap-1 justify-end mt-1">
                            {Object.entries(getGroupedReactions(entry.id)).map(([emoji, userIds]) => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => toggleReaction(entry.id, emoji)}
                                className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs border transition-colors ${
                                  userIds.includes(session?.user?.id)
                                    ? 'bg-[#F59E0B]/20 border-[#F59E0B]/40 text-[#1E293B]'
                                    : 'bg-white border-[#CBD5E1] text-[#64748B] hover:bg-[#FEF3C7]/50'
                                }`}
                                title={userIds.map((id) => staffByAuthId[id]?.first_name || 'Unbekannt').join(', ')}
                              >
                                <span>{emoji}</span>
                                <span>{userIds.length}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="w-1/2" />
                  </>
                ) : (
                  /* Partner Nachricht: Rechts von der Mittellinie */
                  <>
                    <div className="w-1/2" />
                    <div className="w-1/2 pl-12 flex justify-start group">
                      <div className="max-w-[85%]">
                        <div className={`text-xs ${theme.textMuted} flex items-center gap-2 mb-0.5`}>
                          <span>{senderName}</span>
                          {timeLabel && <span>{timeLabel}</span>}
                          {/* Emoji-Reaktion Button für Partner-Nachrichten */}
                          {!entry.deleted_at && (
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setEmojiMenuOpenFor(emojiMenuOpenFor === entry.id ? null : entry.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-[#64748B] hover:text-[#F59E0B]"
                                title="Reagieren"
                              >
                                <Smiley size={14} />
                              </button>
                              {/* Emoji-Auswahl-Menü */}
                              {emojiMenuOpenFor === entry.id && (
                                <div className="absolute bottom-full left-0 mb-1 flex gap-1 p-1.5 rounded-lg bg-white border border-[#CBD5E1] shadow-lg z-10">
                                  {EMOJI_SET?.map((emoji) => (
                                    <button
                                      key={emoji}
                                      type="button"
                                      onClick={() => {
                                        toggleReaction(entry.id, emoji)
                                        setEmojiMenuOpenFor(null)
                                      }}
                                      className={`text-lg hover:scale-125 transition-transform ${hasUserReacted(entry.id, emoji) ? 'opacity-100' : 'opacity-70 hover:opacity-100'}`}
                                      title={emoji}
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className={`inline-block rounded-2xl px-4 py-2 border ${theme.panel} ${theme.border}`}>
                          {entry.deleted_at ? (
                            <p className={`text-sm italic ${theme.textMuted}`}>Nachricht gelöscht</p>
                          ) : (
                            <>
                              {entry.message && <p className="text-sm leading-relaxed whitespace-pre-wrap">{entry.message}</p>}
                              <FileAttachment entry={entry} />
                            </>
                          )}
                        </div>
                        {/* Reaktionen anzeigen */}
                        {!entry.deleted_at && Object.keys(getGroupedReactions(entry.id)).length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {Object.entries(getGroupedReactions(entry.id)).map(([emoji, userIds]) => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => toggleReaction(entry.id, emoji)}
                                className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs border transition-colors ${
                                  userIds.includes(session?.user?.id)
                                    ? 'bg-[#F59E0B]/20 border-[#F59E0B]/40 text-[#1E293B]'
                                    : 'bg-white border-[#CBD5E1] text-[#64748B] hover:bg-[#FEF3C7]/50'
                                }`}
                                title={userIds.map((id) => staffByAuthId[id]?.first_name || 'Unbekannt').join(', ')}
                              >
                                <span>{emoji}</span>
                                <span>{userIds.length}</span>
                              </button>
                            ))}
                          </div>
                        )}
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
        <div className="mt-3 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
          <p className="text-rose-400 text-sm">{chatError}</p>
          <button
            type="button"
            onClick={isSendError ? sendChatMessage : fetchChatMessages}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-lg transition-colors whitespace-nowrap"
          >
            <ArrowClockwise size={16} />
            {isSendError ? 'Nochmal senden' : 'Erneut versuchen'}
          </button>
        </div>
      )}

      {/* Datei-Vorschau */}
      {pendingFile && (
        <div className={`mt-3 flex items-center gap-3 px-4 py-3 rounded-xl border ${theme.border} ${theme.surface}`}>
          {isImage(pendingFile.type) ? (
            <Image size={20} className="text-[#F59E0B]" />
          ) : (
            <File size={20} className="text-[#F59E0B]" />
          )}
          <span className="text-sm flex-1 truncate">{pendingFile.name}</span>
          <span className={`text-xs ${theme.textMuted}`}>
            {(pendingFile.size / 1024 / 1024).toFixed(2)} MB
          </span>
          <button
            type="button"
            onClick={() => setPendingFile(null)}
            className="p-1 rounded-lg text-rose-400 hover:text-rose-500 hover:bg-rose-500/10"
            title="Datei entfernen"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <form onSubmit={sendChatMessage} className="mt-4 flex flex-col sm:flex-row gap-2">
        {/* Versteckter File-Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_FILE_TYPES?.join(',')}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) selectChatFile(file)
            e.target.value = '' // Reset für erneute Auswahl
          }}
          className="hidden"
        />

        {/* Datei-Auswahl Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={chatSending}
          className={`p-3 rounded-xl border ${theme.border} ${theme.surface} text-[#64748B] hover:text-[#F59E0B] hover:bg-[#FEF3C7]/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors`}
          title="Datei anhängen"
        >
          <Paperclip size={20} />
        </button>

        <input
          type="text"
          value={chatInput}
          onChange={(event) => setChatInput(event.target.value)}
          placeholder={pendingFile ? 'Beschreibung (optional)...' : 'Nachricht schreiben...'}
          className={`flex-1 px-4 py-3 rounded-xl border ${theme.input} ${theme.inputPlaceholder}`}
        />
        <button
          type="submit"
          disabled={chatSending || (!chatInput.trim() && !pendingFile)}
          className={`px-5 py-3 rounded-xl text-sm font-semibold ${theme.accent} text-white disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          {chatSending ? 'Senden...' : 'Senden'}
        </button>
      </form>
    </div>

    {/* Bild-Vollansicht Modal */}
    {imagePreview && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
        onClick={() => setImagePreview(null)}
      >
        <button
          type="button"
          onClick={() => setImagePreview(null)}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          title="Schließen"
        >
          <X size={24} />
        </button>
        <img
          src={imagePreview}
          alt="Vollansicht"
          className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    )}
  </>
  )
}

export default ChatView
