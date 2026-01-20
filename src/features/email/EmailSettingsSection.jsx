import { EnvelopeSimple, GearSix, Sparkle } from '@phosphor-icons/react'
import { AI_MODELS } from './useEmailSettings'

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
  CloseIcon, // eslint-disable-line no-unused-vars -- used as component
  // KI-Assistent
  aiSettings,
  onAiSettingsChange,
  onSaveAiSettings,
  aiSettingsSaving,
  aiSettingsMessage,
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
                      ? 'border-[#FD8916] bg-[#FD8916]'
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
                          ? 'border-[#FD8916] bg-[#FD8916]'
                          : `${theme.border} hover:border-[#FD8916]`
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

      {/* KI-Assistent Einstellungen (nur für Admins sichtbar) */}
      {currentStaff?.is_admin && (
        <div className={`${theme.panel} rounded-2xl p-5 border ${theme.border} ${theme.cardShadow} border-violet-200 bg-gradient-to-br from-white to-violet-50`}>
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-violet-100">
              <Sparkle size={20} weight="fill" className="text-violet-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold">Kaeee-Assistent</h3>
              <p className={`text-xs ${theme.textMuted}`}>KI-gestützte E-Mail-Generierung mit Nebius AI.</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* API-Key */}
            <div>
              <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                Nebius API-Key
              </label>
              <input
                type="password"
                value={aiSettings?.api_key || ''}
                onChange={(e) => onAiSettingsChange({ ...aiSettings, api_key: e.target.value })}
                placeholder="Dein Nebius API-Key"
                className={`w-full px-3 py-2 ${theme.input} border rounded-xl outline-none ${theme.text} text-sm`}
              />
              <p className={`text-xs ${theme.textMuted} mt-1`}>
                Erstelle einen Key unter <a href="https://studio.nebius.ai" target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:underline">studio.nebius.ai</a>
              </p>
            </div>

            {/* Modellauswahl */}
            <div>
              <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                KI-Modell
              </label>
              <select
                value={aiSettings?.model || 'Qwen/Qwen2.5-72B-Instruct'}
                onChange={(e) => onAiSettingsChange({ ...aiSettings, model: e.target.value })}
                className={`w-full px-3 py-2 ${theme.input} border rounded-xl outline-none ${theme.text} text-sm`}
              >
                {AI_MODELS.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name} ({model.provider})
                  </option>
                ))}
              </select>
            </div>

            {/* System-Prompt */}
            <div>
              <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                System-Prompt
              </label>
              <textarea
                value={aiSettings?.system_prompt || ''}
                onChange={(e) => onAiSettingsChange({ ...aiSettings, system_prompt: e.target.value })}
                placeholder="Instruktionen für die KI..."
                rows={4}
                className={`w-full px-3 py-2 ${theme.input} border rounded-xl outline-none ${theme.text} text-sm resize-none`}
              />
              <p className={`text-xs ${theme.textMuted} mt-1`}>
                Dieser Prompt wird bei jeder E-Mail-Generierung als Kontext verwendet.
              </p>
            </div>

            {/* Speichern */}
            <div className="flex items-center justify-between pt-2">
              {aiSettingsMessage && (
                <p className={`text-sm ${aiSettingsMessage.includes('Fehler') ? 'text-rose-500' : 'text-emerald-600'}`}>
                  {aiSettingsMessage}
                </p>
              )}
              <button
                type="button"
                onClick={onSaveAiSettings}
                disabled={aiSettingsSaving}
                className="ml-auto px-4 py-2 rounded-xl bg-violet-500 text-white font-medium text-sm hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {aiSettingsSaving ? 'Speichern...' : 'Speichern'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
