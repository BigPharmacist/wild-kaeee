import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabase'
import { calendarKeys } from './queries'

/**
 * Create calendar mutation
 */
export function useCreateCalendar() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ name, description, color, ownerId }) => {
      const { data, error } = await supabase
        .from('calendars')
        .insert({
          name: name.trim(),
          description: description?.trim() || '',
          color,
          owner_id: ownerId,
        })
        .select()
        .single()

      if (error) throw error

      // Add write permission for owner
      await supabase
        .from('calendar_permissions')
        .insert({
          calendar_id: data.id,
          user_id: ownerId,
          permission: 'write',
        })

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.lists() })
    },
  })
}

/**
 * Update calendar mutation
 */
export function useUpdateCalendar() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ calendarId, name, description, color }) => {
      const { data, error } = await supabase
        .from('calendars')
        .update({
          name: name.trim(),
          description: description?.trim() || '',
          color,
        })
        .eq('id', calendarId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.lists() })
    },
  })
}

/**
 * Delete calendar mutation
 */
export function useDeleteCalendar() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (calendarId) => {
      const { error } = await supabase
        .from('calendars')
        .delete()
        .eq('id', calendarId)

      if (error) throw error
      return calendarId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.lists() })
    },
  })
}

/**
 * Add calendar permission mutation
 */
export function useAddCalendarPermission() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ calendarId, userId, permission }) => {
      const { data, error } = await supabase
        .from('calendar_permissions')
        .upsert(
          {
            calendar_id: calendarId,
            user_id: userId,
            permission,
          },
          { onConflict: 'calendar_id,user_id' }
        )
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, { calendarId }) => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.permissions(calendarId) })
    },
  })
}

/**
 * Remove calendar permission mutation
 */
export function useRemoveCalendarPermission() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ permissionId }) => {
      const { error } = await supabase
        .from('calendar_permissions')
        .delete()
        .eq('id', permissionId)

      if (error) throw error
      return permissionId
    },
    onSuccess: (_, { calendarId }) => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.permissions(calendarId) })
    },
  })
}
