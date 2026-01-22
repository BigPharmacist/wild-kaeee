import { CircleNotch, Printer } from '@phosphor-icons/react'

// Hintergrundfarben für ROT, ORANGE, GRÜN und GRAU (ganze Zeile)
const rowBackgroundColors = {
  ROT: 'bg-[#FFF5EB]',
  ORANGE: 'bg-orange-100',
  'GRÜN': 'bg-green-100',
  GRAU: 'bg-gray-100',
}

// Badge-Farben nur für BLAU (GRAU wird nicht angezeigt)
const badgeColors = {
  BLAU: 'bg-blue-500 text-white',
}

function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  const datePart = date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
  const timePart = date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  return `${datePart} ${timePart}`
}

export default function FaxListPane({
  theme,
  faxe,
  faxeLoading,
  selectedFax,
  selectedFolder,
  onSelectFax,
}) {
  const folderLabel = selectedFolder === 'eingang' ? 'Faxeingang' : 'Papierkorb'

  return (
    <div className={`w-80 flex-shrink-0 border-r ${theme.border} flex flex-col ${selectedFax ? 'hidden lg:flex' : 'flex'}`}>
      <div className={`p-3 border-b ${theme.border} flex items-center justify-between`}>
        <h4 className="font-medium text-sm">{folderLabel}</h4>
        <span className={`text-xs ${theme.textMuted}`}>{faxe.length} Faxe</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {faxeLoading ? (
          <div className="flex items-center justify-center py-8">
            <CircleNotch size={24} className={`animate-spin ${theme.textMuted}`} />
          </div>
        ) : faxe.length === 0 ? (
          <div className={`text-center py-8 ${theme.textMuted}`}>
            <Printer size={40} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">Keine Faxe</p>
          </div>
        ) : (
          <>
            {faxe.map(fax => {
              const isHighlighted = fax.prioritaet === 'ROT' || fax.prioritaet === 'ORANGE' || fax.prioritaet === 'GRÜN' || fax.prioritaet === 'GRAU'
              const rowBg = rowBackgroundColors[fax.prioritaet] || ''
              const showBadge = fax.prioritaet && badgeColors[fax.prioritaet]

              return (
                <button
                  key={fax.id}
                  type="button"
                  onClick={() => onSelectFax(fax)}
                  className={`w-full text-left p-3 border-b ${theme.border} transition-colors ${
                    selectedFax?.id === fax.id
                      ? theme.navActive
                      : isHighlighted
                        ? `${rowBg} hover:brightness-95`
                        : theme.bgHover
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {showBadge && (
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${badgeColors[fax.prioritaet] || 'bg-gray-400 text-white'}`}>
                            {fax.prioritaet}
                          </span>
                        )}
                        <span className={`text-sm truncate font-medium ${isHighlighted ? 'text-gray-900' : theme.text}`}>
                          {fax.absender || 'Unbekannt'}
                        </span>
                      </div>
                      <p className={`text-xs mt-1 line-clamp-2 ${isHighlighted ? 'text-gray-600' : theme.textMuted}`}>
                        {fax.zusammenfassung || '(Keine Zusammenfassung)'}
                      </p>
                    </div>
                    <span className={`text-xs flex-shrink-0 ${isHighlighted ? 'text-gray-500' : theme.textMuted}`}>
                      {formatDate(fax.fax_received_at)}
                    </span>
                  </div>
                </button>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}
