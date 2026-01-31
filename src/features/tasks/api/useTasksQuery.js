import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { taskKeys } from './queries'

/**
 * Fetch tasks from Supabase
 */
async function fetchTasks() {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Hook für Tasks-Liste mit TanStack Query
 * Inkludiert Realtime-Subscription für Live-Updates
 */
export function useTasksQuery() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: taskKeys.lists(),
    queryFn: fetchTasks,
    staleTime: 30_000,
  })

  // Realtime Subscription für Live-Updates
  useEffect(() => {
    const channel = supabase
      .channel('tasks_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tasks' }, (payload) => {
        queryClient.setQueryData(taskKeys.lists(), (old) => {
          if (!old) return [payload.new]
          // Prevent duplicates
          if (old.some(t => t.id === payload.new.id)) return old
          return [payload.new, ...old]
        })
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tasks' }, (payload) => {
        queryClient.setQueryData(taskKeys.lists(), (old) => {
          if (!old) return old
          return old.map(t => t.id === payload.new.id ? payload.new : t)
        })
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'tasks' }, (payload) => {
        queryClient.setQueryData(taskKeys.lists(), (old) => {
          if (!old) return old
          return old.filter(t => t.id !== payload.old.id)
        })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])

  return query
}
