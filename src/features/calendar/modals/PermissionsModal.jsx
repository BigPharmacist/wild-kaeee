/**
 * Modal for managing calendar permissions (Admin only)
 * Extracted from App.jsx
 */
function PermissionsModal({
  theme,
  Icons,
  permissionsModalOpen,
  setPermissionsModalOpen,
  calendarPermissions,
  permissionsLoading,
  staff,
  selectedCalendarId,
  onAddPermission,
  onRemovePermission,
}) {
  if (!permissionsModalOpen) return null

  return (
    <div className={`fixed inset-0 ${theme.overlay} flex items-center justify-center z-50 p-4`}>
      <div className={`${theme.panel} rounded-2xl p-6 border ${theme.border} ${theme.cardShadow} w-full max-w-lg max-h-[80vh] overflow-auto`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-xl font-semibold ${theme.text}`}>Berechtigungen verwalten</h3>
          <button
            type="button"
            onClick={() => setPermissionsModalOpen(false)}
            className={`p-2 rounded-lg ${theme.bgHover} ${theme.textMuted}`}
          >
            <Icons.X />
          </button>
        </div>

        <div className={`p-4 rounded-xl border ${theme.border} mb-6`}>
          <h4 className={`text-sm font-medium mb-3 ${theme.textSecondary}`}>Berechtigung hinzufügen</h4>
          <div className="flex gap-2">
            <select id="newPermUser" className={`flex-1 px-3 py-2 rounded-lg border ${theme.input} text-sm ${theme.text}`}>
              <option value="">Mitarbeiter wählen...</option>
              {staff
                .filter((s) => s.auth_user_id && !calendarPermissions.some((p) => p.user_id === s.auth_user_id))
                .map((s) => (
                  <option key={s.id} value={s.auth_user_id}>
                    {s.first_name} {s.last_name}
                  </option>
                ))}
            </select>
            <select id="newPermLevel" className={`px-3 py-2 rounded-lg border ${theme.input} text-sm ${theme.text}`}>
              <option value="read">Lesen</option>
              <option value="write">Schreiben</option>
            </select>
            <button
              type="button"
              onClick={() => {
                const userId = document.getElementById('newPermUser').value
                const perm = document.getElementById('newPermLevel').value
                if (userId) onAddPermission(selectedCalendarId, userId, perm)
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${theme.accent} text-white`}
            >
              +
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {permissionsLoading ? (
            <p className={theme.textMuted}>Laden...</p>
          ) : calendarPermissions.length === 0 ? (
            <p className={theme.textMuted}>Keine Berechtigungen vergeben.</p>
          ) : (
            calendarPermissions.map((perm) => (
              <div key={perm.id} className={`flex items-center justify-between p-3 rounded-xl border ${theme.border}`}>
                <div>
                  <p className={`font-medium ${theme.text}`}>
                    {perm.staffMember?.first_name} {perm.staffMember?.last_name}
                  </p>
                  <p className={`text-xs ${theme.textMuted}`}>{perm.staffMember?.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={perm.permission}
                    onChange={(e) => onAddPermission(selectedCalendarId, perm.user_id, e.target.value)}
                    className={`px-2 py-1 rounded-lg border ${theme.input} text-xs ${theme.text}`}
                  >
                    <option value="read">Lesen</option>
                    <option value="write">Schreiben</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => onRemovePermission(perm.id, selectedCalendarId)}
                    className={`p-1.5 rounded-lg ${theme.danger}`}
                    title="Berechtigung entfernen"
                  >
                    <Icons.X />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default PermissionsModal
