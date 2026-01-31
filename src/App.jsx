import { Suspense, lazy } from 'react'
import { useAuth } from './context'
import { LoadingSpinner } from './shared/ui'

const AuthView = lazy(() => import('./features/auth/AuthView'))
const DashboardLayout = lazy(() => import('./features/dashboard/DashboardLayout'))
const TokenDriverView = lazy(() => import('./features/botendienst/TokenDriverView'))

/**
 * Main App component - minimal router
 * All logic has been moved to DashboardLayout and feature modules
 */
function App() {
  const { session, authView } = useAuth()

  // Token-basierter Fahrer-Zugriff (keine Authentifizierung nötig)
  const pathMatch = window.location.pathname.match(/^\/fahrer\/([a-f0-9-]{36})$/i)
  if (pathMatch) {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <TokenDriverView token={pathMatch[1]} />
      </Suspense>
    )
  }

  // Password Reset View
  if (authView === 'resetPassword') {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <AuthView />
      </Suspense>
    )
  }

  // Nicht authentifiziert - Login anzeigen
  if (!session) {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <AuthView />
      </Suspense>
    )
  }

  // Authentifiziert - Dashboard anzeigen
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <DashboardLayout />
    </Suspense>
  )
}

export default App
