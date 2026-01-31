import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { contactKeys } from './queries'

/**
 * Fetch contacts from Supabase
 * @param {Object} options
 * @param {boolean} options.includeInactive - Include inactive contacts (default: false)
 */
async function fetchContacts({ includeInactive = false } = {}) {
  let query = supabase
    .from('contacts')
    .select('*')
    .order('company', { ascending: true })
    .order('last_name', { ascending: true })

  if (!includeInactive) {
    query = query.eq('status', 'aktiv')
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

/**
 * Hook für Contacts-Liste mit TanStack Query
 * Inkludiert Realtime-Subscription für Live-Updates
 *
 * @param {Object} options
 * @param {boolean} options.includeInactive - Include inactive contacts (default: false)
 */
export function useContactsQuery({ includeInactive = false } = {}) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: contactKeys.list({ includeInactive }),
    queryFn: () => fetchContacts({ includeInactive }),
    staleTime: 60_000, // 1 Minute
  })

  // Realtime Subscription für Live-Updates
  useEffect(() => {
    const channel = supabase
      .channel('contacts_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'contacts' }, () => {
        // Invalidate all contact lists to ensure consistency with filters
        queryClient.invalidateQueries({ queryKey: contactKeys.lists() })
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'contacts' }, () => {
        queryClient.invalidateQueries({ queryKey: contactKeys.lists() })
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'contacts' }, () => {
        queryClient.invalidateQueries({ queryKey: contactKeys.lists() })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])

  return query
}
