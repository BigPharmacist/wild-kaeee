/**
 * Modal for creating/editing staff members
 * Extracted from App.jsx
 */
function StaffModal({
  theme,
  Icons,
  editingStaff,
  staffForm,
  staffSaveLoading,
  staffSaveMessage,
  staffInviteLoading,
  staffInviteMessage,
  staffAvatarPreview,
  staffAvatarFile,
  currentStaff,
  pharmacies,
  session,
  onClose,
  onSubmit,
  onStaffInput,
  onAvatarChange,
  onLinkCurrentUser,
  onSendInvite,
}) {
  if (!editingStaff) return null

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
              {editingStaff.id ? 'Kollegium bearbeiten' : 'Kollegium hinzufügen'}
            </h3>
            <p className={`text-xs ${theme.textMuted}`}>
              {editingStaff.id ? 'Änderungen werden sofort gespeichert.' : 'Neue Person anlegen.'}
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
            <div>
              <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                Vorname
              </label>
              <input
                value={staffForm.firstName}
                onChange={(e) => onStaffInput('firstName', e.target.value)}
                className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                required
              />
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                Nachname
              </label>
              <input
                value={staffForm.lastName}
                onChange={(e) => onStaffInput('lastName', e.target.value)}
                className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                required
              />
            </div>

            <div>
              <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                Straße
              </label>
              <input
                value={staffForm.street}
                onChange={(e) => onStaffInput('street', e.target.value)}
                className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
              />
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                PLZ
              </label>
              <input
                value={staffForm.postalCode}
                onChange={(e) => onStaffInput('postalCode', e.target.value)}
                className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
              />
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                Ort
              </label>
              <input
                value={staffForm.city}
                onChange={(e) => onStaffInput('city', e.target.value)}
                className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
              />
            </div>

            <div>
              <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                Mobil
              </label>
              <input
                value={staffForm.mobile}
                onChange={(e) => onStaffInput('mobile', e.target.value)}
                className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                E-Mail
              </label>
              <div className="flex gap-2">
                <input
                  value={staffForm.email}
                  onChange={(e) => onStaffInput('email', e.target.value)}
                  className={`flex-1 px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                  type="email"
                />
                {currentStaff?.is_admin && !staffForm.authUserId && (
                  <button
                    type="button"
                    onClick={onSendInvite}
                    disabled={staffInviteLoading || !staffForm.email.trim()}
                    className={`px-3 py-2 rounded-xl text-xs font-medium ${theme.accent} text-white disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap`}
                    title="Einladung senden"
                  >
                    {staffInviteLoading ? 'Sende...' : 'Einladen'}
                  </button>
                )}
              </div>
              {staffInviteMessage && (
                <p className={`text-xs mt-1 ${staffInviteMessage.includes('gesendet') ? 'text-emerald-600' : 'text-rose-400'}`}>
                  {staffInviteMessage}
                </p>
              )}
            </div>

            <div>
              <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                Beruf
              </label>
              <select
                value={staffForm.role}
                onChange={(e) => onStaffInput('role', e.target.value)}
                className={`w-full px-3 py-2 ${theme.input} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                required
              >
                <option value="">Bitte wählen</option>
                <option value="ApothekerIn">ApothekerIn</option>
                <option value="PTA">PTA</option>
                <option value="PKA">PKA</option>
                <option value="FahrerIn">FahrerIn</option>
                <option value="Sonst.">Sonst.</option>
              </select>
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                Apotheke
              </label>
              <select
                value={staffForm.pharmacyId}
                onChange={(e) => onStaffInput('pharmacyId', e.target.value)}
                className={`w-full px-3 py-2 ${theme.input} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                required
              >
                <option value="">Bitte wählen</option>
                {pharmacies.map((pharmacy) => (
                  <option key={pharmacy.id} value={pharmacy.id}>
                    {pharmacy.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                Angestellt seit
              </label>
              <input
                type="date"
                value={staffForm.employedSince}
                onChange={(e) => onStaffInput('employedSince', e.target.value)}
                className={`w-full px-3 py-2 ${theme.input} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
              />
            </div>
            {currentStaff?.is_admin && (
              <div>
                <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                  Ausscheidedatum
                </label>
                <input
                  type="date"
                  value={staffForm.exitDate}
                  onChange={(e) => onStaffInput('exitDate', e.target.value)}
                  className={`w-full px-3 py-2 ${theme.input} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                />
              </div>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                Avatar
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={onAvatarChange}
                className={`w-full text-xs ${theme.textMuted}`}
              />
            </div>
            <div className="flex items-end gap-3">
              {staffAvatarPreview ? (
                <img
                  src={staffAvatarPreview}
                  alt="Avatar Vorschau"
                  className={`h-12 w-12 rounded-full object-cover border ${theme.border}`}
                />
              ) : (
                <div className={`h-12 w-12 rounded-full border ${theme.border} flex items-center justify-center text-xs ${theme.textMuted}`}>
                  --
                </div>
              )}
              {staffForm.avatarUrl && !staffAvatarFile && (
                <span className={`text-xs ${theme.textMuted}`}>Aktuell gesetzt</span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={onLinkCurrentUser}
              className={`text-xs font-medium ${theme.accentText} hover:opacity-80`}
              title="Mit aktuellem Login verknüpfen"
              disabled={!session?.user?.id}
            >
              {staffForm.authUserId ? 'Login verknüpft' : 'Mit aktuellem Login verknüpfen'}
            </button>
            <label className={`flex items-center gap-2 text-xs ${theme.textMuted}`}>
              <input
                type="checkbox"
                checked={staffForm.isAdmin}
                onChange={(e) => onStaffInput('isAdmin', e.target.checked)}
                className="accent-[#F59E0B]"
              />
              Admin
            </label>
          </div>

          {staffSaveMessage && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
              <p className="text-rose-400 text-sm">{staffSaveMessage}</p>
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
              disabled={staffSaveLoading}
              className={`px-4 py-2 rounded-xl text-sm font-medium ${theme.accent} text-white disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {staffSaveLoading ? 'Speichert...' : 'Speichern'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default StaffModal
