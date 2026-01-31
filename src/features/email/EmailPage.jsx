import { useMemo, useCallback } from 'react'
import { useTheme, useAuth } from '../../context'
import {
  useEmailAccountsQuery,
  useEmailPermissionsQuery,
  useAiSettingsQuery,
} from './api'
import EmailView from './EmailView'
import { LoadingSpinner } from '../../shared/ui'

/**
 * EmailPage - Wrapper-Komponente die TanStack Query Hooks verwendet
 * Wird für die /email Route und als eigenständige Komponente verwendet
 */
export default function EmailPage({ accountId: propAccountId }) {
  const { theme } = useTheme()
  const { session } = useAuth()
  const userId = session?.user?.id

  // TanStack Query Hooks
  const {
    data: emailAccounts = [],
    isLoading: accountsLoading,
  } = useEmailAccountsQuery({ enabled: !!userId })

  const {
    currentUserEmailAccess,
  } = useEmailPermissionsQuery({ userId, enabled: !!userId })

  const {
    data: aiSettings,
  } = useAiSettingsQuery({ enabled: !!userId })

  // Determine selected account
  const selectedAccountId = propAccountId ?? emailAccounts[0]?.id ?? null

  // Find the selected account object
  const selectedAccount = useMemo(() => {
    return emailAccounts.find(a => a.id === selectedAccountId) || null
  }, [emailAccounts, selectedAccountId])

  // Navigate to settings (for configure button)
  const handleConfigureClick = useCallback(() => {
    // Dispatch navigation event to open email settings
    window.dispatchEvent(new CustomEvent('navigate-to-settings', { detail: { tab: 'email' } }))
  }, [])

  // Show loading while accounts are loading
  if (accountsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <EmailView
      theme={theme}
      account={selectedAccount}
      hasAccess={currentUserEmailAccess}
      onConfigureClick={handleConfigureClick}
      aiSettings={aiSettings}
    />
  )
}
