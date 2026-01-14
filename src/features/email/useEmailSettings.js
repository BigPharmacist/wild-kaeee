import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function useEmailSettings({ sessionUserId }) {
  const [emailAccounts, setEmailAccounts] = useState([])
  const [emailAccountsLoading, setEmailAccountsLoading] = useState(false)
  const [emailPermissions, setEmailPermissions] = useState([])
  const [currentUserEmailAccess, setCurrentUserEmailAccess] = useState(false)
  const [editingEmailAccount, setEditingEmailAccount] = useState(null)
  const [emailAccountForm, setEmailAccountForm] = useState({
    name: '',
    email: '',
    password: '',
  })
  const [emailAccountSaving, setEmailAccountSaving] = useState(false)
  const [emailAccountMessage, setEmailAccountMessage] = useState('')
  const [selectedEmailAccount, setSelectedEmailAccount] = useState(null)

  useEffect(() => {
    if (sessionUserId) return
    setEmailAccounts([])
    setEmailPermissions([])
    setCurrentUserEmailAccess(false)
    setSelectedEmailAccount(null)
    setEditingEmailAccount(null)
    setEmailAccountForm({ name: '', email: '', password: '' })
    setEmailAccountMessage('')
  }, [sessionUserId])

  const fetchEmailAccounts = useCallback(async () => {
    if (!sessionUserId) return
    setEmailAccountsLoading(true)
    const { data, error } = await supabase
      .from('email_accounts')
      .select('id, name, email, password')
      .order('name', { ascending: true })

    if (error) {
      console.error('Fehler beim Laden der E-Mail-Accounts:', error.message)
      setEmailAccounts([])
    } else {
      setEmailAccounts(data || [])
      setSelectedEmailAccount(prev => prev ?? data?.[0]?.id ?? null)
    }
    setEmailAccountsLoading(false)
  }, [sessionUserId])

  const openEmailAccountModal = useCallback((account = null) => {
    if (account) {
      setEditingEmailAccount(account.id)
      setEmailAccountForm({
        name: account.name || '',
        email: account.email || '',
        password: account.password || '',
      })
    } else {
      setEditingEmailAccount('new')
      setEmailAccountForm({
        name: '',
        email: '',
        password: '',
      })
    }
    setEmailAccountMessage('')
  }, [])

  const closeEmailAccountModal = useCallback(() => {
    setEditingEmailAccount(null)
    setEmailAccountForm({ name: '', email: '', password: '' })
    setEmailAccountMessage('')
  }, [])

  const handleSaveEmailAccount = useCallback(async () => {
    if (!emailAccountForm.email || !emailAccountForm.password) {
      setEmailAccountMessage('E-Mail und Passwort sind erforderlich')
      return
    }

    setEmailAccountSaving(true)
    setEmailAccountMessage('')

    // Test der Verbindung über Proxy
    const jmapBaseUrl = import.meta.env.VITE_JMAP_URL || ''
    try {
      const credentials = btoa(`${emailAccountForm.email}:${emailAccountForm.password}`)
      const response = await fetch(`${jmapBaseUrl}/jmap/session`, {
        headers: { 'Authorization': `Basic ${credentials}` }
      })

      if (!response.ok) {
        throw new Error('Authentifizierung fehlgeschlagen - bitte Zugangsdaten prüfen')
      }

      // Verbindung erfolgreich - Account in Supabase speichern (global für alle)
      const accountData = {
        name: emailAccountForm.name || emailAccountForm.email.split('@')[0],
        email: emailAccountForm.email,
        password: emailAccountForm.password,
      }

      let savedAccount
      if (editingEmailAccount === 'new') {
        const { data, error } = await supabase
          .from('email_accounts')
          .insert(accountData)
          .select()
          .single()
        if (error) throw new Error(error.message)
        savedAccount = data
      } else {
        const { data, error } = await supabase
          .from('email_accounts')
          .update(accountData)
          .eq('id', editingEmailAccount)
          .select()
          .single()
        if (error) throw new Error(error.message)
        savedAccount = data
      }

      await fetchEmailAccounts()
      setSelectedEmailAccount(prev => prev ?? savedAccount.id)
      closeEmailAccountModal()
    } catch (err) {
      setEmailAccountMessage(err.message || 'Verbindung fehlgeschlagen')
    } finally {
      setEmailAccountSaving(false)
    }
  }, [
    closeEmailAccountModal,
    editingEmailAccount,
    emailAccountForm.email,
    emailAccountForm.name,
    emailAccountForm.password,
    fetchEmailAccounts,
  ])

  const handleDeleteEmailAccount = useCallback(async (accountId) => {
    const { error } = await supabase
      .from('email_accounts')
      .delete()
      .eq('id', accountId)

    if (error) {
      console.error('Fehler beim Löschen:', error.message)
      return
    }

    if (selectedEmailAccount === accountId) {
      setSelectedEmailAccount(null)
    }

    await fetchEmailAccounts()
  }, [fetchEmailAccounts, selectedEmailAccount])

  const handleSelectEmailAccount = useCallback((accountId) => {
    setSelectedEmailAccount(accountId)
  }, [])

  const fetchEmailPermissions = useCallback(async () => {
    const { data, error } = await supabase
      .from('email_permissions')
      .select('*')

    if (!error && data) {
      setEmailPermissions(data)
      const currentUserPermission = data.find(p => p.user_id === sessionUserId)
      setCurrentUserEmailAccess(currentUserPermission?.has_access || false)
    }
  }, [sessionUserId])

  const toggleEmailPermission = useCallback(async (userId, currentAccess) => {
    const existing = emailPermissions.find(p => p.user_id === userId)

    if (existing) {
      const { error } = await supabase
        .from('email_permissions')
        .update({ has_access: !currentAccess, updated_at: new Date().toISOString() })
        .eq('user_id', userId)

      if (!error) {
        await fetchEmailPermissions()
      }
    } else {
      const { error } = await supabase
        .from('email_permissions')
        .insert({ user_id: userId, has_access: true })

      if (!error) {
        await fetchEmailPermissions()
      }
    }
  }, [emailPermissions, fetchEmailPermissions])

  return {
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
  }
}
