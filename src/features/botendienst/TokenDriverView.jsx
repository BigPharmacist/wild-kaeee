import { useState, useEffect } from 'react'
import { CircleNotch, Warning, ArrowClockwise } from '@phosphor-icons/react'
import { useTokenTour } from './hooks/useTokenTour'
import { DriverNameSelection } from './token/DriverNameSelection'
import { CompletionScreen } from './token/CompletionScreen'
import { TokenStopsList } from './token/TokenStopsList'
import { TokenCashModal } from './token/TokenCashModal'
import { TokenPhotoModal } from './token/TokenPhotoModal'
import { TokenSignatureModal } from './token/TokenSignatureModal'
import { TokenNotesModal } from './token/TokenNotesModal'

// Feste Fahrernamen für Botendienst (externe Fahrer, nicht in Staff-Datenbank)
const DEFAULT_DRIVER_NAMES = [
  'Kim Berger',
  'Lucia Rock',
  'Herbert Becker',
  'Wolfgang Grauer',
]

// LocalStorage Keys
const DRIVER_NAMES_STORAGE_KEY = 'botendienst_driver_names'

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

  // --- Early Returns ---

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <CircleNotch size={48} className="animate-spin text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Tour wird geladen...</p>
        </div>
      </div>
    )
  }

  if (!driverName && tour) {
    return (
      <DriverNameSelection
        tourName={tour.name}
        savedNames={savedNames}
        onSave={saveDriverName}
        showNameInput={showNameInput}
        setShowNameInput={setShowNameInput}
        customName={customName}
        setCustomName={setCustomName}
        savingName={savingName}
      />
    )
  }

  if (error || !tour) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <Warning size={48} className="text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Tour nicht verfügbar
          </h1>
          <p className="text-gray-600 mb-6">
            {error || 'Diese Tour existiert nicht oder ist nicht mehr aktiv.'}
          </p>
          <button
            onClick={refresh}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-700"
          >
            <ArrowClockwise size={18} />
            Erneut versuchen
          </button>
        </div>
      </div>
    )
  }

  // --- Completion Screen ---

  if (showCompletionScreen && allStopsCompleted) {
    return (
      <CompletionScreen
        stats={stats}
        completionNotes={completionNotes}
        setCompletionNotes={setCompletionNotes}
        vehicleIssues={vehicleIssues}
        setVehicleIssues={setVehicleIssues}
        onSubmit={handleSubmitCompletion}
        submitting={submittingCompletion}
        submitted={completionSubmitted}
        shiftEnded={isShiftEnded}
        endingShift={endingShift}
        onEndShift={handleEndShift}
        workingTime={getWorkingTime()}
        onBack={() => setShowCompletionScreen(false)}
        formatCurrency={formatCurrency}
      />
    )
  }

  // --- Main: Stops List + Modals ---

  const handleCompleteStop = async (stopId) => {
    setActionLoading(stopId)
    await completeStop(stopId)
    setActionLoading(null)
  }

  return (
    <>
      <TokenStopsList
        tour={tour}
        stops={stops}
        stats={stats}
        driverName={driverName}
        expandedStop={expandedStop}
        setExpandedStop={setExpandedStop}
        onCompleteStop={handleCompleteStop}
        onShowCash={setShowCashModal}
        onShowPhoto={setShowPhotoModal}
        onShowSignature={setShowSignature}
        onShowNotes={setShowNotesModal}
        actionLoading={actionLoading}
        formatDate={formatDate}
        formatCurrency={formatCurrency}
        onRefresh={refresh}
      />

      {/* Modals */}
      {showCashModal && (
        <TokenCashModal
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

      {showPhotoModal && (
        <TokenPhotoModal
          stop={showPhotoModal}
          onClose={() => setShowPhotoModal(null)}
          onCapture={async (photoDataUrl) => {
            setActionLoading(showPhotoModal.id)
            await addPhoto(showPhotoModal.id, photoDataUrl, 'Lieferfoto')
            setActionLoading(null)
            setShowPhotoModal(null)
            refresh()
          }}
          loading={actionLoading === showPhotoModal.id}
        />
      )}

      {showSignature && (
        <TokenSignatureModal
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

      {showNotesModal && (
        <TokenNotesModal
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
    </>
  )
}

export default TokenDriverView
