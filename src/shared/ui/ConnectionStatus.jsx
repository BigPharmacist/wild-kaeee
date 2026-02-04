import { useState, useEffect } from 'react'
import { WifiSlash, ArrowClockwise } from '@phosphor-icons/react'

/**
 * Zeigt einen Offline-Banner wenn keine Internetverbindung besteht
 */
export default function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      // Banner kurz anzeigen, dann ausblenden
      setTimeout(() => setShowBanner(false), 2000)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowBanner(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Initial-Status prüfen
    if (!navigator.onLine) {
      setShowBanner(true)
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!showBanner) return null

  return (
    <div
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 transition-all ${
        isOnline
          ? 'bg-green-600 text-white'
          : 'bg-red-600 text-white'
      }`}
    >
      {isOnline ? (
        <>
          <ArrowClockwise size={20} className="animate-spin" />
          <span className="font-medium">Verbindung wiederhergestellt</span>
        </>
      ) : (
        <>
          <WifiSlash size={20} />
          <span className="font-medium">Keine Internetverbindung</span>
          <button
            onClick={() => window.location.reload()}
            className="ml-2 px-2 py-1 bg-white/20 hover:bg-white/30 rounded text-sm"
          >
            Neu laden
          </button>
        </>
      )}
    </div>
  )
}
