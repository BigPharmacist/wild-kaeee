import { createContext, useContext, useEffect, useMemo } from 'react'
import useEmailSettings from '../features/email/useEmailSettings'
import { useEmailUnreadCount } from '../features/email'
import { useAuth } from './AuthContext'

const EmailContext = createContext(null)

export function EmailProvider({ children }) {
  const { session } = useAuth()
  const sessionUserId = session?.user?.id

  const {
    emailAccounts,
    emailAccountsLoading,
    emailPermissions,
    currentUserEmailAccess,
    editingEmailAccount,
    emailAccountForm,
    emailAccountSaving,
    emailAccountMessage,
    selectedEmailAccount,
    setEmailAccountForm,
    fetchEmailAccounts,
    fetchEmailPermissions,
    openEmailAccountModal,
    closeEmailAccountModal,
    handleSaveEmailAccount,
    handleDeleteEmailAccount,
    handleSelectEmailAccount,
    toggleEmailPermission,
    // KI-Assistent
    aiSettings,
    setAiSettings,
    aiSettingsLoading,
    aiSettingsSaving,
    aiSettingsMessage,
    fetchAiSettings,
    saveAiSettings,
  } = useEmailSettings({ sessionUserId })

  // Selected Account Objekt für UnreadCount
  const selectedEmailAccountObj = useMemo(
    () => emailAccounts.find(a => a.id === selectedEmailAccount),
    [emailAccounts, selectedEmailAccount]
  )

  const {
    unreadCount: emailUnreadCount,
    markAsRead: markEmailAsRead,
    refresh: refreshEmailCount,
  } = useEmailUnreadCount({ account: selectedEmailAccountObj })

  // Email-Daten laden wenn Session vorhanden
  useEffect(() => {
    if (session) {
      fetchEmailAccounts()
      fetchEmailPermissions()
      fetchAiSettings()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  const value = useMemo(() => ({
    // Accounts
    emailAccounts,
    emailAccountsLoading,
    emailPermissions,
    currentUserEmailAccess,
    editingEmailAccount,
    emailAccountForm,
    emailAccountSaving,
    emailAccountMessage,
    selectedEmailAccount,
    selectedEmailAccountObj,
    setEmailAccountForm,
    fetchEmailAccounts,
    fetchEmailPermissions,
    openEmailAccountModal,
    closeEmailAccountModal,
    handleSaveEmailAccount,
    handleDeleteEmailAccount,
    handleSelectEmailAccount,
    toggleEmailPermission,
    // Unread Count
    emailUnreadCount,
    markEmailAsRead,
    refreshEmailCount,
    // KI-Assistent
    aiSettings,
    setAiSettings,
    aiSettingsLoading,
    aiSettingsSaving,
    aiSettingsMessage,
    fetchAiSettings,
    saveAiSettings,
  }), [
    emailAccounts,
    emailAccountsLoading,
    emailPermissions,
    currentUserEmailAccess,
    editingEmailAccount,
    emailAccountForm,
    emailAccountSaving,
    emailAccountMessage,
    selectedEmailAccount,
    selectedEmailAccountObj,
    setEmailAccountForm,
    fetchEmailAccounts,
    fetchEmailPermissions,
    openEmailAccountModal,
    closeEmailAccountModal,
    handleSaveEmailAccount,
    handleDeleteEmailAccount,
    handleSelectEmailAccount,
    toggleEmailPermission,
    emailUnreadCount,
    markEmailAsRead,
    refreshEmailCount,
    aiSettings,
    setAiSettings,
    aiSettingsLoading,
    aiSettingsSaving,
    aiSettingsMessage,
    fetchAiSettings,
    saveAiSettings,
  ])

  return (
    <EmailContext.Provider value={value}>
      {children}
    </EmailContext.Provider>
  )
}

export function useEmail() {
  const context = useContext(EmailContext)
  if (!context) {
    throw new Error('useEmail must be used within EmailProvider')
  }
  return context
}
