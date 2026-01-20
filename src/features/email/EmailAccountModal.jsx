import { useRef, useEffect } from 'react'
import { Link, ListBullets, ListNumbers, Quotes, TextB, TextItalic, TextUnderline } from '@phosphor-icons/react'

export default function EmailAccountModal({
  theme,
  editingEmailAccount,
  emailAccountForm,
  emailAccountMessage,
  emailAccountSaving,
  onClose,
  onSave,
  setEmailAccountForm,
  CloseIcon, // eslint-disable-line no-unused-vars -- used as component
}) {
  const signatureRef = useRef(null)

  // Editor-Inhalt synchronisieren wenn Modal geöffnet wird
  useEffect(() => {
    if (signatureRef.current && editingEmailAccount) {
      if (signatureRef.current.innerHTML !== (emailAccountForm.signature || '')) {
        signatureRef.current.innerHTML = emailAccountForm.signature || ''
      }
    }
  }, [emailAccountForm.signature, editingEmailAccount])

  // Formatierung mit execCommand anwenden
  const applyFormat = (command, value = null) => {
    signatureRef.current?.focus()
    document.execCommand(command, false, value)
    if (signatureRef.current) {
      setEmailAccountForm(prev => ({ ...prev, signature: signatureRef.current.innerHTML }))
    }
  }

  const insertLink = () => {
    const url = window.prompt('URL eingeben:', 'https://')
    if (url) {
      applyFormat('createLink', url)
    }
  }

  const handleInput = () => {
    if (signatureRef.current) {
      setEmailAccountForm(prev => ({ ...prev, signature: signatureRef.current.innerHTML }))
    }
  }

  if (!editingEmailAccount) return null

  return (
    <div
      className={`fixed inset-0 z-50 ${theme.overlay} flex items-center justify-center p-4`}
      onClick={onClose}
    >
      <div
        className={`${theme.panel} rounded-2xl border ${theme.border} ${theme.cardShadow} w-full max-w-md`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={`flex items-center justify-between px-5 py-4 border-b ${theme.border}`}>
          <div>
            <h3 className="text-base font-semibold">
              {editingEmailAccount === 'new' ? 'E-Mail-Konto hinzufügen' : 'E-Mail-Konto bearbeiten'}
            </h3>
            <p className={`text-xs ${theme.textMuted}`}>JMAP-Zugangsdaten eingeben.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-lg ${theme.bgHover} ${theme.textMuted}`}
            title="Popup schließen"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {emailAccountMessage && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
              <p className="text-rose-500 text-sm">{emailAccountMessage}</p>
            </div>
          )}

          <div>
            <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
              Anzeigename (optional)
            </label>
            <input
              value={emailAccountForm.name}
              onChange={(event) => setEmailAccountForm(prev => ({ ...prev, name: event.target.value }))}
              placeholder="z.B. Arbeit, Privat"
              className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
            />
          </div>

          <div>
            <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
              E-Mail-Adresse *
            </label>
            <input
              type="email"
              value={emailAccountForm.email}
              onChange={(event) => setEmailAccountForm(prev => ({ ...prev, email: event.target.value }))}
              placeholder="user@example.com"
              className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
              required
            />
          </div>

          <div>
            <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
              Passwort *
            </label>
            <input
              type="password"
              value={emailAccountForm.password}
              onChange={(event) => setEmailAccountForm(prev => ({ ...prev, password: event.target.value }))}
              placeholder="Passwort"
              className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
              required
            />
          </div>

          <div>
            <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
              Signatur (optional)
            </label>
            <p className={`text-xs ${theme.textMuted} mb-2`}>
              Wird automatisch an neue E-Mails angehängt.
            </p>

            {/* Formatierungs-Toolbar */}
            <div className={`flex items-center gap-1 p-2 border border-b-0 ${theme.border} rounded-t-xl ${theme.bg}`}>
              <button
                type="button"
                onClick={() => applyFormat('bold')}
                className={`p-1.5 rounded ${theme.bgHover}`}
                title="Fett (Strg+B)"
              >
                <TextB size={16} weight="bold" />
              </button>
              <button
                type="button"
                onClick={() => applyFormat('italic')}
                className={`p-1.5 rounded ${theme.bgHover}`}
                title="Kursiv (Strg+I)"
              >
                <TextItalic size={16} />
              </button>
              <button
                type="button"
                onClick={() => applyFormat('underline')}
                className={`p-1.5 rounded ${theme.bgHover}`}
                title="Unterstrichen (Strg+U)"
              >
                <TextUnderline size={16} />
              </button>

              <div className={`w-px h-4 mx-1 ${theme.border} bg-current opacity-20`} />

              <button
                type="button"
                onClick={() => applyFormat('insertUnorderedList')}
                className={`p-1.5 rounded ${theme.bgHover}`}
                title="Aufzählungsliste"
              >
                <ListBullets size={16} />
              </button>
              <button
                type="button"
                onClick={() => applyFormat('insertOrderedList')}
                className={`p-1.5 rounded ${theme.bgHover}`}
                title="Nummerierte Liste"
              >
                <ListNumbers size={16} />
              </button>

              <div className={`w-px h-4 mx-1 ${theme.border} bg-current opacity-20`} />

              <button
                type="button"
                onClick={insertLink}
                className={`p-1.5 rounded ${theme.bgHover}`}
                title="Link einfügen"
              >
                <Link size={16} />
              </button>
              <button
                type="button"
                onClick={() => applyFormat('formatBlock', 'blockquote')}
                className={`p-1.5 rounded ${theme.bgHover}`}
                title="Zitat"
              >
                <Quotes size={16} />
              </button>
            </div>

            <div
              ref={signatureRef}
              contentEditable
              onInput={handleInput}
              className={`w-full px-3 py-2 border rounded-b-xl rounded-t-none ${theme.input} ${theme.text} text-sm min-h-[100px] max-h-[150px] overflow-y-auto focus:outline-none focus:ring-1 focus:ring-[#F59E0B] [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-gray-600 [&_a]:text-blue-500 [&_a]:underline`}
              data-placeholder="z.B. Mit freundlichen Grüßen..."
              style={{ whiteSpace: 'pre-wrap' }}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl border ${theme.border} ${theme.text} font-medium text-sm ${theme.bgHover}`}
            >
              Abbrechen
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={emailAccountSaving || !emailAccountForm.email || !emailAccountForm.password}
              className={`px-4 py-2 rounded-xl ${theme.accent} text-white font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {emailAccountSaving ? 'Prüfe...' : 'Speichern'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
