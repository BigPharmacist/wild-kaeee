import { useEffect, useRef, useState, useCallback } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

const ScannerCamera = ({ onScan, enabled = true, theme }) => {
  const scannerRef = useRef(null)
  const html5QrCodeRef = useRef(null)
  const [error, setError] = useState(null)
  const [isScanning, setIsScanning] = useState(false)
  const lastScannedRef = useRef({ code: null, time: 0 })

  // Debounce same code (3 seconds minimum between same codes)
  const handleDecode = useCallback((decodedText, decodedResult) => {
    const now = Date.now()
    const last = lastScannedRef.current

    // Allow same code again after 3 seconds to prevent accidental multiple scans
    if (last.code === decodedText && now - last.time < 3000) {
      return
    }

    lastScannedRef.current = { code: decodedText, time: now }

    const format = decodedResult?.result?.format?.formatName || 'UNKNOWN'
    onScan?.(decodedText, format)
  }, [onScan])

  // Optimiere Kamera für Nahbereich nachdem sie gestartet ist
  const optimizeForCloseRange = useCallback(async () => {
    try {
      // Finde das Video-Element im Scanner
      const videoElement = document.querySelector('#html5-qrcode-scanner video')
      if (!videoElement || !videoElement.srcObject) return

      const stream = videoElement.srcObject
      const videoTrack = stream.getVideoTracks()[0]
      if (!videoTrack) return

      const capabilities = videoTrack.getCapabilities()
      const settings = videoTrack.getSettings()

      console.log('Kamera-Fähigkeiten:', capabilities)
      console.log('Aktuelle Einstellungen:', settings)

      const newConstraints = {}

      // Kontinuierlicher Autofokus wenn unterstützt
      if (capabilities.focusMode && capabilities.focusMode.includes('continuous')) {
        newConstraints.focusMode = 'continuous'
      }

      // Fokus-Distanz auf Nahbereich wenn unterstützt
      // focusDistance: 0 = nah, höhere Werte = weiter weg
      if (capabilities.focusDistance) {
        const minDistance = capabilities.focusDistance.min || 0
        // Setze auf minimale Distanz + kleiner Puffer für Nahbereich
        newConstraints.focusDistance = Math.min(minDistance + 0.05, 0.15)
      }

      // Zoom leicht erhöhen wenn unterstützt (hilft bei kleinen Codes)
      if (capabilities.zoom && capabilities.zoom.min < capabilities.zoom.max) {
        // Leichter Zoom, nicht zu viel
        const zoomRange = capabilities.zoom.max - capabilities.zoom.min
        newConstraints.zoom = capabilities.zoom.min + (zoomRange * 0.2)
      }

      if (Object.keys(newConstraints).length > 0) {
        console.log('Wende Nahbereich-Optimierungen an:', newConstraints)
        await videoTrack.applyConstraints({ advanced: [newConstraints] })
      }
    } catch (err) {
      console.log('Nahbereich-Optimierung nicht unterstützt:', err.message)
    }
  }, [])

  useEffect(() => {
    if (!enabled || !scannerRef.current) return

    const elementId = 'html5-qrcode-scanner'
    let html5QrCode = null

    const startScanner = async () => {
      try {
        html5QrCode = new Html5Qrcode(elementId)
        html5QrCodeRef.current = html5QrCode

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          disableFlip: false,
          // Support all common formats
          formatsToSupport: [
            0,  // QR_CODE
            1,  // AZTEC
            2,  // CODABAR
            3,  // CODE_39
            4,  // CODE_93
            5,  // CODE_128
            6,  // DATA_MATRIX
            7,  // MAXICODE
            8,  // ITF
            9,  // EAN_13
            10, // EAN_8
            11, // PDF_417
            12, // RSS_14
            13, // RSS_EXPANDED
            14, // UPC_A
            15, // UPC_E
            16, // UPC_EAN_EXTENSION
          ],
        }

        // html5-qrcode erwartet nur facingMode als Objekt
        await html5QrCode.start(
          { facingMode: 'environment' },
          config,
          handleDecode,
          () => {} // Ignore failed scans
        )

        setIsScanning(true)
        setError(null)

        // Nach kurzem Delay Nahbereich-Optimierungen anwenden
        setTimeout(() => {
          optimizeForCloseRange()
        }, 500)

      } catch (err) {
        console.error('Scanner konnte nicht gestartet werden:', err)
        setError(err.message || 'Kamera konnte nicht gestartet werden')
        setIsScanning(false)
      }
    }

    startScanner()

    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {})
        html5QrCodeRef.current = null
      }
      setIsScanning(false)
    }
  }, [enabled, handleDecode, optimizeForCloseRange])

  // Request camera permission
  const requestPermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      setError(null)
      // Force re-render to restart scanner
      window.location.reload()
    } catch {
      setError('Kamera-Berechtigung wurde verweigert')
    }
  }

  if (error) {
    return (
      <div className={`${theme.panel} rounded-2xl p-6 border ${theme.border} text-center`}>
        <div className="text-red-500 mb-4">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="font-medium">Kamera-Fehler</p>
        </div>
        <p className={`${theme.textSecondary} mb-4 text-sm`}>{error}</p>
        <button
          onClick={requestPermission}
          className={`${theme.accent} text-white px-4 py-2 rounded-lg font-medium`}
        >
          Berechtigung erteilen
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <div
        id="html5-qrcode-scanner"
        ref={scannerRef}
        className="w-full rounded-xl overflow-hidden bg-black"
        style={{ minHeight: '300px' }}
      />

      {/* Scanning indicator */}
      {isScanning && (
        <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/60 text-white px-3 py-1.5 rounded-full text-sm">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          Scanne...
        </div>
      )}

      {/* Scan frame overlay */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-64 h-64 border-2 border-white/30 rounded-lg">
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-red-500 rounded-tl-lg" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-red-500 rounded-tr-lg" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-red-500 rounded-bl-lg" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-red-500 rounded-br-lg" />
        </div>
      </div>
    </div>
  )
}

export default ScannerCamera
