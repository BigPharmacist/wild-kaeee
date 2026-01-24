import { Component } from 'react'

/**
 * Error Boundary - Fängt JavaScript-Fehler in Child-Komponenten ab
 * und zeigt eine Fallback-UI anstatt die ganze App abstürzen zu lassen.
 *
 * Verwendung:
 * <ErrorBoundary>
 *   <MeineKomponente />
 * </ErrorBoundary>
 *
 * Mit eigenem Fallback:
 * <ErrorBoundary fallback={<MeinFallback />}>
 *   <MeineKomponente />
 * </ErrorBoundary>
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    // State aktualisieren, damit beim nächsten Render die Fallback-UI angezeigt wird
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    // Fehler loggen (hier könnte auch ein Error-Reporting-Service angebunden werden)
    console.error('ErrorBoundary hat einen Fehler gefangen:', error)
    console.error('Komponenten-Stack:', errorInfo.componentStack)

    this.setState({ errorInfo })

    // Optional: Fehler an externen Service senden
    // reportError(error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      // Benutzerdefinierter Fallback wenn vorhanden
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Standard Fallback-UI
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

            {process.env.NODE_ENV === 'development' && this.state.error && (
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
                onClick={() => window.location.reload()}
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
