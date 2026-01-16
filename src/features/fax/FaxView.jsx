import { useEffect } from 'react'
import { ArrowClockwise, Tray, Trash } from '@phosphor-icons/react'
import FaxDetailPane from './FaxDetailPane'
import FaxListPane from './FaxListPane'
import useFax from './useFax'

export default function FaxView({ theme, pendingFaxId, onClearPendingFax }) {
  const {
    faxe,
    faxeLoading,
    refreshing,
    selectedFax,
    selectedFolder,
    counts,
    lastUpdated,
    selectFolder,
    selectFax,
    deleteFax,
    restoreFax,
    refresh,
  } = useFax()

  // Automatisch Fax auswählen wenn pendingFaxId gesetzt ist
  useEffect(() => {
    if (pendingFaxId && faxe.length > 0) {
      // Sicherstellen dass wir im Eingang sind (dringende Faxe sind immer dort)
      if (selectedFolder !== 'eingang') {
        selectFolder('eingang')
        return // Nach Ordnerwechsel wird faxe neu geladen
      }

      const fax = faxe.find(f => f.id === pendingFaxId)
      if (fax) {
        selectFax(fax)
        onClearPendingFax?.()
      }
    }
  }, [pendingFaxId, faxe, selectedFolder, selectFolder, selectFax, onClearPendingFax])

  // Zurück zur Liste (Mobile)
  const handleBackToList = () => {
    selectFax(null)
  }

  return (
    <>
      {/* Tabs als Überschrift */}
      <div className="flex items-center gap-4 mb-6">
        <button
          type="button"
          onClick={() => selectFolder('eingang')}
          className={`flex items-center gap-2 text-2xl lg:text-3xl font-semibold tracking-tight transition-colors ${
            selectedFolder === 'eingang'
              ? theme.text
              : `${theme.textMuted} hover:${theme.textSecondary}`
          }`}
        >
          <Tray size={28} weight={selectedFolder === 'eingang' ? 'fill' : 'regular'} />
          Faxeingang
          {counts.eingang > 0 && (
            <span className={`text-base font-medium ${theme.accentText}`}>({counts.eingang})</span>
          )}
        </button>
        <span className={theme.textMuted}>|</span>
        <button
          type="button"
          onClick={() => selectFolder('papierkorb')}
          className={`flex items-center gap-2 text-2xl lg:text-3xl font-semibold tracking-tight transition-colors ${
            selectedFolder === 'papierkorb'
              ? theme.text
              : `${theme.textMuted} hover:${theme.textSecondary}`
          }`}
        >
          <Trash size={28} weight={selectedFolder === 'papierkorb' ? 'fill' : 'regular'} />
          Papierkorb
          {counts.papierkorb > 0 && (
            <span className={`text-base font-medium ${theme.textMuted}`}>({counts.papierkorb})</span>
          )}
        </button>

        {/* Spacer + Refresh */}
        <div className="flex-1" />
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className={`text-xs ${theme.textMuted}`}>
              {lastUpdated.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            type="button"
            onClick={refresh}
            disabled={refreshing}
            className={`p-2 rounded-lg ${theme.bgHover} ${refreshing ? 'opacity-50' : ''}`}
            title="Aktualisieren"
          >
            <ArrowClockwise size={22} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Fax Panel */}
      <div className={`${theme.panel} rounded-2xl border ${theme.border} ${theme.cardShadow} overflow-hidden`}>
        <div className="flex h-[calc(100vh-180px)] min-h-[400px]">
          <FaxListPane
            theme={theme}
            faxe={faxe}
            faxeLoading={faxeLoading}
            selectedFax={selectedFax}
            selectedFolder={selectedFolder}
            onSelectFax={selectFax}
          />

          <FaxDetailPane
            theme={theme}
            selectedFax={selectedFax}
            selectedFolder={selectedFolder}
            onBack={handleBackToList}
            onDelete={deleteFax}
            onRestore={restoreFax}
          />
        </div>
      </div>
    </>
  )
}
