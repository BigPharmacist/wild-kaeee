import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabase'
import { taskKeys } from './queries'

/**
 * Update task mutation
 */
async function updateTask({ taskId, updates }) {
  const { data, error } = await supabase
    .from('tasks')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Hook für Task-Updates
 */
export function useUpdateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateTask,
    onMutate: async ({ taskId, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: taskKeys.lists() })

      // Snapshot previous value
      const previousTasks = queryClient.getQueryData(taskKeys.lists())

      // Optimistic update
      queryClient.setQueryData(taskKeys.lists(), (old) => {
        if (!old) return old
        return old.map(t => t.id === taskId ? { ...t, ...updates } : t)
      })

      return { previousTasks }
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousTasks) {
        queryClient.setQueryData(taskKeys.lists(), context.previousTasks)
      }
      console.error('Task update failed:', error.message)
    },
  })
}

/**
 * Hook für Task-Completion (mit Recurring-Task-Logik)
 */
export function useCompleteTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ task, note, completedBy }) => {
      // Handle recurrence: if completing a recurring task, create next occurrence
      if (task.recurrence && task.due_date) {
        const currentDue = new Date(task.due_date)
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        // For strict recurrence (+), calculate from today; otherwise from due date
        const isStrict = task.recurrence.startsWith('+')
        const baseDate = isStrict ? today : currentDue
        let nextDue = new Date(baseDate)

        // Parse sleek format: [+]<count><interval> (e.g., "1d", "+2w", "1m")
        const recMatch = task.recurrence.match(/^\+?(\d+)([dbwmy])$/)

        if (recMatch) {
          const count = parseInt(recMatch[1]) || 1
          const interval = recMatch[2]

          switch (interval) {
            case 'd': // days
              nextDue.setDate(nextDue.getDate() + count)
              break
            case 'b': { // business days
              let daysAdded = 0
              while (daysAdded < count) {
                nextDue.setDate(nextDue.getDate() + 1)
                const day = nextDue.getDay()
                if (day !== 0 && day !== 6) daysAdded++
              }
              break
            }
            case 'w': // weeks
              nextDue.setDate(nextDue.getDate() + (count * 7))
              break
            case 'm': // months
              nextDue.setMonth(nextDue.getMonth() + count)
              break
            case 'y': // years
              nextDue.setFullYear(nextDue.getFullYear() + count)
              break
          }
        } else {
          // Legacy format support
          switch (task.recurrence) {
            case 'daily':
              nextDue.setDate(nextDue.getDate() + 1)
              break
            case 'weekly':
              nextDue.setDate(nextDue.getDate() + 7)
              break
            case 'monthly':
              nextDue.setMonth(nextDue.getMonth() + 1)
              break
          }
        }

        // Create new recurring task
        await supabase.from('tasks').insert({
          text: task.text,
          priority: task.priority,
          due_date: nextDue.toISOString().substring(0, 10),
          recurrence: task.recurrence,
          project_id: task.project_id,
          created_by: task.created_by,
          assigned_to: task.assigned_to,
        })
      }

      const completedAt = new Date().toISOString()

      const { data, error } = await supabase
        .from('tasks')
        .update({
          completed: true,
          completed_at: completedAt,
          completed_note: note,
          completed_by: completedBy,
          updated_at: completedAt,
        })
        .eq('id', task.id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (updatedTask) => {
      queryClient.setQueryData(taskKeys.lists(), (old) => {
        if (!old) return old
        return old.map(t => t.id === updatedTask.id ? updatedTask : t)
      })
    },
  })
}

/**
 * Hook für Task-Uncompletion
 */
export function useUncompleteTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (taskId) => {
      const { data, error } = await supabase
        .from('tasks')
        .update({
          completed: false,
          completed_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.lists() })
      const previousTasks = queryClient.getQueryData(taskKeys.lists())

      queryClient.setQueryData(taskKeys.lists(), (old) => {
        if (!old) return old
        return old.map(t =>
          t.id === taskId
            ? { ...t, completed: false, completed_at: null }
            : t
        )
      })

      return { previousTasks }
    },
    onError: (error, taskId, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(taskKeys.lists(), context.previousTasks)
      }
    },
  })
}

/**
 * Hook für Task-Order Update (Drag & Drop)
 */
export function useUpdateTaskOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ taskId, newPriority, newSortOrder }) => {
      const { data, error } = await supabase
        .from('tasks')
        .update({
          priority: newPriority,
          sort_order: newSortOrder,
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onMutate: async ({ taskId, newPriority, newSortOrder }) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.lists() })
      const previousTasks = queryClient.getQueryData(taskKeys.lists())

      queryClient.setQueryData(taskKeys.lists(), (old) => {
        if (!old) return old
        return old.map(t =>
          t.id === taskId
            ? { ...t, priority: newPriority, sort_order: newSortOrder }
            : t
        )
      })

      return { previousTasks }
    },
    onError: (error, variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(taskKeys.lists(), context.previousTasks)
      }
    },
  })
}

/**
 * Calculate new sort_order for a task dropped between two others
 */
export function calculateSortOrder(tasksInZone, dropIndex) {
  if (tasksInZone.length === 0) {
    return 1000
  }

  // Dropping at the beginning
  if (dropIndex === 0) {
    const firstOrder = tasksInZone[0]?.sort_order || 1000
    return firstOrder - 1000
  }

  // Dropping at the end
  if (dropIndex >= tasksInZone.length) {
    const lastOrder = tasksInZone[tasksInZone.length - 1]?.sort_order || 0
    return lastOrder + 1000
  }

  // Dropping between two tasks
  const prevOrder = tasksInZone[dropIndex - 1]?.sort_order || 0
  const nextOrder = tasksInZone[dropIndex]?.sort_order || prevOrder + 2000
  return Math.floor((prevOrder + nextOrder) / 2)
}
