import { Component, Suspense, lazy } from 'react'

// Lazy load der eigentlichen Karte
const CourierMapLazy = lazy(() => import('./CourierMap'))

// Error Boundary um Ladefehler abzufangen
class CourierMapErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      const { theme } = this.props
      return (
        <div className={`${theme.panel} rounded-2xl p-5 border ${theme.border} ${theme.cardShadow}`}>
          <div className="flex flex-col items-center justify-center h-[300px] text-center">
            <p className="text-rose-500 font-medium mb-2">Karte konnte nicht geladen werden</p>
            <p className={`text-sm ${theme.textMuted}`}>
              Leaflet/OpenStreetMap ist nicht erreichbar.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-[#4C8BF5] text-white rounded-lg text-sm hover:bg-[#3A74D8]"
            >
              Seite neu laden
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

const CourierMapWrapper = (props) => {
  const { theme } = props

  return (
    <CourierMapErrorBoundary theme={theme}>
      <Suspense
        fallback={
          <div className={`${theme.panel} rounded-2xl p-5 border ${theme.border} ${theme.cardShadow} flex items-center justify-center h-[400px]`}>
            <p className={theme.textMuted}>Karte wird geladen...</p>
          </div>
        }
      >
        <CourierMapLazy {...props} />
      </Suspense>
    </CourierMapErrorBoundary>
  )
}

export default CourierMapWrapper
