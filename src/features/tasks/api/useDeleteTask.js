import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabase'
import { taskKeys } from './queries'

/**
 * Delete task mutation
 */
async function deleteTask(taskId) {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)

  if (error) throw error
  return taskId
}

/**
 * Hook für Task-Löschung
 */
export function useDeleteTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteTask,
    onMutate: async (taskId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: taskKeys.lists() })

      // Snapshot previous value
      const previousTasks = queryClient.getQueryData(taskKeys.lists())

      // Optimistic update - Task sofort entfernen
      queryClient.setQueryData(taskKeys.lists(), (old) => {
        if (!old) return old
        return old.filter(t => t.id !== taskId)
      })

      return { previousTasks }
    },
    onError: (error, taskId, context) => {
      // Rollback on error
      if (context?.previousTasks) {
        queryClient.setQueryData(taskKeys.lists(), context.previousTasks)
      }
      console.error('Task deletion failed:', error.message)
    },
  })
}
