import { EnvelopeSimple, GearSix } from '@phosphor-icons/react'

export default function EmailSettingsSection({
  theme,
  currentStaff,
  emailAccounts,
  selectedEmailAccount,
  onSelectEmailAccount,
  onOpenEmailAccountModal,
  onDeleteEmailAccount,
  staff,
  emailPermissions,
  onToggleEmailPermission,
  CloseIcon,
}) {
  return (
    <div className="space-y-4">
      {/* E-Mail-Konten (nur Admins können bearbeiten) */}
      <div className={`${theme.panel} rounded-2xl p-5 border ${theme.border} ${theme.cardShadow}`}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-semibold">E-Mail-Konten</h3>
            <p className={`text-xs ${theme.textMuted}`}>JMAP-Verbindung zu Stalwart Mail Server.</p>
          </div>
          {currentStaff?.is_admin && (
            <button
              type="button"
              onClick={() => onOpenEmailAccountModal()}
              className={`h-8 w-8 rounded-full flex items-center justify-center border ${theme.border} ${theme.bgHover} ${theme.text}`}
              title="E-Mail-Konto hinzufügen"
            >
              +
            </button>
          )}
        </div>

        {emailAccounts.length === 0 ? (
          <div className={`text-center py-8 ${theme.textMuted}`}>
            <EnvelopeSimple size={48} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">Noch kein E-Mail-Konto eingerichtet.</p>
            {currentStaff?.is_admin && (
              <p className="text-xs mt-1">Klicke auf + um ein Konto hinzuzufügen.</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {emailAccounts.map((account) => (
              <div
                key={account.id}
                className={`flex items-center gap-3 p-3 rounded-xl border ${theme.border} ${
                  selectedEmailAccount === account.id ? theme.navActive : ''
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelectEmailAccount(account.id)}
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedEmailAccount === account.id
                      ? 'border-[#4A90E2] bg-[#4A90E2]'
                      : `${theme.border}`
                  }`}
                  title="Als Standard auswählen"
                >
                  {selectedEmailAccount === account.id && (
                    <span className="w-2 h-2 rounded-full bg-white" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{account.name}</p>
                  <p className={`text-xs ${theme.textMuted} truncate`}>{account.email}</p>
                </div>
                {currentStaff?.is_admin && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onOpenEmailAccountModal(account)}
                      className={`p-1.5 rounded-lg ${theme.bgHover}`}
                      title="Bearbeiten"
                    >
                      <GearSix size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteEmailAccount(account.id)}
                      className={`p-1.5 rounded-lg ${theme.danger}`}
                      title="Löschen"
                    >
                      <CloseIcon />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* E-Mail-Berechtigungen (nur für Admins sichtbar) */}
      {currentStaff?.is_admin && (
        <div className={`${theme.panel} rounded-2xl p-5 border ${theme.border} ${theme.cardShadow}`}>
          <div className="mb-3">
            <h3 className="text-base font-semibold">E-Mail-Berechtigungen</h3>
            <p className={`text-xs ${theme.textMuted}`}>Lege fest, welche Mitarbeiter E-Mails sehen dürfen.</p>
          </div>

          {staff.filter(s => s.auth_user_id).length === 0 ? (
            <div className={`text-center py-6 ${theme.textMuted}`}>
              <p className="text-sm">Keine Mitarbeiter mit Benutzerkonten gefunden.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {staff.filter(s => s.auth_user_id).map((member) => {
                const permission = emailPermissions.find(p => p.user_id === member.auth_user_id)
                const hasAccess = permission?.has_access || false
                return (
                  <div
                    key={member.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border ${theme.border}`}
                  >
                    <button
                      type="button"
                      onClick={() => onToggleEmailPermission(member.auth_user_id, hasAccess)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        hasAccess
                          ? 'border-[#4A90E2] bg-[#4A90E2]'
                          : `${theme.border} hover:border-[#4A90E2]`
                      }`}
                      title={hasAccess ? 'Zugriff entziehen' : 'Zugriff gewähren'}
                    >
                      {hasAccess && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {member.first_name} {member.last_name}
                        {member.is_admin && (
                          <span className={`ml-2 text-xs ${theme.textMuted}`}>(Admin)</span>
                        )}
                      </p>
                      <p className={`text-xs ${theme.textMuted} truncate`}>{member.email}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
