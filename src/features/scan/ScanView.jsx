import { useState, useEffect, useCallback } from 'react'
import { GearSix, Plus, Minus, Download, SpeakerHigh, SpeakerSlash, Vibrate, Check } from '@phosphor-icons/react'
import ScannerCamera from './ScannerCamera'
import ScanList from './ScanList'
import ScanSessionModal from './ScanSessionModal'
import { useScan } from './useScan'
import { giveScanFeedback, initAudio, formatCodeType, parseDataMatrixCode, extractPznFromBarcode } from './scanUtils'

const ScanView = ({ theme, session, pharmacyId }) => {
  const [sessionModalOpen, setSessionModalOpen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [scanFeedback, setScanFeedback] = useState(null)
  const [debugInfo, setDebugInfo] = useState(null)

  const {
    currentSession,
    sessions,
    sessionsLoading,
    scans,
    scansLoading,
    quantity,
    lastScan,
    soundEnabled,
    vibrationEnabled,
    resetQuantityAfterScan,
    setQuantity,
    setSoundEnabled,
    setVibrationEnabled,
    setResetQuantityAfterScan,
    fetchSessions,
    startNewSession,
    loadSession,
    handleScan,
    deleteScan,
    updateScanQuantity,
    deleteSession,
    exportSessionAsCsv,
    lookupPzn,
    totalItems,
    uniqueCodes,
  } = useScan({
    sessionUserId: session?.user?.id,
    pharmacyId,
  })

  // Initialize audio on first interaction
  useEffect(() => {
    const handleInteraction = () => {
      initAudio()
      window.removeEventListener('click', handleInteraction)
      window.removeEventListener('touchstart', handleInteraction)
    }
    window.addEventListener('click', handleInteraction)
    window.addEventListener('touchstart', handleInteraction)
    return () => {
      window.removeEventListener('click', handleInteraction)
      window.removeEventListener('touchstart', handleInteraction)
    }
  }, [])

  // Fetch sessions on mount
  useEffect(() => {
    if (session?.user?.id) {
      fetchSessions()
    }
  }, [session?.user?.id, fetchSessions])

  // Auto-start session if none exists
  useEffect(() => {
    if (session?.user?.id && !currentSession.id && !sessionsLoading) {
      startNewSession()
    }
  }, [session?.user?.id, currentSession.id, sessionsLoading, startNewSession])

  // Handle scan from camera
  const onCameraScan = useCallback(async (code, codeType) => {
    if (!currentSession.id) return

    // Parse für Debug-Info
    const pharmaData = parseDataMatrixCode(code)
    const barcodeData = extractPznFromBarcode(code)
    const extractedPzn = pharmaData?.pzn || barcodeData?.pzn || '-'

    // Lookup in DB (für Debug)
    let dbResult = null
    if (extractedPzn !== '-') {
      dbResult = await lookupPzn(extractedPzn)
    }

    setDebugInfo({
      rawCode: code.substring(0, 100) + (code.length > 100 ? '...' : ''),
      rawLength: code.length,
      codeType,
      format: pharmaData?.format || (barcodeData?.source) || '-',
      gtin: pharmaData?.gtin || '-',
      pzn: extractedPzn,
      pznSource: pharmaData?.pzn ? (pharmaData.format || 'DataMatrix') : (barcodeData?.source || '-'),
      batch: pharmaData?.batch || '-',
      expiry: pharmaData?.expiryFormatted || '-',
      serial: pharmaData?.serialNumber || '-',
      dbFound: dbResult ? 'JA' : 'NEIN',
      articleName: dbResult?.article_name || '-',
    })

    // Give feedback
    await giveScanFeedback(soundEnabled, vibrationEnabled)

    // Record scan
    await handleScan(code, codeType)

    // Show visual feedback
    setScanFeedback({ code, codeType })
    setTimeout(() => setScanFeedback(null), 1500)
  }, [currentSession.id, soundEnabled, vibrationEnabled, handleScan])

  // Quantity controls
  const decrementQuantity = () => setQuantity((q) => Math.max(1, q - 1))
  const incrementQuantity = () => setQuantity((q) => q + 1)

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl lg:text-3xl font-semibold tracking-tight">Scannen</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-lg ${showSettings ? theme.navActive : theme.textSecondary} hover:bg-slate-100`}
            title="Einstellungen"
          >
            <GearSix size={20} />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className={`${theme.panel} border ${theme.border} rounded-xl p-4 mb-4`}>
          <h3 className={`${theme.text} font-medium mb-3`}>Einstellungen</h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300"
              />
              <span className={`${theme.text} flex items-center gap-2`}>
                {soundEnabled ? <SpeakerHigh size={18} /> : <SpeakerSlash size={18} />}
                Ton bei Scan
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={vibrationEnabled}
                onChange={(e) => setVibrationEnabled(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300"
              />
              <span className={`${theme.text} flex items-center gap-2`}>
                <Vibrate size={18} />
                Vibration bei Scan
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={resetQuantityAfterScan}
                onChange={(e) => setResetQuantityAfterScan(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300"
              />
              <span className={`${theme.text}`}>
                Menge nach Scan auf 1 zurücksetzen
              </span>
            </label>
          </div>

          {/* Debug Info */}
          {debugInfo && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <h4 className={`${theme.textSecondary} text-sm font-medium mb-2`}>Debug (letzter Scan)</h4>
              <div className="bg-slate-100 rounded-lg p-3 font-mono text-xs space-y-1">
                <div className="break-all"><span className="text-slate-500">Raw ({debugInfo.rawLength}):</span> {debugInfo.rawCode}</div>
                <div><span className="text-slate-500">Type:</span> {debugInfo.codeType} | <span className="text-slate-500">Format:</span> {debugInfo.format}</div>
                <div><span className="text-slate-500">GTIN:</span> {debugInfo.gtin}</div>
                <div className="font-bold text-teal-700"><span className="text-slate-500">PZN:</span> {debugInfo.pzn} <span className="font-normal text-slate-400">({debugInfo.pznSource})</span></div>
                <div><span className="text-slate-500">Charge:</span> {debugInfo.batch}</div>
                <div><span className="text-slate-500">Verfall:</span> {debugInfo.expiry}</div>
                <div><span className="text-slate-500">S/N:</span> {debugInfo.serial}</div>
                <div className="border-t border-slate-300 pt-1 mt-1">
                  <span className="text-slate-500">DB-Treffer:</span>{' '}
                  <span className={debugInfo.dbFound === 'JA' ? 'text-green-600 font-bold' : 'text-red-500'}>{debugInfo.dbFound}</span>
                </div>
                {debugInfo.articleName !== '-' && (
                  <div className="text-green-700 font-semibold break-words">{debugInfo.articleName}</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Camera + Scan Area */}
      <div className={`${theme.panel} border ${theme.border} rounded-2xl overflow-hidden mb-4 relative`}>
        <ScannerCamera
          onScan={onCameraScan}
          enabled={!!currentSession.id}
          theme={theme}
        />

        {/* Scan Feedback Overlay */}
        {scanFeedback && (() => {
          const pharmaData = parseDataMatrixCode(scanFeedback.code)
          return (
            <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center pointer-events-none animate-pulse">
              <div className="bg-green-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg text-center max-w-[90%]">
                {/* Article name if available */}
                {lastScan?.articleName && (
                  <div className="text-sm font-medium mb-1 truncate">
                    {lastScan.articleName}
                  </div>
                )}
                <div className="flex items-center justify-center gap-2">
                  <Check size={24} weight="bold" />
                  <span>
                    {quantity > 1 ? `${quantity}x ` : ''}
                    {pharmaData ? `PZN ${pharmaData.pzn}` : formatCodeType(scanFeedback.codeType)}
                  </span>
                </div>
                {pharmaData && pharmaData.batch && (
                  <div className="text-sm font-normal mt-1 opacity-90">
                    Charge: {pharmaData.batch}
                  </div>
                )}
              </div>
            </div>
          )
        })()}
      </div>

      {/* Quantity Control */}
      <div className={`${theme.panel} border ${theme.border} rounded-xl p-4 mb-4`}>
        <div className="flex items-center justify-between">
          <span className={`${theme.textSecondary} font-medium`}>Menge pro Scan:</span>
          <div className="flex items-center gap-2">
            <button
              onClick={decrementQuantity}
              disabled={quantity <= 1}
              className={`p-2 rounded-lg ${
                quantity <= 1
                  ? 'text-slate-300 cursor-not-allowed bg-slate-50'
                  : `${theme.textSecondary} hover:bg-slate-100 border ${theme.border}`
              }`}
            >
              <Minus size={20} weight="bold" />
            </button>

            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className={`w-16 text-center font-semibold text-lg ${theme.text} border ${theme.border} rounded-lg py-1`}
              min="1"
            />

            <button
              onClick={incrementQuantity}
              className={`p-2 rounded-lg ${theme.textSecondary} hover:bg-slate-100 border ${theme.border}`}
            >
              <Plus size={20} weight="bold" />
            </button>
          </div>
        </div>
      </div>

      {/* Scan List */}
      <div className={`${theme.panel} border ${theme.border} rounded-2xl p-4 flex-1 overflow-hidden flex flex-col`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className={`${theme.text} font-semibold`}>Letzte Scans</h3>
          {lastScan && (
            <span className={`text-sm ${theme.textMuted}`}>
              Zuletzt: {lastScan.action === 'added' ? '+' : ''}{lastScan.quantity}x
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto -mx-4 px-4">
          <ScanList
            scans={scans}
            scansLoading={scansLoading}
            onDelete={deleteScan}
            onUpdateQuantity={updateScanQuantity}
            theme={theme}
          />
        </div>
      </div>

      {/* Footer / Session Info */}
      <div className={`${theme.panel} border ${theme.border} rounded-xl p-3 mt-4 flex items-center justify-between`}>
        <button
          onClick={() => setSessionModalOpen(true)}
          className={`${theme.text} font-medium hover:underline truncate flex-1 text-left`}
        >
          {currentSession.name || 'Session auswählen...'}
        </button>

        <div className="flex items-center gap-4">
          <div className={`${theme.textSecondary} text-sm`}>
            <span className="font-semibold">{totalItems}</span> Stück
            <span className="mx-1">|</span>
            <span className="font-semibold">{uniqueCodes}</span> Codes
          </div>

          <button
            onClick={exportSessionAsCsv}
            disabled={scans.length === 0}
            className={`p-2 rounded-lg ${
              scans.length === 0
                ? 'text-slate-300 cursor-not-allowed'
                : `${theme.accentText} hover:bg-amber-50`
            }`}
            title="Als CSV exportieren"
          >
            <Download size={20} />
          </button>
        </div>
      </div>

      {/* Session Modal */}
      <ScanSessionModal
        isOpen={sessionModalOpen}
        onClose={() => setSessionModalOpen(false)}
        sessions={sessions}
        sessionsLoading={sessionsLoading}
        currentSession={currentSession}
        onStartNew={startNewSession}
        onLoadSession={loadSession}
        onDeleteSession={deleteSession}
        onExport={exportSessionAsCsv}
        theme={theme}
      />
    </div>
  )
}

export default ScanView
