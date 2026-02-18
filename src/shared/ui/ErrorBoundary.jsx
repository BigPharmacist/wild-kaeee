import { Component } from 'react'

/**
 * Error Boundary - Fängt JavaScript-Fehler in Child-Komponenten ab
 * und zeigt eine Fallback-UI anstatt die ganze App abstürzen zu lassen.
 *
 * Features:
 * - Erkennt Chunk-Load-Fehler und bietet automatischen Retry
 * - Zeigt benutzerfreundliche Fehlermeldungen
 * - Unterstützt benutzerdefinierte Fallback-UI
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null, isChunkError: false }
  }

  static getDerivedStateFromError(error) {
    // Prüfen ob es ein Chunk-Load-Fehler ist (lazy import fehlgeschlagen)
    const isChunkError = error?.name === 'ChunkLoadError' ||
      error?.message?.includes('Loading chunk') ||
      error?.message?.includes('Failed to fetch dynamically imported module') ||
      error?.message?.includes('Unable to preload CSS') ||
      error?.message?.includes('is not a valid JavaScript MIME type')

    return { hasError: true, error, isChunkError }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary hat einen Fehler gefangen:', error)
    console.error('Komponenten-Stack:', errorInfo.componentStack)
    this.setState({ errorInfo })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, isChunkError: false })
  }

  handleReload = () => {
    // Bei Chunk-Fehlern: Cache leeren und neu laden
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name))
      })
    }
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      // Benutzerdefinierter Fallback wenn vorhanden
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Spezielle UI für Chunk-Load-Fehler (Netzwerkprobleme)
      if (this.state.isChunkError) {
        return (
          <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-lg max-w-lg w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-[#1E293B]">
                  Verbindungsproblem
                </h2>
              </div>

              <p className="text-[#64748B] mb-4">
                Ein Teil der App konnte nicht geladen werden. Möglicherweise gibt es ein Netzwerkproblem oder die App wurde aktualisiert.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={this.handleReload}
                  className="flex-1 px-4 py-2.5 bg-[#F59E0B] hover:bg-[#D97706] text-white font-medium rounded-lg transition-colors"
                >
                  App neu laden
                </button>
              </div>
            </div>
          </div>
        )
      }

      // Standard Fallback-UI für andere Fehler
      return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-lg w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-[#1E293B]">
                Etwas ist schiefgelaufen
              </h2>
            </div>

            <p className="text-[#64748B] mb-4">
              Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut oder lade die Seite neu.
            </p>

            {import.meta.env.DEV && this.state.error && (
              <details className="mb-4">
                <summary className="text-sm text-[#94A3B8] cursor-pointer hover:text-[#64748B]">
                  Technische Details anzeigen
                </summary>
                <pre className="mt-2 p-3 bg-[#F8FAFC] rounded-lg text-xs text-red-600 overflow-auto max-h-40">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 px-4 py-2.5 bg-[#F59E0B] hover:bg-[#D97706] text-white font-medium rounded-lg transition-colors"
              >
                Erneut versuchen
              </button>
              <button
                onClick={this.handleReload}
                className="flex-1 px-4 py-2.5 bg-[#E2E8F0] hover:bg-[#CBD5E1] text-[#1E293B] font-medium rounded-lg transition-colors"
              >
                Seite neu laden
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
