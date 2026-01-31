import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabase'
import { eventKeys } from './queries'

/**
 * Parse event form data to database format
 */
function parseEventData(form) {
  const startTime = form.allDay
    ? new Date(form.startDate + 'T00:00:00')
    : new Date(form.startDate + 'T' + form.startTime)

  const endTime = form.allDay
    ? new Date(form.endDate + 'T23:59:59')
    : new Date(form.endDate + 'T' + form.endTime)

  return {
    title: form.title.trim(),
    description: form.description?.trim() || '',
    start_time: startTime.toISOString(),
    end_time: endTime.toISOString(),
    all_day: form.allDay,
    location: form.location?.trim() || '',
  }
}

/**
 * Create event mutation
 */
export function useCreateEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ calendarId, form }) => {
      const eventData = parseEventData(form)

      const { data, error } = await supabase
        .from('calendar_events')
        .insert({
          calendar_id: calendarId,
          ...eventData,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() })
      queryClient.invalidateQueries({ queryKey: eventKeys.dashboard() })
    },
  })
}

/**
 * Update event mutation
 */
export function useUpdateEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ eventId, form }) => {
      const eventData = parseEventData(form)

      const { data, error } = await supabase
        .from('calendar_events')
        .update(eventData)
        .eq('id', eventId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() })
      queryClient.invalidateQueries({ queryKey: eventKeys.dashboard() })
    },
  })
}

/**
 * Delete event mutation
 */
export function useDeleteEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (eventId) => {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', eventId)

      if (error) throw error
      return eventId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() })
      queryClient.invalidateQueries({ queryKey: eventKeys.dashboard() })
    },
  })
}
