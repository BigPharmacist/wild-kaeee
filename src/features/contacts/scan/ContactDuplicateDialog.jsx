export default function ContactDuplicateDialog({
  theme,
  duplicateDialogOpen,
  duplicateCheckResult,
  onClose,
  onDuplicateUpdate,
  onNewRepresentative,
  onCreateNewContact,
}) {
  if (!duplicateDialogOpen || !duplicateCheckResult) return null

  return (
    <div
      className={`fixed inset-0 z-50 ${theme.overlay} flex items-center justify-center p-4`}
      onClick={onClose}
    >
      <div
        className={`${theme.panel} rounded-2xl border ${theme.border} ${theme.cardShadow} w-full max-w-lg max-h-[90vh] overflow-y-auto`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={`px-5 py-4 border-b ${theme.border}`}>
          <h3 className="text-base font-semibold">Mögliche Duplikate gefunden</h3>
          <p className={`text-xs ${theme.textMuted} mt-1`}>
            Erkannt: {duplicateCheckResult.ocrData.firstName} {duplicateCheckResult.ocrData.lastName}
            {duplicateCheckResult.ocrData.company && ` bei ${duplicateCheckResult.ocrData.company}`}
          </p>
        </div>

        <div className="p-5 space-y-4">
          {duplicateCheckResult.checks.map((check, idx) => (
            <div key={idx} className={`p-4 rounded-xl border ${theme.border} space-y-3`}>
              <div className={`text-xs font-medium ${theme.textSecondary}`}>
                {check.type === 'email' && `Gleiche E-Mail: ${check.field}`}
                {check.type === 'phone' && `Gleiche Telefonnummer: ${check.field}`}
                {check.type === 'company' && `Bereits Kontakt bei: ${check.field}`}
              </div>

              {check.matches.map((match) => (
                <div key={match.id} className={`p-3 rounded-lg ${theme.bg} space-y-2`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-medium ${theme.text}`}>
                        {match.first_name} {match.last_name}
                      </p>
                      <p className={`text-xs ${theme.textMuted}`}>
                        {match.position}{match.position && match.company && ' bei '}{match.company}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {check.type !== 'company' && (
                      <button
                        type="button"
                        onClick={() => onDuplicateUpdate(match)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium ${theme.accent} text-white`}
                      >
                        Aktualisieren
                      </button>
                    )}
                    {check.type === 'company' && (
                      <button
                        type="button"
                        onClick={() => onNewRepresentative(match)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500 hover:bg-red-400 text-white`}
                      >
                        Neuer Vertreter (ersetzt {match.first_name})
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}

          <div className={`pt-4 border-t ${theme.border} flex flex-wrap gap-2 justify-end`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-lg text-sm font-medium border ${theme.border} ${theme.bgHover}`}
            >
              Abbrechen
            </button>
            <button
              type="button"
              onClick={onCreateNewContact}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${theme.accent} text-white`}
            >
              Trotzdem neu anlegen
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
