import { useState } from 'react'
import {
  ArrowLeft,
  Plus,
  Play,
  Stop,
  Trash,
  PencilSimple,
  DotsSixVertical,
  MapPin,
  Package,
  Money,
  Check,
  X,
  ArrowsClockwise,
  FileText,
  Path,
  NavigationArrow,
  Clock,
  Camera,
  PencilSimpleLine,
  Note,
  CircleNotch,
  QrCode,
  Printer,
  Pill,
} from '@phosphor-icons/react'
import { StopStatusBadge, PriorityBadge, AddressDisplay } from '../shared'

export function TourDetail({
  theme,
  tour,
  stops,
  stopsLoading,
  actionLoading,
  onBack,
  onUpdateTour,
  onStartTour,
  onCompleteTour,
  onCancelTour,
  onAddStop,
  onUpdateStop,
  onDeleteStop,
  onReorderStops,
  onOptimizeRoute,
  onOpenPdfImport,
  onShowQr,
  onShowPrint,
  getNavigationUrl,
  getTourStats,
}) {
  const [editingName, setEditingName] = useState(false)
  const [tourName, setTourName] = useState(tour?.name || '')
  const [draggedStop, setDraggedStop] = useState(null)
  const [selectedStopDetail, setSelectedStopDetail] = useState(null)

  const stats = getTourStats({ ...tour, stops })

  // Stops können in draft und active Touren hinzugefügt werden
  const canAddStops = ['draft', 'active'].includes(tour?.status)

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('de-DE', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount || 0)
  }

  const handleSaveName = async () => {
    await onUpdateTour(tour.id, { name: tourName })
    setEditingName(false)
  }

  // Drag and drop handlers
  const handleDragStart = (e, stop) => {
    setDraggedStop(stop)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e, targetStop) => {
    e.preventDefault()
    if (!draggedStop || draggedStop.id === targetStop.id) return

    const newOrder = stops.map(s => s.id)
    const fromIndex = newOrder.indexOf(draggedStop.id)
    const toIndex = newOrder.indexOf(targetStop.id)

    newOrder.splice(fromIndex, 1)
    newOrder.splice(toIndex, 0, draggedStop.id)

    await onReorderStops(tour.id, newOrder)
    setDraggedStop(null)
  }

  const statusColors = {
    draft: 'bg-gray-100 text-gray-700',
    active: 'bg-green-100 text-green-700',
    completed: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-red-100 text-red-700',
  }

  const statusLabels = {
    draft: 'Entwurf',
    active: 'Aktiv',
    completed: 'Abgeschlossen',
    cancelled: 'Abgebrochen',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button
          onClick={onBack}
          className={`p-2 rounded-lg ${theme.bgHover}`}
          title="Zurück"
        >
          <ArrowLeft size={20} className={theme.textPrimary} />
        </button>

        <div className="flex-1">
          <div className="flex items-center gap-3">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={tourName}
                  onChange={(e) => setTourName(e.target.value)}
                  className={`px-3 py-1.5 rounded-lg border ${theme.input}`}
                  autoFocus
                />
                <button
                  onClick={handleSaveName}
                  className="p-1.5 rounded-lg bg-green-100 text-green-600"
                >
                  <Check size={16} />
                </button>
                <button
                  onClick={() => {
                    setTourName(tour?.name || '')
                    setEditingName(false)
                  }}
                  className="p-1.5 rounded-lg bg-red-100 text-red-600"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <>
                <h1 className={`text-xl font-semibold ${theme.textPrimary}`}>
                  {tour?.name || 'Unbenannte Tour'}
                </h1>
                {tour?.status === 'draft' && (
                  <button
                    onClick={() => setEditingName(true)}
                    className={`p-1 rounded ${theme.bgHover}`}
                  >
                    <PencilSimple size={16} className={theme.textMuted} />
                  </button>
                )}
              </>
            )}
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[tour?.status]}`}>
              {statusLabels[tour?.status]}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <p className={`text-sm ${theme.textMuted}`}>{formatDate(tour?.date)}</p>
            {tour?.source_pdf_url && (
              <a
                href={tour.source_pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-[#F59E0B] hover:text-[#D97706] hover:underline"
                title="Quell-PDF öffnen"
              >
                <FileText size={16} />
                PDF
              </a>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {/* PDF Import - nur bei Entwürfen */}
          {tour?.status === 'draft' && (
            <button
              onClick={onOpenPdfImport}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg ${theme.surface} ${theme.border} border ${theme.textSecondary} hover:bg-gray-50`}
            >
              <FileText size={18} />
              PDF Import
            </button>
          )}

          {/* Optimieren - bei Entwürfen und aktiven Touren */}
          {canAddStops && (
            <button
              onClick={onOptimizeRoute}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg ${theme.surface} ${theme.border} border ${theme.textSecondary} hover:bg-gray-50`}
              disabled={stops.filter(s => s.status === 'pending').length < 2}
              title={tour?.status === 'active' ? 'Offene Stops neu optimieren' : 'Route optimieren'}
            >
              <Path size={18} />
              Optimieren
            </button>
          )}

          {/* Tour starten - nur bei Entwürfen */}
          {tour?.status === 'draft' && (
            <button
              onClick={() => onStartTour(tour.id)}
              disabled={actionLoading === 'starting'}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-all ${
                actionLoading === 'starting'
                  ? 'bg-green-400 cursor-wait'
                  : 'bg-green-500 hover:bg-green-600 active:scale-95'
              }`}
            >
              {actionLoading === 'starting' ? (
                <CircleNotch size={18} className="animate-spin" />
              ) : (
                <Play size={18} weight="fill" />
              )}
              {actionLoading === 'starting' ? 'Wird gestartet...' : 'Tour starten'}
            </button>
          )}

          {/* Tour abschließen - nur bei aktiven Touren */}
          {tour?.status === 'active' && (
            <button
              onClick={() => onCompleteTour(tour.id)}
              disabled={actionLoading === 'completing'}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-all ${
                actionLoading === 'completing'
                  ? 'bg-blue-400 cursor-wait'
                  : 'bg-blue-500 hover:bg-blue-600 active:scale-95'
              }`}
            >
              {actionLoading === 'completing' ? (
                <CircleNotch size={18} className="animate-spin" />
              ) : (
                <Check size={18} weight="bold" />
              )}
              {actionLoading === 'completing' ? 'Wird abgeschlossen...' : 'Tour abschließen'}
            </button>
          )}
          {/* Drucken Button */}
          <button
            onClick={onShowPrint}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg ${theme.surface} ${theme.border} border ${theme.textSecondary} hover:bg-gray-50`}
            title="Lieferliste drucken"
          >
            <Printer size={18} />
            Drucken
          </button>
          {/* QR-Code Button - immer sichtbar wenn Tour existiert */}
          {tour?.access_token && (
            <button
              onClick={onShowQr}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg ${theme.surface} ${theme.border} border ${theme.textSecondary} hover:bg-gray-50`}
              title="QR-Code für Fahrer"
            >
              <QrCode size={18} />
              QR-Code
            </button>
          )}
        </div>
      </div>

      {/* Tour Info Cards */}
      <div className="grid grid-cols-3 gap-4">
        {/* Stops Count */}
        <div className={`${theme.surface} ${theme.border} border rounded-xl p-4`}>
          <div className="flex items-center gap-2 mb-2">
            <MapPin size={18} className={theme.textMuted} />
            <span className={`text-sm ${theme.textMuted}`}>Stops</span>
          </div>
          <p className={`text-2xl font-semibold ${theme.textPrimary}`}>
            {stats?.completedStops || 0} / {stats?.totalStops || 0}
          </p>
        </div>

        {/* Packages */}
        <div className={`${theme.surface} ${theme.border} border rounded-xl p-4`}>
          <div className="flex items-center gap-2 mb-2">
            <Package size={18} className={theme.textMuted} />
            <span className={`text-sm ${theme.textMuted}`}>Pakete</span>
          </div>
          <p className={`text-2xl font-semibold ${theme.textPrimary}`}>
            {stats?.totalPackages || 0}
          </p>
        </div>

        {/* Cash */}
        <div className={`${theme.surface} ${theme.border} border rounded-xl p-4`}>
          <div className="flex items-center gap-2 mb-2">
            <Money size={18} className={theme.textMuted} />
            <span className={`text-sm ${theme.textMuted}`}>Kassieren</span>
          </div>
          <p className={`text-2xl font-semibold text-green-600`}>
            {formatCurrency(stats?.totalCash)}
          </p>
          {stats?.collectedCash > 0 && (
            <p className={`text-xs ${theme.textMuted}`}>
              Kassiert: {formatCurrency(stats.collectedCash)}
            </p>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {tour?.status === 'active' && stats && (
        <div className={`${theme.surface} ${theme.border} border rounded-xl p-4`}>
          <div className="flex justify-between text-sm mb-2">
            <span className={theme.textMuted}>Fortschritt</span>
            <span className={theme.textPrimary}>{stats.progress}%</span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all"
              style={{ width: `${stats.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Stops List */}
      <div className={`${theme.surface} ${theme.border} border rounded-xl`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className={`font-semibold ${theme.textPrimary}`}>Stops</h2>
          {canAddStops && (
            <button
              onClick={onAddStop}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-[#F59E0B] text-white hover:bg-[#D97706]"
            >
              <Plus size={16} weight="bold" />
              Stop hinzufügen
            </button>
          )}
        </div>

        {stopsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#F59E0B]" />
          </div>
        ) : stops.length === 0 ? (
          <div className="text-center py-8">
            <MapPin size={32} className={`mx-auto ${theme.textMuted} mb-2`} />
            <p className={theme.textMuted}>Noch keine Stops</p>
            {canAddStops && (
              <div className="flex justify-center gap-2 mt-3">
                <button
                  onClick={onAddStop}
                  className="text-sm text-[#F59E0B] hover:underline"
                >
                  Stop manuell hinzufügen
                </button>
                {tour?.status === 'draft' && (
                  <>
                    <span className={theme.textMuted}>oder</span>
                    <button
                      onClick={onOpenPdfImport}
                      className="text-sm text-[#F59E0B] hover:underline"
                    >
                      PDF importieren
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="p-4">
            {/* Timeline Liste */}
            <div className="relative ml-6">
              {stops.map((stop, index) => {
                const isCompleted = stop.status === 'completed'
                const isSkipped = stop.status === 'skipped'
                const isLast = index === stops.length - 1
                const hasPhoto = stop.photos?.length > 0
                const hasSignature = stop.signature?.length > 0
                const hasItems = stop.items?.length > 0
                const isClickable = isCompleted || hasItems

                return (
                  <div
                    key={stop.id}
                    className={`relative pb-1.5 ${!isLast ? '' : ''}`}
                    draggable={tour?.status === 'draft'}
                    onDragStart={(e) => handleDragStart(e, stop)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, stop)}
                  >
                    {/* Vertikale Linie */}
                    {!isLast && (
                      <div className={`absolute left-[-24px] top-3 w-0.5 h-full ${
                        isCompleted ? 'bg-green-300' : 'bg-gray-200'
                      }`} />
                    )}

                    {/* Timeline Punkt */}
                    <button
                      onClick={() => isClickable && setSelectedStopDetail(stop)}
                      className={`absolute left-[-28px] top-2 w-3 h-3 rounded-full border-2 transition-all ${
                        isCompleted
                          ? 'bg-green-500 border-green-500 cursor-pointer hover:scale-125'
                          : isSkipped
                            ? 'bg-amber-500 border-amber-500'
                            : 'bg-white border-gray-300'
                      } ${isClickable && !isCompleted && !isSkipped ? 'cursor-pointer hover:scale-125' : ''}`}
                      title={isClickable ? 'Details anzeigen' : ''}
                    />

                    {/* Stop Row - Grid Layout für exakte Ausrichtung */}
                    <div
                      className={`ml-1 px-2 py-1.5 rounded-lg border ${
                        draggedStop?.id === stop.id ? 'opacity-50' : ''
                      } ${tour?.status === 'draft' ? 'cursor-grab active:cursor-grabbing' : ''} ${
                        isCompleted
                          ? 'bg-green-50/50 border-green-200'
                          : isSkipped
                            ? 'bg-amber-50/50 border-amber-200'
                            : `${theme.surface} ${theme.border}`
                      } hover:shadow-sm transition-shadow`}
                    >
                      {/* Haupt-Grid: Name links, Stats rechts mit festen Breiten */}
                      <div className="grid grid-cols-[1fr_45px_55px_75px_70px_50px] gap-2 items-center">
                        {/* Spalte 1: Drag + Nummer + Name/Adresse (flexibel) */}
                        <div className="flex items-center gap-2 min-w-0">
                          {tour?.status === 'draft' && (
                            <DotsSixVertical size={14} className={`${theme.textMuted} flex-shrink-0`} />
                          )}
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium flex-shrink-0 ${
                            isCompleted
                              ? 'bg-green-500 text-white'
                              : isSkipped
                                ? 'bg-amber-500 text-white'
                                : stop.priority === 'urgent'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-gray-100 text-gray-600'
                          }`}>
                            {index + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <span className={`font-medium text-sm truncate block ${isCompleted ? 'text-green-800' : theme.textPrimary}`}>
                              {stop.customer_name || stop.customer?.name || 'Unbekannt'}
                            </span>
                            <span className={`text-xs truncate block ${isCompleted ? 'text-green-600' : theme.textMuted}`}>
                              {stop.street}, {stop.city}
                            </span>
                          </div>
                        </div>

                        {/* Spalte 2: Artikel (45px) */}
                        <div className="flex items-center justify-end">
                          {hasItems ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedStopDetail(stop)
                              }}
                              className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                              title={`${stop.items.length} Artikel anzeigen`}
                            >
                              <Pill size={18} weight="fill" />
                              <span className="text-sm font-semibold">{stop.items.length}</span>
                            </button>
                          ) : (
                            <Pill size={18} className="text-gray-200" />
                          )}
                        </div>

                        {/* Spalte 3: Pakete (55px) */}
                        <div className="flex items-center justify-end gap-1">
                          <Package size={18} className={stop.package_count > 1 ? theme.textSecondary : 'text-gray-200'} />
                          <span className={`text-sm ${stop.package_count > 1 ? `font-semibold ${theme.textSecondary}` : 'text-gray-300'}`}>
                            {stop.package_count || 1}
                          </span>
                        </div>

                        {/* Spalte 4: Betrag (75px) */}
                        <div className="flex items-center justify-end">
                          {stop.cash_amount > 0 ? (
                            <span className={`text-sm font-semibold flex items-center gap-0.5 ${stop.cash_collected ? 'text-green-600' : 'text-amber-600'}`}>
                              {formatCurrency(stop.cash_amount)}
                              {stop.cash_collected && <Check size={14} weight="bold" />}
                            </span>
                          ) : (
                            <span className="text-gray-300 text-sm">-</span>
                          )}
                        </div>

                        {/* Spalte 5: Status-Icons (70px) */}
                        <div className="flex items-center justify-end gap-1">
                          {hasPhoto ? <Camera size={16} className="text-blue-500" /> : <Camera size={16} className="text-gray-200" />}
                          {hasSignature ? <PencilSimpleLine size={16} className="text-purple-500" /> : <PencilSimpleLine size={16} className="text-gray-200" />}
                          {(stop.stop_notes || stop.customer?.delivery_notes) ? (
                            <Note size={16} className="text-amber-500" title={stop.stop_notes || stop.customer?.delivery_notes} />
                          ) : (
                            <Note size={16} className="text-gray-200" />
                          )}
                        </div>

                        {/* Spalte 6: Actions (50px) */}
                        <div className="flex items-center justify-end gap-0.5">
                          <a
                            href={getNavigationUrl(stop)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded text-blue-500 hover:bg-blue-50"
                            title="Navigation"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <NavigationArrow size={16} />
                          </a>
                          {tour?.status === 'draft' && (
                            <button
                              onClick={() => {
                                if (confirm('Stop wirklich löschen?')) {
                                  onDeleteStop(stop.id)
                                }
                              }}
                              className="p-1 rounded text-red-500 hover:bg-red-50"
                              title="Löschen"
                            >
                              <Trash size={16} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Zeit bei erledigten Stops - eigene Zeile */}
                      {isCompleted && stop.completed_at && (
                        <div className="flex justify-end mt-1 pr-1">
                          <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                            <Clock size={12} />
                            {new Date(stop.completed_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Stop Detail Popup */}
        {selectedStopDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedStopDetail(null)} />
            <div className={`relative ${theme.surface} rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto`}>
              {/* Header */}
              <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    selectedStopDetail.status === 'completed'
                      ? 'bg-green-100'
                      : selectedStopDetail.status === 'skipped'
                        ? 'bg-amber-100'
                        : 'bg-gray-100'
                  }`}>
                    {selectedStopDetail.status === 'completed' ? (
                      <Check size={20} className="text-green-600" weight="bold" />
                    ) : selectedStopDetail.status === 'skipped' ? (
                      <X size={20} className="text-amber-600" weight="bold" />
                    ) : (
                      <Package size={20} className="text-gray-600" />
                    )}
                  </div>
                  <div>
                    <h3 className={`font-semibold ${theme.textPrimary}`}>
                      {selectedStopDetail.status === 'completed' ? 'Liefernachweis' : 'Stop-Details'}
                    </h3>
                    <p className={`text-sm ${theme.textMuted}`}>
                      {selectedStopDetail.customer_name || selectedStopDetail.customer?.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedStopDetail(null)}
                  className={`p-2 rounded-lg ${theme.bgHover}`}
                >
                  <X size={20} className={theme.textMuted} />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 space-y-4">
                {/* Lieferzeit */}
                {selectedStopDetail.completed_at && (
                  <div className={`p-3 rounded-lg ${theme.bg}`}>
                    <div className="flex items-center gap-2">
                      <Clock size={18} className="text-green-600" />
                      <div>
                        <p className={`text-sm font-medium ${theme.textPrimary}`}>Lieferzeit</p>
                        <p className="text-lg font-semibold text-green-600">
                          {new Date(selectedStopDetail.completed_at).toLocaleString('de-DE', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Adresse */}
                <div className={`p-3 rounded-lg ${theme.bg}`}>
                  <div className="flex items-start gap-2">
                    <MapPin size={18} className={theme.textMuted} />
                    <div>
                      <p className={`text-sm ${theme.textPrimary}`}>{selectedStopDetail.street}</p>
                      <p className={`text-sm ${theme.textMuted}`}>
                        {selectedStopDetail.postal_code} {selectedStopDetail.city}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Artikel/Medikamente */}
                {selectedStopDetail.items?.length > 0 && (
                  <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                    <p className="text-sm font-medium text-blue-800 mb-2 flex items-center gap-1">
                      <Pill size={16} />
                      Artikel ({selectedStopDetail.items.length})
                    </p>
                    <div className="space-y-1.5">
                      {selectedStopDetail.items
                        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
                        .map((item, idx) => (
                          <div
                            key={item.id || idx}
                            className="flex items-start gap-2 text-sm bg-white/60 rounded px-2 py-1.5"
                          >
                            <span className="font-medium text-blue-700 w-6 flex-shrink-0">
                              {item.quantity}x
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-blue-900 break-words">{item.article_name}</p>
                              {(item.package_size || item.manufacturer_code) && (
                                <p className="text-xs text-blue-600">
                                  {item.package_size}
                                  {item.package_size && item.manufacturer_code && ' • '}
                                  {item.manufacturer_code}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Notizen */}
                {(selectedStopDetail.stop_notes || selectedStopDetail.cash_notes) && (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <div className="flex items-start gap-2">
                      <Note size={18} className="text-amber-600" />
                      <div>
                        <p className="text-sm font-medium text-amber-800">Notizen</p>
                        {selectedStopDetail.stop_notes && (
                          <p className="text-sm text-amber-700 mt-1">{selectedStopDetail.stop_notes}</p>
                        )}
                        {selectedStopDetail.cash_notes && (
                          <p className="text-sm text-amber-700 mt-1">Kassierung: {selectedStopDetail.cash_notes}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Kassierung */}
                {selectedStopDetail.cash_collected && selectedStopDetail.cash_amount > 0 && (
                  <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                    <div className="flex items-center gap-2">
                      <Money size={18} className="text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-green-800">Kassiert</p>
                        <p className="text-lg font-semibold text-green-600">
                          {formatCurrency(selectedStopDetail.cash_collected_amount || selectedStopDetail.cash_amount)}
                          {selectedStopDetail.cash_collected_amount && selectedStopDetail.cash_collected_amount < selectedStopDetail.cash_amount && (
                            <span className="text-sm font-normal text-amber-600 ml-2">
                              (von {formatCurrency(selectedStopDetail.cash_amount)})
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Fotos */}
                {selectedStopDetail.photos?.length > 0 && (
                  <div>
                    <p className={`text-sm font-medium ${theme.textPrimary} mb-2 flex items-center gap-1`}>
                      <Camera size={16} />
                      Fotos ({selectedStopDetail.photos.length})
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedStopDetail.photos.map(photo => (
                        <a
                          key={photo.id}
                          href={photo.photo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block aspect-square rounded-lg overflow-hidden bg-gray-100 hover:opacity-90"
                        >
                          <img
                            src={photo.photo_url}
                            alt={photo.caption || 'Lieferfoto'}
                            className="w-full h-full object-cover"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Unterschrift */}
                {selectedStopDetail.signature?.length > 0 && (
                  <div>
                    <p className={`text-sm font-medium ${theme.textPrimary} mb-2 flex items-center gap-1`}>
                      <PencilSimpleLine size={16} />
                      Unterschrift
                    </p>
                    {selectedStopDetail.signature.map(sig => (
                      <div key={sig.id} className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                        <img
                          src={sig.signature_url}
                          alt="Unterschrift"
                          className="max-h-24 mx-auto"
                        />
                        {sig.signer_name && (
                          <p className={`text-center text-sm mt-2 ${theme.textMuted}`}>
                            {sig.signer_name}
                          </p>
                        )}
                        {sig.signed_at && (
                          <p className={`text-center text-xs ${theme.textMuted}`}>
                            {new Date(sig.signed_at).toLocaleString('de-DE')}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4">
                <button
                  onClick={() => setSelectedStopDetail(null)}
                  className={`w-full px-4 py-2.5 rounded-lg ${theme.textSecondary} hover:bg-gray-100`}
                >
                  Schließen
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Button - Stop hinzufügen */}
      {canAddStops && (
        <button
          onClick={onAddStop}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[#F59E0B] text-white shadow-lg hover:bg-[#D97706] hover:scale-110 transition-all flex items-center justify-center z-40"
          title="Neuen Stop hinzufügen"
        >
          <Plus size={28} weight="bold" />
        </button>
      )}
    </div>
  )
}
