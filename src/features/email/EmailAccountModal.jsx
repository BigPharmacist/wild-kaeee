export default function EmailAccountModal({
  theme,
  editingEmailAccount,
  emailAccountForm,
  emailAccountMessage,
  emailAccountSaving,
  onClose,
  onSave,
  setEmailAccountForm,
  CloseIcon,
}) {
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
