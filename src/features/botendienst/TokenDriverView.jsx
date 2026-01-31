import { useState, useRef, useEffect } from 'react'
import {
  MapPin,
  Package,
  Money,
  Check,
  NavigationArrow,
  Camera,
  PencilSimpleLine,
  Note,
  CaretDown,
  CaretUp,
  Phone,
  CircleNotch,
  ArrowClockwise,
  CheckCircle,
  User,
  Moped,
  Warning,
  X,
  Trophy,
  Car,
  ChatText,
  Clock,
  SignOut,
} from '@phosphor-icons/react'
import { useTokenTour } from './hooks/useTokenTour'

// Feste Fahrernamen für Botendienst (externe Fahrer, nicht in Staff-Datenbank)
const DEFAULT_DRIVER_NAMES = [
  'Kim Berger',
  'Lucia Rock',
  'Herbert Becker',
  'Wolfgang Grauer',
]

// LocalStorage Keys
const DRIVER_NAMES_STORAGE_KEY = 'botendienst_driver_names'
const TOUR_DRIVER_STORAGE_KEY = 'botendienst_tour_drivers' // Token -> Name Mapping

/**
 * Fahrer-Ansicht für Token-basierten Zugriff (ohne Login)
 */
export function TokenDriverView({ token }) {
  const {
    tour,
    stops,
    loading,
    error,
    refresh,
    updateStop,
    completeStop,
    markCashCollected,
    addPhoto,
    addSignature,
    getStats,
    setDriverName: setDriverNameInDb,
    submitTourCompletion,
    endDriverShift,
  } = useTokenTour(token)

  const [expandedStop, setExpandedStop] = useState(null)
  const [showSignature, setShowSignature] = useState(null)
  const [showCashModal, setShowCashModal] = useState(null)
  const [showPhotoModal, setShowPhotoModal] = useState(null)
  const [showNotesModal, setShowNotesModal] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)

  // Tour-Abschluss State
  const [showCompletionScreen, setShowCompletionScreen] = useState(false)
  const [completionNotes, setCompletionNotes] = useState('')
  const [vehicleIssues, setVehicleIssues] = useState('')
  const [submittingCompletion, setSubmittingCompletion] = useState(false)
  const [completionSubmitted, setCompletionSubmitted] = useState(false)
  const [shiftEnded, setShiftEnded] = useState(false)
  const [endingShift, setEndingShift] = useState(false)

  // Fahrer-Name State
  const [customName, setCustomName] = useState('')
  const [showNameInput, setShowNameInput] = useState(false)
  const [savedNames, setSavedNames] = useState([])
  const [savingName, setSavingName] = useState(false)

  // Fahrername aus Tour (Datenbank) - nicht änderbar wenn gesetzt
  const driverName = tour?.driver_name || ''

  // Lade Vorschlagsliste aus localStorage
  useEffect(() => {
    try {
      const storedNames = localStorage.getItem(DRIVER_NAMES_STORAGE_KEY)
      if (storedNames) {
        const parsed = JSON.parse(storedNames)
        const allNames = [...new Set([...DEFAULT_DRIVER_NAMES, ...parsed])]
        setSavedNames(allNames)
      } else {
        setSavedNames(DEFAULT_DRIVER_NAMES)
      }
    } catch {
      setSavedNames(DEFAULT_DRIVER_NAMES)
    }
  }, [])

  // Speichere neuen Namen in Datenbank (einmalig für diese Tour)
  const saveDriverName = async (name) => {
    if (!name.trim()) return

    const trimmedName = name.trim()
    setSavingName(true)

    try {
      // Speichere in Datenbank
      await setDriverNameInDb(trimmedName)

      // Speichere in Vorschlagsliste (localStorage) wenn es ein neuer Name ist
      if (!DEFAULT_DRIVER_NAMES.includes(trimmedName)) {
        const storedNames = localStorage.getItem(DRIVER_NAMES_STORAGE_KEY)
        const existing = storedNames ? JSON.parse(storedNames) : []
        if (!existing.includes(trimmedName)) {
          const updated = [...existing, trimmedName]
          localStorage.setItem(DRIVER_NAMES_STORAGE_KEY, JSON.stringify(updated))
          setSavedNames([...new Set([...DEFAULT_DRIVER_NAMES, ...updated])])
        }
      }
    } catch {
      // Ignore errors
    } finally {
      setSavingName(false)
    }
  }

  const stats = getStats()

  // Prüfen ob alle Stops erledigt sind
  const allStopsCompleted = stats.totalStops > 0 &&
    stops.every(s => s.status === 'completed' || s.status === 'skipped')

  // Auto-show completion screen when all stops are done
  useEffect(() => {
    if (allStopsCompleted && !completionSubmitted && !showCompletionScreen) {
      setShowCompletionScreen(true)
    }
  }, [allStopsCompleted, completionSubmitted, showCompletionScreen])

  // Tour-Abschluss absenden
  const handleSubmitCompletion = async () => {
    setSubmittingCompletion(true)
    const success = await submitTourCompletion(completionNotes, vehicleIssues)
    setSubmittingCompletion(false)
    if (success) {
      setCompletionSubmitted(true)
    }
  }

  // Feierabend - Schicht beenden
  const handleEndShift = async () => {
    setEndingShift(true)
    const success = await endDriverShift()
    setEndingShift(false)
    if (success) {
      setShiftEnded(true)
    }
  }

  // Prüfen ob Schicht bereits beendet (aus DB)
  const isShiftEnded = shiftEnded || !!tour?.driver_ended_at

  // Arbeitszeit berechnen
  const getWorkingTime = () => {
    const startTime = tour?.driver_started_at
    const endTime = tour?.driver_ended_at || (shiftEnded ? new Date().toISOString() : null)

    if (!startTime || !endTime) return null

    const start = new Date(startTime)
    const end = new Date(endTime)
    const diffMs = end - start
    const hours = Math.floor(diffMs / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    return { hours, minutes, start, end }
  }

  // Theme für die öffentliche Ansicht
  const theme = {
    bg: 'bg-gray-50',
    surface: 'bg-white',
    textPrimary: 'text-gray-900',
    textSecondary: 'text-gray-600',
    textMuted: 'text-gray-400',
    border: 'border-gray-200',
    bgHover: 'hover:bg-gray-100',
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <CircleNotch size={48} className="animate-spin text-amber-500 mx-auto mb-4" />
          <p className="text-gray-600">Tour wird geladen...</p>
        </div>
      </div>
    )
  }

  // Namensauswahl anzeigen wenn noch kein Name in der Datenbank (nur beim ersten Mal)
  if (!driverName && tour) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-6 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <Moped size={32} className="text-amber-600" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Botendienst</h1>
            <p className="text-gray-500 mt-1">{tour.name || 'Tour'}</p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Wer fährt heute?
            </label>

            {/* Vorgeschlagene Namen */}
            <div className="space-y-2">
              {savedNames.map((name) => (
                <button
                  key={name}
                  onClick={() => saveDriverName(name)}
                  disabled={savingName}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                    savingName
                      ? 'border-gray-200 bg-gray-50 cursor-wait'
                      : 'border-gray-200 hover:border-amber-400 hover:bg-amber-50'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <User size={20} className="text-gray-500" />
                  </div>
                  <span className="font-medium text-gray-900">{name}</span>
                </button>
              ))}
            </div>

            {/* Anderen Namen eingeben */}
            {!showNameInput ? (
              <button
                onClick={() => setShowNameInput(true)}
                disabled={savingName}
                className="w-full mt-3 p-3 rounded-xl border border-dashed border-gray-300 text-gray-500 hover:border-amber-400 hover:text-amber-600 transition-all disabled:opacity-50"
              >
                + Anderen Namen eingeben
              </button>
            ) : (
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Name eingeben..."
                  autoFocus
                  disabled={savingName}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 disabled:bg-gray-100"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && customName.trim() && !savingName) {
                      saveDriverName(customName)
                    }
                  }}
                />
                <button
                  onClick={() => {
                    if (customName.trim()) {
                      saveDriverName(customName)
                    }
                  }}
                  disabled={!customName.trim() || savingName}
                  className="px-4 py-3 rounded-xl bg-amber-500 text-white font-medium hover:bg-amber-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {savingName ? <CircleNotch size={20} className="animate-spin" /> : 'OK'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (error || !tour) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <Warning size={48} className="text-amber-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Tour nicht verfügbar
          </h1>
          <p className="text-gray-600 mb-6">
            {error || 'Diese Tour existiert nicht oder ist nicht mehr aktiv.'}
          </p>
          <button
            onClick={refresh}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-white hover:bg-amber-600"
          >
            <ArrowClockwise size={18} />
            Erneut versuchen
          </button>
        </div>
      </div>
    )
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('de-DE', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
    })
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount || 0)
  }

  // ============================================
  // TOUR ABGESCHLOSSEN - Completion Screen
  // ============================================
  if (showCompletionScreen && allStopsCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
        <div className="max-w-lg mx-auto px-4 py-8">
          {/* Erfolgsmeldung */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Trophy size={40} className="text-green-600" weight="fill" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Tour geschafft!
            </h1>
            <p className="text-gray-600">
              Sie haben alle {stats.totalStops} Stops erfolgreich abgeschlossen.
            </p>
          </div>

          {/* Zusammenfassung */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="font-semibold text-gray-900 mb-4">Zusammenfassung</h2>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{stats.completedStops}</p>
                <p className="text-sm text-gray-500">Zustellungen</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{stats.totalPackages}</p>
                <p className="text-sm text-gray-500">Pakete</p>
              </div>
            </div>

            {/* Kassierter Betrag */}
            {stats.collectedCash > 0 && (
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Money size={24} className="text-green-600" />
                    <span className="font-medium text-green-800">Abzurechnen</span>
                  </div>
                  <span className="text-2xl font-bold text-green-600">
                    {formatCurrency(stats.collectedCash)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Feedback Formular - nur wenn noch nicht abgesendet */}
          {!completionSubmitted ? (
            <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
              <h2 className="font-semibold text-gray-900">Feedback zur Tour</h2>

              {/* Allgemeiner Kommentar */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <ChatText size={18} />
                  Kommentar
                  <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  placeholder="z.B. Kunde hat sich beschwert, besondere Vorkommnisse..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 resize-none"
                />
              </div>

              {/* Probleme mit dem Auto */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Car size={18} />
                  Probleme mit dem Fahrzeug
                  <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={vehicleIssues}
                  onChange={(e) => setVehicleIssues(e.target.value)}
                  placeholder="z.B. Kontrollleuchte leuchtet, Reifen platt, Kratzer am Fahrzeug..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-red-500 focus:ring-1 focus:ring-red-500 resize-none"
                />
              </div>

              {/* Absenden Button */}
              <button
                onClick={handleSubmitCompletion}
                disabled={submittingCompletion}
                className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-medium text-white transition-all ${
                  submittingCompletion
                    ? 'bg-green-400 cursor-wait'
                    : 'bg-green-500 hover:bg-green-600 active:scale-98'
                }`}
              >
                {submittingCompletion ? (
                  <>
                    <CircleNotch size={20} className="animate-spin" />
                    Wird gesendet...
                  </>
                ) : (
                  <>
                    <Check size={20} weight="bold" />
                    Tour abschließen
                  </>
                )}
              </button>

              {/* Zurück zu Stops */}
              <button
                onClick={() => setShowCompletionScreen(false)}
                className="w-full px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-100"
              >
                Zurück zur Übersicht
              </button>
            </div>
          ) : (
            /* Bestätigung nach Absenden */
            <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-green-600" weight="fill" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Vielen Dank!
              </h2>
              <p className="text-gray-600">
                Ihre Rückmeldung wurde gespeichert.
              </p>
              {stats.collectedCash > 0 && (
                <div className="mt-4 p-4 bg-green-50 rounded-xl border border-green-200">
                  <p className="font-medium text-green-800">
                    Bitte {formatCurrency(stats.collectedCash)} in der Apotheke abgeben.
                  </p>
                </div>
              )}

              {/* Feierabend Section */}
              {!isShiftEnded ? (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-sm text-gray-500 mb-3">
                    Wenn Sie fertig sind, bestätigen Sie hier Ihren Feierabend:
                  </p>
                  <button
                    onClick={handleEndShift}
                    disabled={endingShift}
                    className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-medium text-white transition-all ${
                      endingShift
                        ? 'bg-amber-400 cursor-wait'
                        : 'bg-amber-500 hover:bg-amber-600 active:scale-98'
                    }`}
                  >
                    {endingShift ? (
                      <>
                        <CircleNotch size={20} className="animate-spin" />
                        Wird gespeichert...
                      </>
                    ) : (
                      <>
                        <SignOut size={20} weight="bold" />
                        Feierabend
                      </>
                    )}
                  </button>
                </div>
              ) : (
                /* Arbeitszeit-Zusammenfassung */
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <Clock size={20} className="text-amber-600" />
                      <span className="font-semibold text-amber-800">Arbeitszeit</span>
                    </div>
                    {(() => {
                      const workTime = getWorkingTime()
                      if (!workTime) return null
                      return (
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between text-gray-600">
                            <span>Beginn:</span>
                            <span className="font-medium">
                              {workTime.start.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr
                            </span>
                          </div>
                          <div className="flex justify-between text-gray-600">
                            <span>Ende:</span>
                            <span className="font-medium">
                              {workTime.end.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr
                            </span>
                          </div>
                          <div className="pt-2 border-t border-amber-200 flex justify-between">
                            <span className="font-medium text-amber-800">Dauer:</span>
                            <span className="font-bold text-amber-800">
                              {workTime.hours}h {workTime.minutes}min
                            </span>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                  <p className="mt-4 text-sm text-gray-500">
                    Gute Heimfahrt!
                  </p>
                </div>
              )}

              <button
                onClick={() => setShowCompletionScreen(false)}
                className="mt-6 w-full px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-100 border border-gray-200"
              >
                Zurück zur Übersicht
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  const getNavigationUrl = (stop) => {
    const address = `${stop.street}, ${stop.postal_code} ${stop.city}`
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`
  }

  const handleCompleteStop = async (stopId) => {
    setActionLoading(stopId)
    await completeStop(stopId)
    setActionLoading(null)
  }

  const sortedStops = [...stops].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                {tour.name || 'Botendienst'}
              </h1>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>{formatDate(tour.date)}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <User size={14} />
                  {driverName}
                </span>
              </div>
            </div>
            <button
              onClick={refresh}
              className="p-2 rounded-lg hover:bg-gray-100"
              title="Aktualisieren"
            >
              <ArrowClockwise size={20} className="text-gray-500" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-500">Fortschritt</span>
              <span className="font-medium text-gray-900">
                {stats.completedStops} / {stats.totalStops} Stops
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${stats.progress}%` }}
              />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex gap-4 mt-3 text-sm">
            <div className="flex items-center gap-1 text-gray-600">
              <Package size={16} />
              <span>{stats.totalPackages} Pakete</span>
            </div>
            {stats.totalCash > 0 && (
              <div className="flex items-center gap-1 text-amber-600">
                <Money size={16} />
                <span>{formatCurrency(stats.totalCash - stats.collectedCash)} offen</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stops List */}
      <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
        {sortedStops.map((stop, index) => {
          const isCompleted = stop.status === 'completed'
          const isExpanded = expandedStop === stop.id
          const hasPhoto = stop.photos?.length > 0
          const hasSignature = stop.signature?.length > 0

          return (
            <div
              key={stop.id}
              className={`bg-white rounded-xl border overflow-hidden transition-all ${
                isCompleted ? 'border-green-200 bg-green-50/30' : 'border-gray-200'
              }`}
            >
              {/* Stop Header */}
              <button
                onClick={() => setExpandedStop(isExpanded ? null : stop.id)}
                className="w-full p-4 text-left"
              >
                <div className="flex items-start gap-3">
                  {/* Number Badge */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {isCompleted ? <Check size={16} weight="bold" /> : index + 1}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium truncate ${isCompleted ? 'text-green-800' : 'text-gray-900'}`}>
                        {stop.customer_name || stop.customer?.name || 'Unbekannt'}
                      </span>
                      {stop.priority === 'urgent' && (
                        <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                          Dringend
                        </span>
                      )}
                    </div>
                    <p className={`text-sm truncate ${isCompleted ? 'text-green-600' : 'text-gray-500'}`}>
                      {stop.street}, {stop.postal_code} {stop.city}
                    </p>

                    {/* Meta Info */}
                    <div className="flex items-center gap-3 mt-1.5 text-xs">
                      {stop.package_count > 1 && (
                        <span className="flex items-center gap-0.5 text-gray-500">
                          <Package size={12} />
                          {stop.package_count}x
                        </span>
                      )}
                      {stop.cash_amount > 0 && (
                        <span className={`flex items-center gap-0.5 ${
                          stop.cash_collected ? 'text-green-600' : 'text-amber-600 font-medium'
                        }`}>
                          <Money size={12} />
                          {formatCurrency(stop.cash_amount)}
                          {stop.cash_collected && <Check size={10} />}
                        </span>
                      )}
                      {(hasPhoto || hasSignature) && (
                        <span className="flex items-center gap-1 text-gray-400">
                          {hasPhoto && <Camera size={12} />}
                          {hasSignature && <PencilSimpleLine size={12} />}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expand Icon */}
                  {isExpanded ? (
                    <CaretUp size={20} className="text-gray-400" />
                  ) : (
                    <CaretDown size={20} className="text-gray-400" />
                  )}
                </div>

                {/* Quick Actions - immer sichtbar */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                  {/* Telefon */}
                  {stop.customer?.phone && (
                    <a
                      href={`tel:${stop.customer.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm"
                    >
                      <Phone size={16} />
                      <span className="truncate max-w-[100px]">{stop.customer.phone}</span>
                    </a>
                  )}
                  {/* Navigation */}
                  <a
                    href={getNavigationUrl(stop)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 text-sm font-medium"
                  >
                    <NavigationArrow size={16} />
                    Navigation
                  </a>
                </div>
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-100">
                  {/* Notes */}
                  {(stop.stop_notes || stop.customer?.delivery_notes) && (
                    <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                      <div className="flex items-start gap-2">
                        <Note size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-amber-800">
                          {stop.stop_notes || stop.customer?.delivery_notes}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-4 space-y-2">
                    {/* Complete Button */}
                    {!isCompleted && (
                      <>
                        <button
                          onClick={() => handleCompleteStop(stop.id)}
                          disabled={actionLoading === stop.id}
                          className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                            actionLoading === stop.id
                              ? 'bg-green-400 text-white cursor-wait'
                              : 'bg-green-500 text-white hover:bg-green-600 active:scale-98'
                          }`}
                        >
                          {actionLoading === stop.id ? (
                            <CircleNotch size={20} className="animate-spin" />
                          ) : (
                            <CheckCircle size={20} />
                          )}
                          {actionLoading === stop.id ? 'Wird gespeichert...' : 'Als erledigt markieren'}
                        </button>
                      </>
                    )}

                    {/* Cash Collection */}
                    {stop.cash_amount > 0 && !stop.cash_collected && (
                      <button
                        onClick={() => setShowCashModal(stop)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-amber-500 text-amber-600 font-medium hover:bg-amber-50"
                      >
                        <Money size={20} />
                        {formatCurrency(stop.cash_amount)} kassieren
                      </button>
                    )}

                    {/* Foto, Unterschrift, Notizen - Buttons */}
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => setShowPhotoModal(stop)}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg font-medium transition-all ${
                          hasPhoto
                            ? 'border border-green-300 bg-green-50 text-green-700'
                            : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <Camera size={18} />
                        Foto
                        {hasPhoto && <Check size={14} />}
                      </button>
                      <button
                        onClick={() => setShowSignature(stop)}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg font-medium transition-all ${
                          hasSignature
                            ? 'border border-green-300 bg-green-50 text-green-700'
                            : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <PencilSimpleLine size={18} />
                        Unterschrift
                        {hasSignature && <Check size={14} />}
                      </button>
                      <button
                        onClick={() => setShowNotesModal(stop)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50"
                      >
                        <Note size={18} />
                        Notiz
                      </button>
                    </div>
                  </div>

                  {/* Completed Info */}
                  {isCompleted && stop.completed_at && (
                    <div className="mt-4 p-3 rounded-lg bg-green-50 border border-green-200">
                      <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle size={18} />
                        <span className="text-sm font-medium">
                          Erledigt um {new Date(stop.completed_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {sortedStops.length === 0 && (
          <div className="text-center py-12">
            <MapPin size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Keine Stops in dieser Tour</p>
          </div>
        )}
      </div>

      {/* Cash Collection Modal */}
      {showCashModal && (
        <CashCollectionModal
          stop={showCashModal}
          onClose={() => setShowCashModal(null)}
          onCollect={async (amount, notes) => {
            setActionLoading(showCashModal.id)
            await markCashCollected(showCashModal.id, amount, notes)
            setActionLoading(null)
            setShowCashModal(null)
          }}
          loading={actionLoading === showCashModal.id}
        />
      )}

      {/* Photo Modal */}
      {showPhotoModal && (
        <PhotoCaptureModal
          stop={showPhotoModal}
          onClose={() => setShowPhotoModal(null)}
          onCapture={async (photoDataUrl) => {
            setActionLoading(showPhotoModal.id)
            // Foto als Base64 Data URL speichern (für Token-Zugriff)
            await addPhoto(showPhotoModal.id, photoDataUrl, 'Lieferfoto')
            setActionLoading(null)
            setShowPhotoModal(null)
            refresh()
          }}
          loading={actionLoading === showPhotoModal.id}
        />
      )}

      {/* Signature Modal */}
      {showSignature && (
        <SignatureModal
          stop={showSignature}
          driverName={driverName}
          onClose={() => setShowSignature(null)}
          onSave={async (signatureDataUrl, signerName) => {
            setActionLoading(showSignature.id)
            await addSignature(showSignature.id, signatureDataUrl, signerName)
            setActionLoading(null)
            setShowSignature(null)
            refresh()
          }}
          loading={actionLoading === showSignature.id}
        />
      )}

      {/* Notes Modal */}
      {showNotesModal && (
        <NotesModal
          stop={showNotesModal}
          onClose={() => setShowNotesModal(null)}
          onSave={async (notes) => {
            setActionLoading(showNotesModal.id)
            await updateStop(showNotesModal.id, { stop_notes: notes })
            setActionLoading(null)
            setShowNotesModal(null)
            refresh()
          }}
          loading={actionLoading === showNotesModal.id}
        />
      )}
    </div>
  )
}

// Cash Collection Modal Component
function CashCollectionModal({ stop, onClose, onCollect, loading }) {
  const [amount, setAmount] = useState(stop.cash_amount || 0)
  const [notes, setNotes] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Betrag kassieren
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Betrag
            </label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 text-lg font-medium focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notizen (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="z.B. Bar bezahlt, Wechselgeld..."
              rows={2}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50"
          >
            Abbrechen
          </button>
          <button
            onClick={() => onCollect(amount, notes)}
            disabled={loading}
            className={`flex-1 px-4 py-3 rounded-lg font-medium text-white ${
              loading
                ? 'bg-green-400 cursor-wait'
                : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {loading ? (
              <CircleNotch size={20} className="animate-spin mx-auto" />
            ) : (
              'Kassiert'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// Photo Capture Modal
function PhotoCaptureModal({ stop, onClose, onCapture, loading }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [stream, setStream] = useState(null)
  const [captured, setCaptured] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [])

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (err) {
      setError('Kamera konnte nicht gestartet werden')
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
    }
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      canvas.getContext('2d').drawImage(video, 0, 0)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
      setCaptured(dataUrl)
      stopCamera()
    }
  }

  const retake = () => {
    setCaptured(null)
    startCamera()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      <div className="w-full h-full flex flex-col">
        {/* Header */}
        <div className="bg-black/80 text-white p-4 flex items-center justify-between">
          <h3 className="font-medium">Foto aufnehmen</h3>
          <button onClick={onClose} className="p-2">
            <X size={24} />
          </button>
        </div>

        {/* Camera / Preview */}
        <div className="flex-1 relative bg-black flex items-center justify-center">
          {error ? (
            <p className="text-white text-center p-4">{error}</p>
          ) : captured ? (
            <img src={captured} alt="Aufgenommen" className="max-w-full max-h-full object-contain" />
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="max-w-full max-h-full object-contain"
            />
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Controls */}
        <div className="bg-black/80 p-4 flex justify-center gap-4">
          {captured ? (
            <>
              <button
                onClick={retake}
                className="px-6 py-3 rounded-full bg-gray-600 text-white font-medium"
              >
                Neu aufnehmen
              </button>
              <button
                onClick={() => onCapture(captured)}
                disabled={loading}
                className="px-6 py-3 rounded-full bg-green-500 text-white font-medium"
              >
                {loading ? <CircleNotch size={20} className="animate-spin" /> : 'Speichern'}
              </button>
            </>
          ) : (
            <button
              onClick={capturePhoto}
              className="w-16 h-16 rounded-full bg-white border-4 border-gray-300"
            />
          )}
        </div>
      </div>
    </div>
  )
}

// Signature Modal
function SignatureModal({ stop, driverName, onClose, onSave, loading }) {
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)
  const [signerName, setSignerName] = useState('')

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.strokeStyle = '#1E293B'
      ctx.lineWidth = 2
      ctx.lineCap = 'round'
    }
  }, [])

  const getPosition = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
    }
  }

  const startDrawing = (e) => {
    e.preventDefault()
    setIsDrawing(true)
    const pos = getPosition(e)
    const ctx = canvasRef.current.getContext('2d')
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
  }

  const draw = (e) => {
    if (!isDrawing) return
    e.preventDefault()
    const pos = getPosition(e)
    const ctx = canvasRef.current.getContext('2d')
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    setHasSignature(true)
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
  }

  const saveSignature = () => {
    const dataUrl = canvasRef.current.toDataURL('image/png')
    onSave(dataUrl, signerName || driverName)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Unterschrift</h3>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name des Empfängers
          </label>
          <input
            type="text"
            value={signerName}
            onChange={(e) => setSignerName(e.target.value)}
            placeholder="Name eingeben..."
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
          />
        </div>

        <div className="border-2 border-gray-300 rounded-lg overflow-hidden mb-4">
          <canvas
            ref={canvasRef}
            width={400}
            height={200}
            className="w-full touch-none"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={clearSignature}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Löschen
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Abbrechen
          </button>
          <button
            onClick={saveSignature}
            disabled={!hasSignature || loading}
            className={`flex-1 px-4 py-2 rounded-lg font-medium text-white ${
              !hasSignature || loading
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {loading ? <CircleNotch size={20} className="animate-spin mx-auto" /> : 'Speichern'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Notes Modal
function NotesModal({ stop, onClose, onSave, loading }) {
  const [notes, setNotes] = useState(stop.stop_notes || '')

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Notiz hinzufügen</h3>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notiz eingeben..."
          rows={4}
          autoFocus
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
        />

        <div className="flex gap-3 mt-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50"
          >
            Abbrechen
          </button>
          <button
            onClick={() => onSave(notes)}
            disabled={loading}
            className={`flex-1 px-4 py-3 rounded-lg font-medium text-white ${
              loading ? 'bg-green-400 cursor-wait' : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {loading ? <CircleNotch size={20} className="animate-spin mx-auto" /> : 'Speichern'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default TokenDriverView
