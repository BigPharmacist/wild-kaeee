import { useState, useRef, useCallback, useEffect } from 'react'
import {
  ArrowCounterClockwise,
  ArrowsOutSimple,
  ArrowUUpLeft,
  ArrowUUpRight,
  CalendarCheck,
  CaretLeft,
  DownloadSimple,
  MagnifyingGlassMinus,
  MagnifyingGlassPlus,
  Printer,
  Trash,
  User,
  Buildings,
  Clock,
  Calendar,
  Tag,
  SpinnerGap,
} from '@phosphor-icons/react'
import { supabaseUrl } from '../../lib/supabase'
import useBesuchstermine from './useBesuchstermine'

const priorityColors = {
  ROT: 'bg-[#FF6500] text-white',
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
  let url = null
  if (fax.storage_url) {
    const match = fax.storage_url.match(/\/storage\/v1\/object\/public\/(.+)$/)
    if (match) {
      url = `${supabaseUrl}/storage/v1/object/public/${match[1]}`
    }
  }
  // Fallback auf storage_path
  if (!url && fax.storage_path) {
    url = `${supabaseUrl}/storage/v1/object/public/${fax.storage_path}`
  }
  // Chrome PDF-Viewer Parameter: Toolbar und Sidebar ausblenden
  if (url) {
    return `${url}#toolbar=0&navpanes=0`
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
  const [zoom, setZoom] = useState(0.75)
  const [rotation, setRotation] = useState(0)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const containerRef = useRef(null)

  // Besuchstermine Hook
  const {
    loading: terminLoading,
    createTerminFromBesuch,
    getTerminForFax,
  } = useBesuchstermine()

  const [linkedTermin, setLinkedTermin] = useState(null)
  const [terminCreating, setTerminCreating] = useState(false)

  // Hat das Fax Besuchsdaten?
  const hasBesuchsdaten = selectedFax?.besuche && selectedFax.besuche.length > 0
  const besuch = hasBesuchsdaten ? selectedFax.besuche[0] : null

  // Automatisch Termin laden oder erstellen wenn Fax mit Besuchsdaten angezeigt wird
  useEffect(() => {
    const loadOrCreateTermin = async () => {
      if (!selectedFax?.id) {
        setLinkedTermin(null)
        return
      }

      // Prüfen ob bereits ein Termin existiert
      const existingTermin = await getTerminForFax(selectedFax.id)

      if (existingTermin) {
        setLinkedTermin(existingTermin)
        return
      }

      // Wenn Besuchsdaten vorhanden, automatisch Termin erstellen
      if (hasBesuchsdaten) {
        setTerminCreating(true)
        const result = await createTerminFromBesuch(selectedFax)
        if (result.success && result.termin) {
          setLinkedTermin(result.termin)
        }
        setTerminCreating(false)
      }
    }

    loadOrCreateTermin()
  }, [selectedFax?.id, selectedFax?.besuche, hasBesuchsdaten, getTerminForFax, createTerminFromBesuch])

  const handleZoomIn = () => setZoom(z => Math.min(z + 0.25, 3))
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.25, 0.5))
  const handleRotateLeft = () => setRotation(r => (r - 90) % 360)
  const handleRotateRight = () => setRotation(r => (r + 90) % 360)
  const handleReset = () => {
    setZoom(0.75)
    setRotation(0)
    setPosition({ x: 0, y: 0 })
  }

  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return // Nur linke Maustaste
    setIsDragging(true)
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
  }, [position])

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    })
  }, [isDragging, dragStart])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleWheel = useCallback((e) => {
    if (e.ctrlKey) {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.1 : 0.1
      setZoom(z => Math.min(Math.max(z + delta, 0.5), 3))
    }
  }, [])

  // Zoom/Rotation/Position zurücksetzen bei Fax-Wechsel
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setZoom(0.75)
     
    setRotation(0)
     
    setPosition({ x: 0, y: 0 })
  }, [selectedFax?.id])

  const handleDownload = () => {
    const pdfUrl = getLocalPdfUrl(selectedFax)
    if (!pdfUrl) return

    const link = document.createElement('a')
    link.href = pdfUrl
    link.download = `Fax_${selectedFax.absender || 'Unbekannt'}_${new Date(selectedFax.fax_received_at).toISOString().split('T')[0]}.pdf`
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handlePrint = () => {
    const pdfUrl = getLocalPdfUrl(selectedFax)
    if (!pdfUrl) return

    const printWindow = window.open(pdfUrl, '_blank')
    if (printWindow) {
      printWindow.addEventListener('load', () => {
        printWindow.print()
      })
    }
  }

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
                className={`lg:hidden p-1.5 rounded-lg ${theme.textSecondary} ${theme.bgHover}`}
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
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handleDownload}
                      className={`p-1.5 rounded-lg ${theme.textSecondary} ${theme.bgHover}`}
                      title="PDF herunterladen"
                    >
                      <DownloadSimple size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={handlePrint}
                      className={`p-1.5 rounded-lg ${theme.textSecondary} ${theme.bgHover}`}
                      title="Drucken"
                    >
                      <Printer size={18} />
                    </button>
                    {selectedFolder === 'eingang' ? (
                      <button
                        type="button"
                        onClick={() => onDelete(selectedFax.id)}
                        className={`p-1.5 rounded-lg ${theme.danger}`}
                        title="In Papierkorb verschieben"
                      >
                        <Trash size={18} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onRestore(selectedFax.id)}
                        className={`p-1.5 rounded-lg ${theme.textSecondary} ${theme.bgHover}`}
                        title="Wiederherstellen"
                      >
                        <ArrowCounterClockwise size={18} />
                      </button>
                    )}
                  </div>
                  <div className={`text-xs ${theme.textMuted}`}>
                    {selectedFax.fax_nummer && (
                      <span>Faxnummer: {selectedFax.fax_nummer} · </span>
                    )}
                    <span>Empfangen: {formatDateTime(selectedFax.fax_received_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Besuchsankündigung Anzeige */}
          {hasBesuchsdaten && (
            <div className={`mx-4 mt-3 p-3 rounded-xl border ${theme.border} ${theme.surface}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className={`text-xs font-medium ${theme.textMuted} mb-2 uppercase tracking-wide`}>
                    Besuchsankündigung
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    {besuch.firma && (
                      <div className="flex items-center gap-2">
                        <Buildings size={16} className={theme.textMuted} />
                        <span className={theme.text}>{besuch.firma}</span>
                      </div>
                    )}
                    {besuch.name && (
                      <div className="flex items-center gap-2">
                        <User size={16} className={theme.textMuted} />
                        <span className={theme.text}>{besuch.name}</span>
                      </div>
                    )}
                    {besuch.datum && (
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className={theme.textMuted} />
                        <span className={theme.text}>{besuch.datum}</span>
                      </div>
                    )}
                    {besuch.uhrzeit && (
                      <div className="flex items-center gap-2">
                        <Clock size={16} className={theme.textMuted} />
                        <span className={theme.text}>{besuch.uhrzeit} Uhr</span>
                      </div>
                    )}
                    {besuch.thema && (
                      <div className="flex items-center gap-2 sm:col-span-2">
                        <Tag size={16} className={theme.textMuted} />
                        <span className={`${theme.text} truncate`}>{besuch.thema}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Termin-Status */}
                <div className="flex-shrink-0">
                  {terminCreating ? (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                      <SpinnerGap size={18} className="animate-spin" />
                      <span className="text-sm font-medium">Termin wird erstellt...</span>
                    </div>
                  ) : linkedTermin ? (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CalendarCheck size={18} />
                      <span className="text-sm font-medium">Im Kalender</span>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Verknüpfter Termin Details */}
              {linkedTermin && (
                <div className={`mt-2 pt-2 border-t ${theme.border} text-xs ${theme.textMuted}`}>
                  Termin: {linkedTermin.title} am{' '}
                  {new Date(linkedTermin.start_time).toLocaleDateString('de-DE', {
                    weekday: 'short',
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}{' '}
                  um{' '}
                  {new Date(linkedTermin.start_time).toLocaleTimeString('de-DE', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
                  Uhr
                </div>
              )}
            </div>
          )}

          {/* Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Zoom & Rotate Controls */}
            <div className={`flex items-center gap-2 px-4 py-2 border-b ${theme.border} ${theme.surface}`}>
              <button
                type="button"
                onClick={handleZoomOut}
                className={`p-1.5 rounded-lg ${theme.textSecondary} ${theme.bgHover}`}
                title="Verkleinern"
              >
                <MagnifyingGlassMinus size={18} />
              </button>
              <span className={`text-sm ${theme.textSecondary} min-w-[50px] text-center`}>
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={handleZoomIn}
                className={`p-1.5 rounded-lg ${theme.textSecondary} ${theme.bgHover}`}
                title="Vergrößern"
              >
                <MagnifyingGlassPlus size={18} />
              </button>

              <div className={`w-px h-5 ${theme.border} mx-1`} />

              <button
                type="button"
                onClick={handleRotateLeft}
                className={`p-1.5 rounded-lg ${theme.textSecondary} ${theme.bgHover}`}
                title="90° nach links drehen"
              >
                <ArrowUUpLeft size={18} />
              </button>
              <button
                type="button"
                onClick={handleRotateRight}
                className={`p-1.5 rounded-lg ${theme.textSecondary} ${theme.bgHover}`}
                title="90° nach rechts drehen"
              >
                <ArrowUUpRight size={18} />
              </button>

              <div className={`w-px h-5 ${theme.border} mx-1`} />

              <button
                type="button"
                onClick={handleReset}
                className={`p-1.5 rounded-lg ${theme.textSecondary} ${theme.bgHover}`}
                title="Zurücksetzen"
              >
                <ArrowsOutSimple size={18} />
              </button>
              <span className={`text-xs ${theme.textMuted} ml-auto hidden sm:inline`}>
                Ziehen zum Verschieben
              </span>
            </div>

            {/* PDF Viewer mit Pan/Zoom */}
            <div
              ref={containerRef}
              className="flex-1 min-h-0 overflow-hidden bg-gray-100 relative"
              style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
            >
              {getLocalPdfUrl(selectedFax) ? (
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{
                    transform: `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                    transformOrigin: 'center center',
                    pointerEvents: 'none',
                    transition: isDragging ? 'none' : 'transform 0.2s ease-out',
                  }}
                >
                  <iframe
                    src={getLocalPdfUrl(selectedFax)}
                    className="w-full h-full border-0 shadow-lg"
                    style={{
                      width: '100%',
                      height: '100%',
                      minWidth: '800px',
                      minHeight: '1000px',
                    }}
                    title={`Fax von ${selectedFax.absender || 'Unbekannt'}`}
                  />
                </div>
              ) : (
                <div className={`flex-1 flex items-center justify-center h-full ${theme.textMuted}`}>
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
