import { useState, useRef } from 'react'
import {
  X,
  Upload,
  FileText,
  Check,
  Trash,
  PencilSimple,
  Plus,
  Warning,
} from '@phosphor-icons/react'

export function TourPdfImport({
  theme,
  isOpen,
  onClose,
  processing,
  progress,
  ocrError,
  parsedStops,
  parsedTourDate,
  parsedTourName,
  onProcessPdf,
  onUpdateParsedStop,
  onRemoveParsedStop,
  onAddEmptyStop,
  onImportStops,
  onClearOcr,
}) {
  const [dragOver, setDragOver] = useState(false)
  const [editingIndex, setEditingIndex] = useState(null)
  const [pdfFile, setPdfFile] = useState(null)
  const fileInputRef = useRef(null)

  if (!isOpen) return null

  const handleDrop = async (e) => {
    e.preventDefault()
    setDragOver(false)

    const files = e.dataTransfer?.files
    if (files && files.length > 0) {
      const file = files[0]
      if (file.type === 'application/pdf') {
        setPdfFile(file)
        await onProcessPdf(file)
      } else {
        alert('Bitte eine PDF-Datei auswählen')
      }
    }
  }

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setPdfFile(file)
      await onProcessPdf(file)
    }
  }

  const handleImport = () => {
    onImportStops(parsedStops, { tourDate: parsedTourDate, tourName: parsedTourName, pdfFile })
    setPdfFile(null)
    onClose()
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount || 0)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={`relative ${theme.surface} rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div>
            <h2 className={`text-lg font-semibold ${theme.textPrimary}`}>
              Tourenplan importieren
            </h2>
            <p className={`text-sm ${theme.textMuted}`}>
              PDF hochladen und Stops automatisch erkennen
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${theme.textSecondary} ${theme.bgHover}`}
          >
            <X size={20} className={theme.textMuted} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {/* Drop Zone (when no stops yet) */}
          {parsedStops.length === 0 && !processing && (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                dragOver
                  ? 'border-[#F59E0B] bg-amber-50'
                  : `${theme.border} hover:border-[#F59E0B]`
              }`}
            >
              <FileText size={48} className={`mx-auto ${theme.textMuted} mb-4`} />
              <p className={`font-medium ${theme.textPrimary} mb-2`}>
                PDF-Datei hierher ziehen
              </p>
              <p className={`text-sm ${theme.textMuted} mb-4`}>
                oder Datei auswählen
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${theme.accent} text-white`}
              >
                <Upload size={18} />
                PDF auswählen
              </button>
            </div>
          )}

          {/* Processing */}
          {processing && (
            <div className="text-center py-12">
              <div className="relative w-20 h-20 mx-auto mb-4">
                <svg className="w-20 h-20 transform -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    stroke="#E5E7EB"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    stroke="#F59E0B"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 36}`}
                    strokeDashoffset={`${2 * Math.PI * 36 * (1 - progress / 100)}`}
                    className="transition-all duration-300"
                  />
                </svg>
                <span className={`absolute inset-0 flex items-center justify-center font-semibold ${theme.textPrimary}`}>
                  {progress}%
                </span>
              </div>
              <p className={`font-medium ${theme.textPrimary}`}>
                Verarbeite PDF...
              </p>
              <p className={`text-sm ${theme.textMuted}`}>
                {progress < 20 && 'Lade PDF...'}
                {progress >= 20 && progress < 80 && 'Texterkennnung läuft...'}
                {progress >= 80 && progress < 100 && 'Analysiere Stops...'}
                {progress === 100 && 'Fertig!'}
              </p>
            </div>
          )}

          {/* Error */}
          {ocrError && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 mb-4">
              <div className="flex items-center gap-2">
                <Warning size={20} />
                <span className="font-medium">Fehler bei der Verarbeitung</span>
              </div>
              <p className="mt-1 text-sm">{ocrError}</p>
              <button
                onClick={onClearOcr}
                className="mt-2 text-sm underline"
              >
                Erneut versuchen
              </button>
            </div>
          )}

          {/* Parsed Stops */}
          {parsedStops.length > 0 && !processing && (
            <div className="space-y-4">
              {/* Erkanntes Datum und Name */}
              {(parsedTourDate || parsedTourName) && (
                <div className={`p-3 rounded-lg bg-amber-50 border border-amber-200`}>
                  <div className="flex items-center gap-4 text-sm">
                    {parsedTourDate && (
                      <div>
                        <span className="text-amber-700 font-medium">Tourdatum: </span>
                        <span className="text-amber-900 font-semibold">
                          {new Date(parsedTourDate).toLocaleDateString('de-DE', {
                            weekday: 'long',
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    )}
                    {parsedTourName && (
                      <div>
                        <span className="text-amber-700 font-medium">Tour: </span>
                        <span className="text-amber-900">{parsedTourName}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <p className={`font-medium ${theme.textPrimary}`}>
                  {parsedStops.length} Stops erkannt
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={onAddEmptyStop}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm ${theme.textSecondary} hover:bg-gray-100`}
                  >
                    <Plus size={16} />
                    Stop hinzufügen
                  </button>
                  <button
                    onClick={onClearOcr}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-red-600 hover:bg-red-100`}
                  >
                    <Trash size={16} />
                    Verwerfen
                  </button>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead className={`${theme.bg}`}>
                    <tr>
                      <th className={`px-2 py-1.5 text-left font-medium ${theme.textMuted}`}>#</th>
                      <th className={`px-2 py-1.5 text-left font-medium ${theme.textMuted}`}>Name</th>
                      <th className={`px-2 py-1.5 text-left font-medium ${theme.textMuted}`}>Adresse</th>
                      <th className={`px-2 py-1.5 text-center font-medium ${theme.textMuted}`}>Pkg</th>
                      <th className={`px-2 py-1.5 text-right font-medium ${theme.textMuted}`}>Betrag</th>
                      <th className={`px-2 py-1.5 text-center font-medium ${theme.textMuted}`}></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {parsedStops.map((stop, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className={`px-2 py-1 ${theme.textMuted}`}>{index + 1}</td>
                        <td className={`px-2 py-1 ${theme.textPrimary}`}>
                          {editingIndex === index ? (
                            <input
                              type="text"
                              value={stop.customer_name}
                              onChange={(e) => onUpdateParsedStop(index, { customer_name: e.target.value })}
                              className={`w-full px-1.5 py-0.5 rounded border text-xs ${theme.input}`}
                            />
                          ) : (
                            <span className="truncate max-w-[120px] inline-block">{stop.customer_name || <span className="text-red-500 italic">Fehlt</span>}</span>
                          )}
                        </td>
                        <td className={`px-2 py-1 ${theme.textSecondary}`}>
                          {editingIndex === index ? (
                            <div className="flex gap-1">
                              <input
                                type="text"
                                value={stop.street}
                                onChange={(e) => onUpdateParsedStop(index, { street: e.target.value })}
                                placeholder="Straße"
                                className={`w-28 px-1.5 py-0.5 rounded border text-xs ${theme.input}`}
                              />
                              <input
                                type="text"
                                value={stop.postal_code}
                                onChange={(e) => onUpdateParsedStop(index, { postal_code: e.target.value })}
                                placeholder="PLZ"
                                className={`w-14 px-1.5 py-0.5 rounded border text-xs ${theme.input}`}
                              />
                              <input
                                type="text"
                                value={stop.city}
                                onChange={(e) => onUpdateParsedStop(index, { city: e.target.value })}
                                placeholder="Ort"
                                className={`w-24 px-1.5 py-0.5 rounded border text-xs ${theme.input}`}
                              />
                            </div>
                          ) : (
                            <span className="truncate">
                              {stop.street || <span className="text-red-500 italic">Fehlt</span>}
                              {(stop.postal_code || stop.city) && <>, {stop.postal_code} {stop.city}</>}
                            </span>
                          )}
                        </td>
                        <td className={`px-2 py-1 text-center ${theme.textSecondary}`}>
                          {editingIndex === index ? (
                            <input
                              type="number"
                              value={stop.package_count}
                              onChange={(e) => onUpdateParsedStop(index, { package_count: parseInt(e.target.value) || 1 })}
                              className={`w-12 px-1 py-0.5 rounded border text-xs text-center ${theme.input}`}
                              min="1"
                            />
                          ) : (
                            stop.package_count || 1
                          )}
                        </td>
                        <td className={`px-2 py-1 text-right ${stop.cash_amount > 0 ? 'text-green-600 font-medium' : theme.textMuted}`}>
                          {editingIndex === index ? (
                            <input
                              type="number"
                              value={stop.cash_amount}
                              onChange={(e) => onUpdateParsedStop(index, { cash_amount: parseFloat(e.target.value) || 0 })}
                              className={`w-16 px-1 py-0.5 rounded border text-xs text-right ${theme.input}`}
                              step="0.01"
                            />
                          ) : (
                            formatCurrency(stop.cash_amount)
                          )}
                        </td>
                        <td className="px-1 py-1 text-center">
                          <div className="flex items-center justify-center gap-0.5">
                            <button
                              onClick={() => setEditingIndex(editingIndex === index ? null : index)}
                              className={`p-0.5 rounded ${editingIndex === index ? 'bg-green-100 text-green-600' : 'hover:bg-gray-100 text-gray-500'}`}
                              title={editingIndex === index ? 'Speichern' : 'Bearbeiten'}
                            >
                              {editingIndex === index ? <Check size={14} /> : <PencilSimple size={14} />}
                            </button>
                            <button
                              onClick={() => onRemoveParsedStop(index)}
                              className="p-0.5 rounded hover:bg-red-100 text-red-500"
                              title="Entfernen"
                            >
                              <Trash size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Notes preview */}
              {parsedStops.some(s => s.delivery_notes) && (
                <div className={`p-3 rounded-lg ${theme.bg}`}>
                  <p className={`text-xs font-medium ${theme.textMuted} mb-2`}>Erkannte Lieferhinweise:</p>
                  <div className="space-y-1">
                    {parsedStops.filter(s => s.delivery_notes).map((stop, index) => (
                      <p key={index} className={`text-xs ${theme.textSecondary}`}>
                        <span className="font-medium">{stop.customer_name}:</span> {stop.delivery_notes}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {parsedStops.length > 0 && !processing && (
          <div className="flex items-center justify-between p-4 border-t border-gray-100">
            <p className={`text-sm ${theme.textMuted}`}>
              {parsedStops.filter(s => !s.street).length > 0 && (
                <span className="text-amber-600">
                  {parsedStops.filter(s => !s.street).length} Stop(s) ohne Adresse
                </span>
              )}
            </p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className={`px-4 py-2 rounded-lg ${theme.textSecondary} hover:bg-gray-100`}
              >
                Abbrechen
              </button>
              <button
                onClick={handleImport}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${theme.accent} text-white`}
                disabled={parsedStops.length === 0 || parsedStops.every(s => !s.street)}
              >
                <Check size={18} />
                {parsedStops.length} Stops importieren
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
