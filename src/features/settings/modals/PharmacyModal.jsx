/**
 * Modal for creating/editing pharmacies
 * Extracted from App.jsx
 */
function PharmacyModal({
  theme,
  Icons,
  editingPharmacy,
  editForm,
  editLoading,
  editMessage,
  onClose,
  onSubmit,
  onEditInput,
}) {
  if (!editingPharmacy) return null

  return (
    <div
      className={`fixed inset-0 z-50 ${theme.overlay} flex items-center justify-center p-4`}
      onClick={onClose}
    >
      <div
        className={`${theme.panel} rounded-2xl border ${theme.border} ${theme.cardShadow} w-full max-w-xl`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={`flex items-center justify-between px-5 py-4 border-b ${theme.border}`}>
          <div>
            <h3 className="text-base font-semibold">
              {editingPharmacy.id ? 'Apotheke bearbeiten' : 'Apotheke hinzufügen'}
            </h3>
            <p className={`text-xs ${theme.textMuted}`}>
              {editingPharmacy.id ? 'Änderungen werden sofort gespeichert.' : 'Neue Apotheke anlegen.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-lg ${theme.bgHover} ${theme.textMuted}`}
            title="Popup schließen"
          >
            <Icons.X />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-5 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                Name
              </label>
              <input
                value={editForm.name}
                onChange={(e) => onEditInput('name', e.target.value)}
                className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                required
              />
            </div>

            <div>
              <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                Straße
              </label>
              <input
                value={editForm.street}
                onChange={(e) => onEditInput('street', e.target.value)}
                className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
              />
            </div>

            <div>
              <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                PLZ
              </label>
              <input
                value={editForm.postalCode}
                onChange={(e) => onEditInput('postalCode', e.target.value)}
                className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
              />
            </div>

            <div>
              <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                Ort
              </label>
              <input
                value={editForm.city}
                onChange={(e) => onEditInput('city', e.target.value)}
                className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
              />
            </div>

            <div>
              <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                Telefonnummer
              </label>
              <input
                value={editForm.phone}
                onChange={(e) => onEditInput('phone', e.target.value)}
                className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
              />
            </div>

            <div>
              <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                Inhaber / Filialleiter
              </label>
              <div className="grid gap-2 sm:grid-cols-2">
                <select
                  value={editForm.ownerRole}
                  onChange={(e) => onEditInput('ownerRole', e.target.value)}
                  className={`w-full px-3 py-2 ${theme.input} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                  required
                >
                  <option value="">Bitte wählen</option>
                  <option value="owner">Inhaber</option>
                  <option value="manager">Filialleiter</option>
                </select>
                <input
                  value={editForm.owner}
                  onChange={(e) => onEditInput('owner', e.target.value)}
                  className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                />
              </div>
            </div>

            <div>
              <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                Webseite
              </label>
              <input
                value={editForm.website}
                onChange={(e) => onEditInput('website', e.target.value)}
                className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
              />
            </div>

            <div>
              <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                E-Mail
              </label>
              <input
                value={editForm.email}
                onChange={(e) => onEditInput('email', e.target.value)}
                className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                type="email"
              />
            </div>

            <div>
              <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                Fax
              </label>
              <input
                value={editForm.fax}
                onChange={(e) => onEditInput('fax', e.target.value)}
                className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
              />
            </div>

            <div>
              <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                Umsatzsteuer-ID
              </label>
              <input
                value={editForm.vatId}
                onChange={(e) => onEditInput('vatId', e.target.value)}
                className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
              />
            </div>

            <div>
              <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                Handelsregistereintrag
              </label>
              <input
                value={editForm.tradeRegister}
                onChange={(e) => onEditInput('tradeRegister', e.target.value)}
                className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
              />
            </div>

            <div>
              <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                Amtsgericht
              </label>
              <input
                value={editForm.registryCourt}
                onChange={(e) => onEditInput('registryCourt', e.target.value)}
                className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
              />
            </div>

            <div>
              <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                BGA/IDF-Nummer
              </label>
              <input
                value={editForm.bgaIdfNumber}
                onChange={(e) => onEditInput('bgaIdfNumber', e.target.value)}
                className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
              />
            </div>
          </div>

          {editMessage && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
              <p className="text-rose-400 text-sm">{editMessage}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-sm font-medium border ${theme.border} ${theme.bgHover}`}
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={editLoading}
              className={`px-4 py-2 rounded-xl text-sm font-medium ${theme.accent} text-white disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {editLoading ? 'Speichert...' : 'Speichern'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PharmacyModal
