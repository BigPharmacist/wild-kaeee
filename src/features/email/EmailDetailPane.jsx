import {
  ArrowBendUpLeft,
  ArrowBendUpRight,
  CaretLeft,
  CircleNotch,
  EnvelopeSimple,
  Paperclip,
  Printer,
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
  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    const from = emailDetail.from?.[0]
    const to = emailDetail.to?.map(t => t.email).join(', ')
    const date = new Date(emailDetail.receivedAt).toLocaleString('de-DE')

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${emailDetail.subject || 'E-Mail'}</title>
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
          <div class="subject">${emailDetail.subject || '(Kein Betreff)'}</div>
          <div class="meta">
            <div><strong>Von:</strong> ${from?.name || ''} &lt;${from?.email || ''}&gt;</div>
            <div><strong>An:</strong> ${to}</div>
            <div><strong>Datum:</strong> ${date}</div>
          </div>
        </div>
        <div class="body">${getEmailBody(emailDetail)}</div>
      </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  return (
    <div className={`flex-1 min-w-0 flex flex-col ${!selectedEmail ? 'hidden lg:flex' : 'flex'}`}>
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
                  onClick={handlePrint}
                  className={`p-2 rounded-lg ${theme.bgHover}`}
                  title="Drucken"
                >
                  <Printer size={20} />
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

          <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-4">
            <div
              className={`prose prose-sm max-w-none ${theme.text} [&_*]:max-w-full [&_img]:max-w-full [&_img]:h-auto [&_table]:max-w-full [&_table]:w-full [&_table]:table-fixed [&_td]:break-words [&_th]:break-words [&_pre]:overflow-x-auto [&_pre]:max-w-full [&_div]:max-w-full [&_p]:max-w-full`}
              style={{ overflowWrap: 'anywhere', wordBreak: 'break-word', maxWidth: '100%' }}
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
