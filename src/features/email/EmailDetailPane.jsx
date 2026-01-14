import {
  ArrowBendUpLeft,
  ArrowBendUpRight,
  CaretLeft,
  CircleNotch,
  EnvelopeSimple,
  Paperclip,
  Trash,
} from '@phosphor-icons/react'

export default function EmailDetailPane({
  theme,
  selectedEmail,
  emailDetailLoading,
  emailDetail,
  onBack,
  onReply,
  onForward,
  onDelete,
  onDownloadAttachment,
  downloadingAttachmentId,
  getEmailBody,
}) {
  return (
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
          <div className={`p-4 border-b ${theme.border}`}>
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={onBack}
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
                  onClick={onReply}
                  className={`p-2 rounded-lg ${theme.bgHover}`}
                  title="Antworten"
                >
                  <ArrowBendUpLeft size={20} />
                </button>
                <button
                  type="button"
                  onClick={onForward}
                  className={`p-2 rounded-lg ${theme.bgHover}`}
                  title="Weiterleiten"
                >
                  <ArrowBendUpRight size={20} />
                </button>
                <button
                  type="button"
                  onClick={onDelete}
                  className={`p-2 rounded-lg ${theme.danger}`}
                  title="Löschen"
                >
                  <Trash size={20} />
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div
              className={`prose prose-sm max-w-none ${theme.text}`}
              dangerouslySetInnerHTML={{ __html: getEmailBody(emailDetail) }}
            />

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
                      onClick={() => onDownloadAttachment(att)}
                      disabled={downloadingAttachmentId === att.blobId}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${theme.border} ${theme.bgHover} text-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed`}
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
  )
}
