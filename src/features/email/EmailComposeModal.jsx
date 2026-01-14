import { CircleNotch, PaperPlaneTilt, X } from '@phosphor-icons/react'

export default function EmailComposeModal({
  theme,
  show,
  composeMode,
  composeData,
  sendError,
  sending,
  onClose,
  onSend,
  setComposeData,
}) {
  if (!show) return null

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${theme.overlay}`}>
      <div className={`${theme.panel} rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col ${theme.cardShadow}`}>
        <div className={`flex items-center justify-between p-4 border-b ${theme.border}`}>
          <h3 className="font-semibold">
            {composeMode === 'reply' ? 'Antworten' : composeMode === 'forward' ? 'Weiterleiten' : 'Neue E-Mail'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-lg ${theme.bgHover}`}
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {sendError && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
              <p className="text-rose-500 text-sm">{sendError}</p>
            </div>
          )}

          <div>
            <label className={`block text-sm font-medium ${theme.textSecondary} mb-1`}>An</label>
            <input
              type="text"
              value={composeData.to}
              onChange={(event) => setComposeData(prev => ({ ...prev, to: event.target.value }))}
              placeholder="empfaenger@example.com"
              className={`w-full px-3 py-2 rounded-lg border ${theme.input} ${theme.text} text-sm`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-sm font-medium ${theme.textSecondary} mb-1`}>CC</label>
              <input
                type="text"
                value={composeData.cc}
                onChange={(event) => setComposeData(prev => ({ ...prev, cc: event.target.value }))}
                placeholder="Optional"
                className={`w-full px-3 py-2 rounded-lg border ${theme.input} ${theme.text} text-sm`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${theme.textSecondary} mb-1`}>BCC</label>
              <input
                type="text"
                value={composeData.bcc}
                onChange={(event) => setComposeData(prev => ({ ...prev, bcc: event.target.value }))}
                placeholder="Optional"
                className={`w-full px-3 py-2 rounded-lg border ${theme.input} ${theme.text} text-sm`}
              />
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium ${theme.textSecondary} mb-1`}>Betreff</label>
            <input
              type="text"
              value={composeData.subject}
              onChange={(event) => setComposeData(prev => ({ ...prev, subject: event.target.value }))}
              placeholder="Betreff"
              className={`w-full px-3 py-2 rounded-lg border ${theme.input} ${theme.text} text-sm`}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium ${theme.textSecondary} mb-1`}>Nachricht</label>
            <textarea
              value={composeData.body}
              onChange={(event) => setComposeData(prev => ({ ...prev, body: event.target.value }))}
              placeholder="Nachricht schreiben..."
              rows={12}
              className={`w-full px-3 py-2 rounded-lg border ${theme.input} ${theme.text} text-sm resize-none`}
            />
          </div>
        </div>

        <div className={`flex items-center justify-end gap-3 p-4 border-t ${theme.border}`}>
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2 rounded-lg border ${theme.border} ${theme.text} font-medium text-sm ${theme.bgHover}`}
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={onSend}
            disabled={sending || !composeData.to.trim()}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${theme.primaryBg} text-white font-medium text-sm ${theme.primaryHover} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {sending ? (
              <>
                <CircleNotch size={18} className="animate-spin" />
                Senden...
              </>
            ) : (
              <>
                <PaperPlaneTilt size={18} />
                Senden
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
