import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

// Verfügbare KI-Modelle für Nebius Token Factory (sortiert nach Größe)
export const AI_MODELS = [
  { id: 'deepseek-ai/DeepSeek-V3-0324', name: 'DeepSeek V3 (671B)', provider: 'DeepSeek' },
  { id: 'Qwen/Qwen3-Coder-480B-A35B-Instruct', name: 'Qwen 3 Coder (480B)', provider: 'Qwen' },
  { id: 'NousResearch/Hermes-4-405B', name: 'Hermes 4 (405B)', provider: 'NousResearch' },
  { id: 'nvidia/Llama-3_1-Nemotron-Ultra-253B-v1', name: 'Nemotron Ultra (253B)', provider: 'NVIDIA' },
  { id: 'Qwen/Qwen3-235B-A22B-Instruct-2507', name: 'Qwen 3 (235B)', provider: 'Qwen' },
  { id: 'meta-llama/Llama-3.3-70B-Instruct', name: 'Llama 3.3 (70B)', provider: 'Meta' },
]

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
    signature: '',
  })
  const [emailAccountSaving, setEmailAccountSaving] = useState(false)
  const [emailAccountMessage, setEmailAccountMessage] = useState('')
  const [selectedEmailAccount, setSelectedEmailAccount] = useState(null)

  // KI-Assistent Einstellungen
  const [aiSettings, setAiSettings] = useState({
    api_key: '',
    model: 'Qwen/Qwen3-235B-A22B-Instruct-2507',
    system_prompt: 'Du bist ein professioneller E-Mail-Assistent. Schreibe höfliche, klare und professionelle E-Mails auf Deutsch. Verwende eine angemessene Anrede und Grußformel. Halte den Text prägnant aber freundlich.',
  })
  const [aiSettingsLoading, setAiSettingsLoading] = useState(false)
  const [aiSettingsSaving, setAiSettingsSaving] = useState(false)
  const [aiSettingsMessage, setAiSettingsMessage] = useState('')

  useEffect(() => {
    if (sessionUserId) return
    setEmailAccounts([])
    setEmailPermissions([])
    setCurrentUserEmailAccess(false)
    setSelectedEmailAccount(null)
    setEditingEmailAccount(null)
    setEmailAccountForm({ name: '', email: '', password: '', signature: '' })
    setEmailAccountMessage('')
  }, [sessionUserId])

  const fetchEmailAccounts = useCallback(async () => {
    if (!sessionUserId) return
    setEmailAccountsLoading(true)
    const { data, error } = await supabase
      .from('email_accounts')
      .select('id, name, email, password, signature')
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
        signature: account.signature || '',
      })
    } else {
      setEditingEmailAccount('new')
      setEmailAccountForm({
        name: '',
        email: '',
        password: '',
        signature: '',
      })
    }
    setEmailAccountMessage('')
  }, [])

  const closeEmailAccountModal = useCallback(() => {
    setEditingEmailAccount(null)
    setEmailAccountForm({ name: '', email: '', password: '', signature: '' })
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
        signature: emailAccountForm.signature || '',
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
    emailAccountForm.signature,
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

  // KI-Einstellungen laden
  const fetchAiSettings = useCallback(async () => {
    if (!sessionUserId) return
    setAiSettingsLoading(true)
    const { data, error } = await supabase
      .from('ai_settings')
      .select('*')
      .limit(1)
      .single()

    if (!error && data) {
      setAiSettings({
        api_key: data.api_key || '',
        model: data.model || 'Qwen/Qwen2.5-72B-Instruct',
        system_prompt: data.system_prompt || '',
      })
    }
    setAiSettingsLoading(false)
  }, [sessionUserId])

  // KI-Einstellungen speichern
  const saveAiSettings = useCallback(async () => {
    setAiSettingsSaving(true)
    setAiSettingsMessage('')

    try {
      // Erst prüfen ob bereits ein Eintrag existiert
      const { data: existing } = await supabase
        .from('ai_settings')
        .select('id')
        .limit(1)
        .single()

      if (existing) {
        const { error } = await supabase
          .from('ai_settings')
          .update({
            api_key: aiSettings.api_key,
            model: aiSettings.model,
            system_prompt: aiSettings.system_prompt,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('ai_settings')
          .insert({
            api_key: aiSettings.api_key,
            model: aiSettings.model,
            system_prompt: aiSettings.system_prompt,
          })

        if (error) throw error
      }

      setAiSettingsMessage('Einstellungen gespeichert')
      setTimeout(() => setAiSettingsMessage(''), 3000)
    } catch (err) {
      setAiSettingsMessage('Fehler beim Speichern: ' + err.message)
    } finally {
      setAiSettingsSaving(false)
    }
  }, [aiSettings])

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
    // KI-Assistent
    aiSettings,
    setAiSettings,
    aiSettingsLoading,
    aiSettingsSaving,
    aiSettingsMessage,
    fetchAiSettings,
    saveAiSettings,
  }
}
