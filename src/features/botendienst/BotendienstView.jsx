import { useState, useEffect, useCallback } from 'react'
import { supabase, supabaseUrl } from '../../lib/supabase'
import { usePhotosContext } from '../../context'
import {
  useBotendienst,
  useDeliveryCustomers,
  useDeliveryTracking,
  useDeliveryPhotos,
  useTourOcr,
  useRouteOptimization,
} from './hooks'
import {
  TourOverview,
  TourDetail,
  TourMap,
  TourPdfImport,
  NewStopModal,
  CustomerList,
  AddressValidationModal,
  TourQrModal,
  TourPrintModal,
} from './admin'
import {
  DriverTourView,
  SignatureCanvas,
  PhotoCapture,
  CashCollectionModal,
} from './driver'
import MinijobberView from './minijobber/MinijobberView'

export default function BotendienstView({
  theme,
  session,
  currentStaff,
  pharmacies,
  staff,
  botendienstTab,
  setBotendienstTab,
}) {
  // Get current pharmacy ID and pharmacy object
  const pharmacyId = currentStaff?.pharmacy_id || pharmacies[0]?.id
  const currentPharmacy = pharmacies?.find(p => p.id === pharmacyId) || null

  // Google API Key from PhotosContext
  const { googleApiKey, fetchGoogleApiKey } = usePhotosContext()

  // ============================================
  // HOOKS
  // ============================================

  const {
    tours,
    toursLoading,
    toursError,
    actionLoading,
    selectedTour,
    setSelectedTour,
    stops,
    stopsLoading,
    fetchTours,
    createTour,
    updateTour,
    deleteTour,
    startTour,
    completeTour,
    fetchStops,
    addStop,
    updateStop,
    deleteStop,
    completeStop,
    skipStop,
    rescheduleStop,
    markCashCollected,
    reorderStops,
    activeTour,
    fetchActiveTourForDriver,
    getTourStats,
  } = useBotendienst({ session, currentStaff, pharmacyId })

  const {
    customers,
    customersLoading,
    searchResults,
    searchLoading,
    fetchCustomers,
    searchCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    geocodeAddress,
    findOrCreateCustomer,
  } = useDeliveryCustomers({ session, pharmacyId })

  const {
    isTracking,
    currentPosition,
    driverLocations,
    startTracking,
    stopTracking,
    getCurrentPosition,
    fetchTourTrack,
  } = useDeliveryTracking({
    session,
    currentStaff,
    tourId: activeTour?.id || selectedTour?.id,
    isActive: botendienstTab === 'driver' && !!activeTour,
  })

  const {
    uploading,
    uploadPhoto,
    uploadPhotoFromCamera,
    uploadSignature,
    uploadTourPdf,
  } = useDeliveryPhotos({ session, currentStaff })

  const {
    processing: ocrProcessing,
    progress: ocrProgress,
    ocrError,
    parsedStops,
    parsedTourDate,
    parsedTourName,
    processPdf,
    updateParsedStop,
    removeParsedStop,
    addEmptyStop,
    clearOcr,
  } = useTourOcr()

  const {
    optimizing,
    optimizeRoute,
    optimizeRouteSimple,
    getNavigationUrl,
    routePolyline,
    loadEncodedPolyline,
  } = useRouteOptimization()

  // ============================================
  // LOCAL STATE
  // ============================================

  const [showPdfImport, setShowPdfImport] = useState(false)
  const [showNewStopModal, setShowNewStopModal] = useState(false)
  const [showQrModal, setShowQrModal] = useState(false)
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [signatureStopId, setSignatureStopId] = useState(null)
  const [photoStopId, setPhotoStopId] = useState(null)
  const [cashStopId, setCashStopId] = useState(null)
  const [cashAmount, setCashAmount] = useState(0)

  // Address validation during import
  const [pendingImportStops, setPendingImportStops] = useState([])
  const [importTourMeta, setImportTourMeta] = useState(null)
  const [currentValidationIndex, setCurrentValidationIndex] = useState(-1)
  const [validationCustomer, setValidationCustomer] = useState(null)

  // ============================================
  // EFFECTS
  // ============================================

  // Fetch tours on mount
  useEffect(() => {
    if (session && pharmacyId) {
      fetchTours()
    }
  }, [session, pharmacyId, fetchTours])

  // Fetch stops when tour is selected
  useEffect(() => {
    if (selectedTour?.id) {
      fetchStops(selectedTour.id)
    }
  }, [selectedTour?.id, fetchStops])

  // Load stored route polyline when tour is selected
  useEffect(() => {
    if (selectedTour?.route_polyline) {
      loadEncodedPolyline(selectedTour.route_polyline)
    } else {
      loadEncodedPolyline(null)
    }
  }, [selectedTour?.id, selectedTour?.route_polyline, loadEncodedPolyline])

  // Fetch active tour for driver mode
  useEffect(() => {
    if (botendienstTab === 'driver' && session && currentStaff) {
      fetchActiveTourForDriver()
    }
  }, [botendienstTab, session, currentStaff, fetchActiveTourForDriver])

  // Auto-select first tour when switching to map tab
  useEffect(() => {
    if (botendienstTab === 'map' && !selectedTour && tours.length > 0) {
      // Prefer active or draft tours
      const activeTours = tours.filter(t => ['active', 'draft'].includes(t.status))
      const tourToSelect = activeTours[0] || tours[0]
      if (tourToSelect) {
        setSelectedTour(tourToSelect)
      }
    }
  }, [botendienstTab, selectedTour, tours, setSelectedTour])

  // ============================================
  // HANDLERS
  // ============================================

  const handleCreateTour = async () => {
    const tour = await createTour({
      name: `Tour ${new Date().toLocaleDateString('de-DE')}`,
      date: new Date().toISOString().split('T')[0],
    })
    if (tour) {
      setSelectedTour(tour)
    }
  }

  const handleAddStop = async (stopData, options = {}) => {
    const { skipAutoOptimize = false } = options

    if (selectedTour?.id) {
      // Find or create customer (ohne delivery_notes - die sind tour-spezifisch!)
      if (stopData.customer_name && !stopData.customer_id) {
        const customer = await findOrCreateCustomer({
          name: stopData.customer_name,
          street: stopData.street,
          postal_code: stopData.postal_code,
          city: stopData.city,
          phone: stopData.phone,
          // delivery_notes NICHT an Kunden übergeben - sind tour-spezifisch
        })
        if (customer) {
          stopData.customer_id = customer.id
          stopData.latitude = customer.latitude
          stopData.longitude = customer.longitude
        }
      }

      // Tour-spezifische Hinweise als stop_notes speichern
      if (stopData.delivery_notes && !stopData.stop_notes) {
        stopData.stop_notes = stopData.delivery_notes
      }

      const newStop = await addStop(selectedTour.id, stopData)

      // Bei aktiven Touren: Automatisch Route optimieren
      // (nicht bei Bulk-Import, dort wird am Ende optimiert)
      if (newStop && selectedTour.status === 'active' && !skipAutoOptimize) {
        // Kurz warten bis stops aktualisiert sind, dann optimieren
        setTimeout(() => {
          handleOptimizeRouteAfterAdd()
        }, 500)
      }

      return newStop
    }
  }

  // Optimierung nach Hinzufügen eines Stops (nutzt aktuelle stops aus State)
  const handleOptimizeRouteAfterAdd = async () => {
    // Stops neu laden um sicher aktuellen Stand zu haben
    if (!selectedTour?.id) return
    await fetchStops(selectedTour.id)

    // Kleine Verzögerung damit React State aktualisiert
    setTimeout(async () => {
      await handleOptimizeRoute()
    }, 100)
  }

  // Prüft ob eine Adresse vollständig ist
  const isAddressComplete = (stop, customer) => {
    const street = customer?.street || stop?.street
    const postalCode = customer?.postal_code || stop?.postal_code
    const city = customer?.city || stop?.city

    // PLZ muss 5-stellig sein
    const validPostalCode = postalCode && /^\d{5}$/.test(postalCode)

    return street && street.trim() && validPostalCode && city && city.trim()
  }

  // Sucht Kunde im Kundenstamm nach Name
  const findCustomerByName = async (name) => {
    if (!name || !pharmacyId) return null

    const { data, error } = await supabase
      .from('delivery_customers')
      .select('*')
      .eq('pharmacy_id', pharmacyId)
      .ilike('name', name.trim())
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Fehler bei Kundensuche:', error)
    }
    return data || null
  }

  // Startet den Import mit Validierung
  const handleImportStops = async (stopsToImport, tourMeta = {}) => {
    if (!selectedTour?.id) return

    // PDF hochladen wenn vorhanden
    if (tourMeta.pdfFile) {
      await uploadTourPdf(selectedTour.id, tourMeta.pdfFile)
    }

    // Aktualisiere Tour-Datum wenn aus PDF erkannt
    if (tourMeta.tourDate) {
      await updateTour(selectedTour.id, {
        date: tourMeta.tourDate,
        name: tourMeta.tourName || selectedTour.name,
      })
    }

    // Speichere Stops für schrittweise Verarbeitung
    setPendingImportStops(stopsToImport)
    setImportTourMeta(tourMeta)
    setShowPdfImport(false)

    // Starte Validierung beim ersten Stop
    processNextImportStop(stopsToImport, 0)
  }

  // Verarbeitet den nächsten Stop im Import
  const processNextImportStop = async (stops, index) => {
    if (index >= stops.length) {
      // Import abgeschlossen
      finishImport()
      return
    }

    const stopData = stops[index]

    // Suche Kunde im Kundenstamm
    const existingCustomer = await findCustomerByName(stopData.customer_name)

    // Prüfe ob Adresse vollständig
    if (isAddressComplete(stopData, existingCustomer)) {
      // Adresse OK - direkt importieren (ohne Auto-Optimierung beim Import)
      await handleAddStop({
        ...stopData,
        street: existingCustomer?.street || stopData.street,
        postal_code: existingCustomer?.postal_code || stopData.postal_code,
        city: existingCustomer?.city || stopData.city,
        phone: existingCustomer?.phone || stopData.phone,
      }, { skipAutoOptimize: true })

      // Nächsten Stop verarbeiten
      processNextImportStop(stops, index + 1)
    } else {
      // Adresse unvollständig - Validierung zeigen
      setCurrentValidationIndex(index)
      setValidationCustomer(existingCustomer)
    }
  }

  // Handler für Validierung: Speichern
  const handleValidationSave = async (correctedData) => {
    const stopData = pendingImportStops[currentValidationIndex]

    // Stop mit korrigierten Daten importieren (ohne Auto-Optimierung beim Import)
    await handleAddStop({
      ...stopData,
      ...correctedData,
    }, { skipAutoOptimize: true })

    // Nächsten Stop verarbeiten
    const nextIndex = currentValidationIndex + 1
    setCurrentValidationIndex(-1)
    setValidationCustomer(null)
    processNextImportStop(pendingImportStops, nextIndex)
  }

  // Handler für Validierung: Überspringen
  const handleValidationSkip = () => {
    // Stop ohne vollständige Adresse importieren (ohne Auto-Optimierung beim Import)
    const stopData = pendingImportStops[currentValidationIndex]
    handleAddStop(stopData, { skipAutoOptimize: true })

    // Nächsten Stop verarbeiten
    const nextIndex = currentValidationIndex + 1
    setCurrentValidationIndex(-1)
    setValidationCustomer(null)
    processNextImportStop(pendingImportStops, nextIndex)
  }

  // Handler für Validierung: Abbrechen
  const handleValidationCancel = () => {
    setCurrentValidationIndex(-1)
    setValidationCustomer(null)
    setPendingImportStops([])
    setImportTourMeta(null)
    alert('Import abgebrochen. Bereits importierte Stops bleiben erhalten.')
    fetchTours()
  }

  // Import abschließen
  const finishImport = async () => {
    setPendingImportStops([])
    setImportTourMeta(null)
    setCurrentValidationIndex(-1)
    setValidationCustomer(null)

    // Tour neu laden
    await fetchTours()
    clearOcr()
  }

  const handleOptimizeRoute = async () => {
    // Bei aktiven Touren: Nur offene Stops optimieren, erledigte behalten Position
    const isActiveTour = selectedTour?.status === 'active'
    const completedStops = isActiveTour
      ? stops.filter(s => s.status === 'completed' || s.status === 'skipped')
      : []
    const pendingStops = isActiveTour
      ? stops.filter(s => s.status === 'pending')
      : stops

    if (pendingStops.length < 2) {
      alert('Mindestens 2 offene Stops für Optimierung erforderlich')
      return
    }

    // Google Maps Routes API Key laden (separater Key!)
    const { data: keyData } = await supabase
      .from('api_keys')
      .select('key')
      .eq('name', 'Google Maps Routes')
      .single()

    const apiKey = keyData?.key
    console.log('Google Maps Routes API Key vorhanden:', !!apiKey)

    if (apiKey) {
      // Apotheken-Adresse als Start/Ende der Rundfahrt
      const pharmacy = pharmacies?.find(p => p.id === pharmacyId)
      const startAddress = pharmacy
        ? `${pharmacy.street}, ${pharmacy.postal_code} ${pharmacy.city}, Germany`
        : null

      // Use Google Maps API via Edge Function - nur pending Stops optimieren
      console.log('Rufe Edge Function auf...')
      console.log('Startadresse (Apotheke):', startAddress)
      console.log('Optimiere', pendingStops.length, 'offene Stops')
      const result = await optimizeRoute(pendingStops, startAddress, apiKey, supabaseUrl)
      console.log('Edge Function Ergebnis:', result)
      if (result) {
        // Neue Reihenfolge: Erledigte Stops zuerst, dann optimierte offene Stops
        const completedIds = completedStops.map(s => s.id)
        const optimizedPendingIds = result.optimizedStops.map(s => s.id)
        const newOrder = [...completedIds, ...optimizedPendingIds]
        await reorderStops(selectedTour.id, newOrder)

        // Save encoded polyline and route details to database
        await updateTour(selectedTour.id, {
          route_polyline: result.encodedPolyline || null,
          total_distance_km: result.details?.distanceKm || null,
          estimated_duration_minutes: result.details?.durationMinutes || null,
          optimized_at: new Date().toISOString(),
        })

        // Update selectedTour with new route_polyline so Effect can load it
        setSelectedTour(prev => prev ? { ...prev, route_polyline: result.encodedPolyline } : prev)

        const message = isActiveTour
          ? `${result.message} (${pendingStops.length} offene Stops optimiert)`
          : result.message
        alert(message)
        return
      }
      // If optimizeRoute failed, show error
      alert('Google-Optimierung fehlgeschlagen, nutze Fallback...')
    } else {
      console.log('Kein API Key gefunden')
    }

    // Fallback to simple optimization - nur pending Stops
    const result = optimizeRouteSimple(pendingStops)
    const completedIds = completedStops.map(s => s.id)
    const optimizedPendingIds = result.stops.map(s => s.id)
    const newOrder = [...completedIds, ...optimizedPendingIds]
    await reorderStops(selectedTour.id, newOrder)

    const message = isActiveTour
      ? `${result.message} (${pendingStops.length} offene Stops)`
      : result.message
    alert(message)
  }

  const handleCompleteStop = async (stopId, position) => {
    const pos = position || (await getCurrentPosition().catch(() => null))
    await completeStop(stopId, pos)

    // Refresh für Fahrermodus
    if (activeTour?.id) {
      fetchActiveTourForDriver()
    }
  }

  const handleSkipStop = async (stopId) => {
    const reason = prompt('Grund für Überspringen (optional):')
    await skipStop(stopId, reason)

    // Refresh für Fahrermodus
    if (activeTour?.id) {
      fetchActiveTourForDriver()
    }
  }

  const handleRescheduleStop = async (stopId) => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateStr = tomorrow.toISOString().split('T')[0]
    const reason = prompt('Grund für Verschiebung (optional):')
    await rescheduleStop(stopId, dateStr, reason)

    // Refresh für Fahrermodus
    if (activeTour?.id) {
      fetchActiveTourForDriver()
    }
  }

  const handleSaveSignature = async (dataUrl, signerName) => {
    if (!signatureStopId) return

    const pos = await getCurrentPosition().catch(() => null)
    await uploadSignature(signatureStopId, dataUrl, signerName, pos)
    setSignatureStopId(null)

    // Refresh stops
    if (selectedTour?.id) {
      fetchStops(selectedTour.id)
    }
    if (activeTour?.id) {
      fetchActiveTourForDriver()
    }
  }

  const handleSavePhoto = async (imageData, caption) => {
    if (!photoStopId) return

    await uploadPhotoFromCamera(photoStopId, imageData, caption)
    setPhotoStopId(null)

    // Refresh stops
    if (selectedTour?.id) {
      fetchStops(selectedTour.id)
    }
    if (activeTour?.id) {
      fetchActiveTourForDriver()
    }
  }

  const handleConfirmCash = async (stopId, collectedAmount, notes) => {
    await markCashCollected(stopId, collectedAmount, notes)
    setCashStopId(null)
    setCashAmount(0)

    // Refresh
    if (activeTour?.id) {
      fetchActiveTourForDriver()
    }
  }

  const handleOpenCash = (stopId, amount) => {
    setCashStopId(stopId)
    setCashAmount(amount)
  }

  // ============================================
  // RENDER
  // ============================================

  // Driver Mode
  if (botendienstTab === 'driver') {
    return (
      <div className="h-full">
        <DriverTourView
          theme={theme}
          tour={activeTour}
          stops={activeTour?.stops?.sort((a, b) => a.sort_order - b.sort_order) || []}
          currentPosition={currentPosition}
          onCompleteStop={handleCompleteStop}
          onSkipStop={handleSkipStop}
          onRescheduleStop={handleRescheduleStop}
          onOpenSignature={(stopId) => setSignatureStopId(stopId)}
          onOpenPhoto={(stopId) => setPhotoStopId(stopId)}
          onOpenCash={handleOpenCash}
          getNavigationUrl={getNavigationUrl}
          onExitDriverMode={() => setBotendienstTab('overview')}
        />

        {/* Modals */}
        <SignatureCanvas
          theme={theme}
          isOpen={!!signatureStopId}
          onClose={() => setSignatureStopId(null)}
          onSave={handleSaveSignature}
          uploading={uploading}
        />

        <PhotoCapture
          theme={theme}
          isOpen={!!photoStopId}
          onClose={() => setPhotoStopId(null)}
          onSave={handleSavePhoto}
          uploading={uploading}
        />

        <CashCollectionModal
          theme={theme}
          isOpen={!!cashStopId}
          stopId={cashStopId}
          amount={cashAmount}
          onClose={() => {
            setCashStopId(null)
            setCashAmount(0)
          }}
          onConfirm={handleConfirmCash}
        />
      </div>
    )
  }

  // Map View
  if (botendienstTab === 'map') {
    const stopsWithCoords = stops.filter(s => s.latitude && s.longitude)
    const stopsWithoutCoords = stops.filter(s => !s.latitude || !s.longitude)

    return (
      <div className="space-y-4">
        {/* Tour selector - oben für bessere Sichtbarkeit */}
        <div className={`${theme.surface} ${theme.border} border rounded-xl p-4`}>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className={`block text-xs font-medium ${theme.textMuted} mb-1`}>
                Tour auswählen
              </label>
              <select
                value={selectedTour?.id || ''}
                onChange={(e) => {
                  const tour = tours.find(t => t.id === e.target.value)
                  setSelectedTour(tour || null)
                }}
                className={`w-full px-3 py-2 rounded-lg border text-sm ${theme.input}`}
              >
                <option value="">-- Tour wählen --</option>
                {tours.filter(t => ['active', 'draft'].includes(t.status)).map(tour => (
                  <option key={tour.id} value={tour.id}>
                    {tour.name || 'Unbenannte Tour'} ({new Date(tour.date).toLocaleDateString('de-DE')})
                  </option>
                ))}
              </select>
            </div>
            {selectedTour && (
              <div className={`text-sm ${theme.textSecondary}`}>
                <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
                  selectedTour.status === 'active' ? 'bg-green-100 text-green-700' :
                  selectedTour.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {selectedTour.status === 'active' ? 'Aktiv' : selectedTour.status === 'draft' ? 'Entwurf' : 'Abgeschlossen'}
                </span>
                <span className="ml-2">
                  {stops.length} Stops • {stopsWithCoords.length} mit Koordinaten
                </span>
              </div>
            )}
          </div>
          {stopsWithoutCoords.length > 0 && selectedTour && (
            <p className="mt-2 text-xs text-red-700">
              ⚠ {stopsWithoutCoords.length} Stop(s) ohne Koordinaten werden nicht auf der Karte angezeigt
            </p>
          )}
        </div>

        {/* Karte */}
        {selectedTour ? (
          stopsLoading ? (
            <div className={`${theme.surface} ${theme.border} border rounded-xl p-12 flex items-center justify-center`}>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#DC2626]" />
            </div>
          ) : (
            <TourMap
              theme={theme}
              stops={stops}
              driverLocations={driverLocations}
              selectedTourId={selectedTour.id}
              pharmacy={currentPharmacy}
              routePolyline={routePolyline}
              onSelectStop={(stop) => {
                // Could open stop detail
              }}
            />
          )
        ) : (
          <div className={`${theme.surface} ${theme.border} border rounded-xl p-12 text-center`}>
            <p className={theme.textMuted}>Wähle oben eine Tour aus, um die Stops auf der Karte zu sehen.</p>
          </div>
        )}
      </div>
    )
  }

  // Minijobber View
  if (botendienstTab === 'minijobber') {
    return (
      <MinijobberView
        theme={theme}
        session={session}
        currentStaff={currentStaff}
        pharmacies={pharmacies}
        staff={staff}
      />
    )
  }

  // Customers View
  if (botendienstTab === 'customers') {
    return (
      <CustomerList
        theme={theme}
        customers={customers}
        customersLoading={customersLoading}
        onFetchCustomers={fetchCustomers}
        onCreateCustomer={createCustomer}
        onUpdateCustomer={updateCustomer}
        onDeleteCustomer={deleteCustomer}
      />
    )
  }

  // History View
  if (botendienstTab === 'history') {
    return (
      <TourOverview
        theme={theme}
        tours={tours.filter(t => t.status === 'completed' || t.status === 'cancelled')}
        toursLoading={toursLoading}
        staff={staff}
        onCreateTour={() => {}}
        onSelectTour={setSelectedTour}
        onStartTour={() => {}}
        onDeleteTour={() => {}}
        getTourStats={getTourStats}
      />
    )
  }

  // Overview / Default
  // Tour Detail View
  if (selectedTour) {
    return (
      <>
        <TourDetail
          theme={theme}
          tour={selectedTour}
          stops={stops}
          stopsLoading={stopsLoading}
          actionLoading={actionLoading}
          onBack={() => setSelectedTour(null)}
          onUpdateTour={updateTour}
          onStartTour={startTour}
          onCompleteTour={completeTour}
          onCancelTour={() => updateTour(selectedTour.id, { status: 'cancelled' })}
          onAddStop={() => setShowNewStopModal(true)}
          onUpdateStop={updateStop}
          onDeleteStop={deleteStop}
          onReorderStops={reorderStops}
          onOptimizeRoute={handleOptimizeRoute}
          onOpenPdfImport={() => setShowPdfImport(true)}
          onShowQr={() => setShowQrModal(true)}
          onShowPrint={() => setShowPrintModal(true)}
          getNavigationUrl={getNavigationUrl}
          getTourStats={getTourStats}
        />

        {/* Modals */}
        <TourPdfImport
          theme={theme}
          isOpen={showPdfImport}
          onClose={() => {
            setShowPdfImport(false)
            clearOcr()
          }}
          processing={ocrProcessing}
          progress={ocrProgress}
          ocrError={ocrError}
          parsedStops={parsedStops}
          parsedTourDate={parsedTourDate}
          parsedTourName={parsedTourName}
          onProcessPdf={processPdf}
          onUpdateParsedStop={updateParsedStop}
          onRemoveParsedStop={removeParsedStop}
          onAddEmptyStop={addEmptyStop}
          onImportStops={handleImportStops}
          onClearOcr={clearOcr}
        />

        <NewStopModal
          theme={theme}
          isOpen={showNewStopModal}
          onClose={() => setShowNewStopModal(false)}
          onAddStop={handleAddStop}
          searchCustomers={searchCustomers}
          searchResults={searchResults}
          searchLoading={searchLoading}
          geocodeAddress={geocodeAddress}
        />

        <AddressValidationModal
          theme={theme}
          isOpen={currentValidationIndex >= 0}
          stop={pendingImportStops[currentValidationIndex]}
          existingCustomer={validationCustomer}
          onSave={handleValidationSave}
          onSkip={handleValidationSkip}
          onCancel={handleValidationCancel}
          geocodeAddress={geocodeAddress}
          totalStops={pendingImportStops.length}
          currentIndex={currentValidationIndex}
        />

        <TourQrModal
          theme={theme}
          isOpen={showQrModal}
          onClose={() => setShowQrModal(false)}
          tour={selectedTour}
          baseUrl={window.location.origin}
        />

        <TourPrintModal
          theme={theme}
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          tour={selectedTour}
          stops={stops}
          pharmacy={currentPharmacy}
          baseUrl={window.location.origin}
        />
      </>
    )
  }

  // Tour Overview
  return (
    <TourOverview
      theme={theme}
      tours={tours}
      toursLoading={toursLoading}
      actionLoading={actionLoading}
      staff={staff}
      onCreateTour={handleCreateTour}
      onSelectTour={setSelectedTour}
      onStartTour={startTour}
      onDeleteTour={deleteTour}
      getTourStats={getTourStats}
    />
  )
}
