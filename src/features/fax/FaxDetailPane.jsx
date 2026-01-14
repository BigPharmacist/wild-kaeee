import {
  ArrowCounterClockwise,
  CaretLeft,
  Printer,
  Trash,
} from '@phosphor-icons/react'
import { supabaseUrl } from '../../lib/supabase'

const priorityColors = {
  ROT: 'bg-red-500 text-white',
  ORANGE: 'bg-orange-500 text-white',
  'GRÜN': 'bg-green-500 text-white',
  GRAU: 'bg-gray-400 text-white',
  BLAU: 'bg-blue-500 text-white',
}

function formatDateTime(dateString) {
  if (!dateString) return ''
  return new Date(dateString).toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getLocalPdfUrl(fax) {
  // Extrahiere den Pfad aus der externen storage_url und nutze lokale Supabase
  if (fax.storage_url) {
    const match = fax.storage_url.match(/\/storage\/v1\/object\/public\/(.+)$/)
    if (match) {
      return `${supabaseUrl}/storage/v1/object/public/${match[1]}`
    }
  }
  // Fallback auf storage_path
  if (fax.storage_path) {
    return `${supabaseUrl}/storage/v1/object/public/${fax.storage_path}`
  }
  return null
}

export default function FaxDetailPane({
  theme,
  selectedFax,
  selectedFolder,
  onBack,
  onDelete,
  onRestore,
}) {
  return (
    <div className={`flex-1 flex flex-col ${!selectedFax ? 'hidden lg:flex' : 'flex'}`}>
      {!selectedFax ? (
        <div className={`flex-1 flex items-center justify-center ${theme.textMuted}`}>
          <div className="text-center">
            <Printer size={64} className="mx-auto mb-4 opacity-30" />
            <p>Wähle ein Fax aus</p>
          </div>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className={`p-4 border-b ${theme.border}`}>
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={onBack}
                className={`lg:hidden p-1.5 rounded-lg ${theme.bgHover}`}
              >
                <CaretLeft size={20} />
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {selectedFax.prioritaet && (
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${priorityColors[selectedFax.prioritaet] || 'bg-gray-400 text-white'}`}>
                      {selectedFax.prioritaet}
                    </span>
                  )}
                  <h3 className="text-lg font-semibold truncate">
                    {selectedFax.absender || 'Unbekannter Absender'}
                  </h3>
                </div>
                {selectedFax.fax_nummer && (
                  <div className={`text-sm ${theme.textSecondary}`}>
                    Faxnummer: {selectedFax.fax_nummer}
                  </div>
                )}
                <div className={`text-xs ${theme.textMuted} mt-0.5`}>
                  Empfangen: {formatDateTime(selectedFax.fax_received_at)}
                </div>
              </div>

              <div className="flex items-center gap-1">
                {selectedFolder === 'eingang' ? (
                  <button
                    type="button"
                    onClick={() => onDelete(selectedFax.id)}
                    className={`p-2 rounded-lg ${theme.danger}`}
                    title="In Papierkorb verschieben"
                  >
                    <Trash size={20} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onRestore(selectedFax.id)}
                    className={`p-2 rounded-lg ${theme.bgHover}`}
                    title="Wiederherstellen"
                  >
                    <ArrowCounterClockwise size={20} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* PDF Viewer */}
            <div className="flex-1 min-h-0">
              {getLocalPdfUrl(selectedFax) ? (
                <iframe
                  src={getLocalPdfUrl(selectedFax)}
                  className="w-full h-full border-0"
                  title={`Fax von ${selectedFax.absender || 'Unbekannt'}`}
                />
              ) : (
                <div className={`flex-1 flex items-center justify-center ${theme.textMuted}`}>
                  <div className="text-center">
                    <Printer size={48} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Kein Dokument verfügbar</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
