import { Suspense, useEffect } from 'react'
import { Outlet, useNavigate } from '@tanstack/react-router'
import { useAuth, useTheme, useNavigation, useStaff } from '../../context'
import { useFaxCounts } from '../fax'
import { LoadingSpinner } from '../../shared/ui'
import { lazyWithRetry } from '../../lib/lazyWithRetry'

const AuthView = lazyWithRetry(() => import('../auth/AuthView'))
const TokenDriverView = lazyWithRetry(() => import('../botendienst/TokenDriverView'))
const DashboardHeader = lazyWithRetry(() => import('./DashboardHeader'))
const SidebarNav = lazyWithRetry(() => import('./SidebarNav'))
const FloatingAiChat = lazyWithRetry(() => import('../../shared/ui/FloatingAiChat'))
const ContactScanManager = lazyWithRetry(() => import('../contacts/ContactScanManager'))

/**
 * Inner layout for authenticated users - renders the app shell
 * Separated so hooks are only called when user is authenticated
 */
function AuthenticatedShell() {
  const { theme } = useTheme()
  const { activeView, setActiveView, setSecondaryTab, setChatTab, botendienstTab } = useNavigation()
  const { currentStaff, staff } = useStaff()
  const { count: faxCount } = useFaxCounts()
  const navigate = useNavigate()

  // Document title mit Fax-Count
  useEffect(() => {
    if (faxCount > 0) {
      document.title = `(${faxCount}) Kaeee`
    } else {
      document.title = 'Kaeee'
    }
  }, [faxCount])

  // Cross-feature Navigation Events
  useEffect(() => {
    const handleNavigateToFax = () => {
      setActiveView('post')
      setSecondaryTab('fax')
      navigate({ to: '/post' })
    }
    window.addEventListener('navigate-to-fax', handleNavigateToFax)
    return () => window.removeEventListener('navigate-to-fax', handleNavigateToFax)
  }, [setActiveView, setSecondaryTab, navigate])

  useEffect(() => {
    const handleNavigateToChat = (event) => {
      const { chatType, chatId } = event.detail || {}
      setActiveView('chat')
      if (chatType === 'group') {
        setChatTab('group')
        navigate({ to: '/chat/group' })
      } else if (chatId) {
        setChatTab(chatId)
        navigate({ to: `/chat/dm/${chatId}` })
      }
    }
    window.addEventListener('navigate-to-chat', handleNavigateToChat)
    return () => window.removeEventListener('navigate-to-chat', handleNavigateToChat)
  }, [setActiveView, setChatTab, navigate])

  // Fahrermodus: Vollbild ohne Header und Sidebar
  const isDriverMode = activeView === 'botendienst' && botendienstTab === 'driver'

  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center"><LoadingSpinner message="App wird geladen..." /></div>}>
      <div className={`h-screen ${theme.bgApp} ${theme.textPrimary} flex flex-col relative overflow-hidden`}>
        {!isDriverMode && <DashboardHeader />}

        <div className="flex flex-1 overflow-hidden relative min-h-0">
          {!isDriverMode && <SidebarNav />}

          <main className={`flex-1 overflow-auto min-h-0 ${isDriverMode ? '' : 'p-4 lg:p-8'}`}>
            <Outlet />
          </main>
        </div>

        <ContactScanManager />

        {!isDriverMode && (
          <FloatingAiChat theme={theme} currentStaff={currentStaff} staff={staff} />
        )}
      </div>
    </Suspense>
  )
}

/**
 * AuthenticatedLayout - Root layout component
 * - Token driver access (no auth needed)
 * - Auth check (no session → AuthView)
 * - Renders AuthenticatedShell for logged-in users
 */
export default function AuthenticatedLayout() {
  const { session, authView } = useAuth()

  // Token-basierter Fahrer-Zugriff (keine Authentifizierung nötig)
  const pathMatch = typeof window !== 'undefined' && window.location.pathname.match(/^\/fahrer\/([a-f0-9-]{36})$/i)
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

  return <AuthenticatedShell />
}
