import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabase'
import { emailKeys } from './queries'

/**
 * Fetch email accounts from Supabase
 */
async function fetchEmailAccounts() {
  const { data, error } = await supabase
    .from('email_accounts')
    .select('id, name, email, password, signature')
    .order('name', { ascending: true })

  if (error) throw error
  return data || []
}

/**
 * Fetch email permissions from Supabase
 */
async function fetchEmailPermissions() {
  const { data, error } = await supabase
    .from('email_permissions')
    .select('*')

  if (error) throw error
  return data || []
}

/**
 * Fetch AI settings from Supabase
 */
async function fetchAiSettings() {
  const { data, error } = await supabase
    .from('ai_settings')
    .select('*')
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows

  return data || {
    api_key: '',
    model: 'Qwen/Qwen3-235B-A22B-Instruct-2507',
    system_prompt: 'Du bist ein professioneller E-Mail-Assistent. Schreibe höfliche, klare und professionelle E-Mails auf Deutsch. Verwende eine angemessene Anrede und Grußformel. Halte den Text prägnant aber freundlich.',
  }
}

/**
 * Test JMAP connection
 */
async function testJmapConnection(email, password) {
  const jmapBaseUrl = import.meta.env.VITE_JMAP_URL || ''
  const credentials = btoa(`${email}:${password}`)
  const response = await fetch(`${jmapBaseUrl}/jmap/session`, {
    headers: { 'Authorization': `Basic ${credentials}` }
  })

  if (!response.ok) {
    throw new Error('Authentifizierung fehlgeschlagen - bitte Zugangsdaten prüfen')
  }

  return true
}

/**
 * Save email account to Supabase
 */
async function saveEmailAccount({ accountId, accountData }) {
  // First test JMAP connection
  await testJmapConnection(accountData.email, accountData.password)

  if (accountId === 'new') {
    const { data, error } = await supabase
      .from('email_accounts')
      .insert(accountData)
      .select()
      .single()
    if (error) throw error
    return data
  } else {
    const { data, error } = await supabase
      .from('email_accounts')
      .update(accountData)
      .eq('id', accountId)
      .select()
      .single()
    if (error) throw error
    return data
  }
}

/**
 * Delete email account from Supabase
 */
async function deleteEmailAccount(accountId) {
  const { error } = await supabase
    .from('email_accounts')
    .delete()
    .eq('id', accountId)

  if (error) throw error
  return accountId
}

/**
 * Toggle email permission for a user
 */
async function toggleEmailPermission({ userId, currentAccess, existingPermissions }) {
  const existing = existingPermissions.find(p => p.user_id === userId)

  if (existing) {
    const { error } = await supabase
      .from('email_permissions')
      .update({ has_access: !currentAccess, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
    if (error) throw error
  } else {
    const { error } = await supabase
      .from('email_permissions')
      .insert({ user_id: userId, has_access: true })
    if (error) throw error
  }

  return { userId, newAccess: !currentAccess }
}

/**
 * Save AI settings to Supabase
 */
async function saveAiSettings(settings) {
  const { data: existing } = await supabase
    .from('ai_settings')
    .select('id')
    .limit(1)
    .single()

  if (existing) {
    const { error } = await supabase
      .from('ai_settings')
      .update({
        api_key: settings.api_key,
        model: settings.model,
        system_prompt: settings.system_prompt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
    if (error) throw error
  } else {
    const { error } = await supabase
      .from('ai_settings')
      .insert({
        api_key: settings.api_key,
        model: settings.model,
        system_prompt: settings.system_prompt,
      })
    if (error) throw error
  }

  return settings
}

// ========== Query Hooks ==========

/**
 * Hook für Email-Accounts mit TanStack Query
 */
export function useEmailAccountsQuery({ enabled = true } = {}) {
  return useQuery({
    queryKey: emailKeys.accounts(),
    queryFn: fetchEmailAccounts,
    enabled,
    staleTime: 60_000, // 1 minute
  })
}

/**
 * Hook für Email-Permissions mit TanStack Query
 */
export function useEmailPermissionsQuery({ userId, enabled = true } = {}) {
  const query = useQuery({
    queryKey: emailKeys.permissions(),
    queryFn: fetchEmailPermissions,
    enabled,
    staleTime: 60_000, // 1 minute
  })

  // Derive current user access
  const currentUserEmailAccess = query.data?.find(p => p.user_id === userId)?.has_access || false

  return {
    ...query,
    permissions: query.data || [],
    currentUserEmailAccess,
  }
}

/**
 * Hook für AI-Settings mit TanStack Query
 */
export function useAiSettingsQuery({ enabled = true } = {}) {
  return useQuery({
    queryKey: emailKeys.aiSettings(),
    queryFn: fetchAiSettings,
    enabled,
    staleTime: 5 * 60_000, // 5 minutes
  })
}

// ========== Mutation Hooks ==========

/**
 * Hook für Email-Account speichern
 */
export function useSaveEmailAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: saveEmailAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: emailKeys.accounts() })
    },
  })
}

/**
 * Hook für Email-Account löschen
 */
export function useDeleteEmailAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteEmailAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: emailKeys.accounts() })
    },
  })
}

/**
 * Hook für Email-Permission togglen
 */
export function useToggleEmailPermission() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: toggleEmailPermission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: emailKeys.permissions() })
    },
  })
}

/**
 * Hook für AI-Settings speichern
 */
export function useSaveAiSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: saveAiSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: emailKeys.aiSettings() })
    },
  })
}
