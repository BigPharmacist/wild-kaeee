import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabase'
import { taskKeys } from './queries'

/**
 * Parse quick-add input to extract components
 * Format: (A) Text due:YYYY-MM-DD rec:1d +project
 */
export function parseTaskInput(input) {
  let text = input.trim()
  let priority = null
  let dueDate = null
  let recurrence = null
  let project = null

  // Extract priority: (A), (B), ... (Z) at start
  const priorityMatch = text.match(/^\(([A-Z])\)\s*/i)
  if (priorityMatch) {
    priority = priorityMatch[1].toUpperCase()
    text = text.replace(priorityMatch[0], '')
  }

  // Extract due date: due:YYYY-MM-DD
  const dueMatch = text.match(/\bdue:(\d{4}-\d{2}-\d{2})\b/)
  if (dueMatch) {
    dueDate = dueMatch[1]
    text = text.replace(dueMatch[0], '').trim()
  }

  // Extract recurrence: rec:daily, rec:weekly, rec:monthly or rec:1d, rec:2w, etc.
  const recMatch = text.match(/\brec:(daily|weekly|monthly|\+?\d+[dbwmy])\b/)
  if (recMatch) {
    recurrence = recMatch[1]
    text = text.replace(recMatch[0], '').trim()
  }

  // Extract project: +projectname (first match stored, all kept in text)
  const projectMatch = text.match(/\+(\S+)/)
  if (projectMatch) {
    project = projectMatch[1]
  }

  return { text: text.trim(), priority, dueDate, recurrence, project }
}

/**
 * Create task mutation
 */
async function createTask({ text, priority, dueDate, recurrence, project, projectId, createdBy, assignedTo, assignedGroups, assignedUsers }) {
  const taskData = {
    text,
    priority: priority || null,
    due_date: dueDate || null,
    recurrence: recurrence || null,
    project: project || null,
    project_id: projectId || null,
    created_by: createdBy,
    assigned_to: assignedTo || createdBy,
    assigned_groups: assignedGroups || [],
    assigned_users: assignedUsers || [],
  }

  const { data, error } = await supabase
    .from('tasks')
    .insert(taskData)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Hook für Task-Erstellung
 */
export function useCreateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createTask,
    onSuccess: (newTask) => {
      // Optimistisches Update - Task sofort hinzufügen
      queryClient.setQueryData(taskKeys.lists(), (old) => {
        if (!old) return [newTask]
        return [newTask, ...old]
      })
    },
    onError: (error) => {
      console.error('Task creation failed:', error.message)
    },
  })
}

/**
 * Helper: Create task from quick-add input string
 */
export function useQuickCreateTask() {
  const createMutation = useCreateTask()

  const quickCreate = async (inputText, currentStaffId, assigneeId = null) => {
    if (!inputText.trim() || !currentStaffId) return false

    const parsed = parseTaskInput(inputText)

    try {
      await createMutation.mutateAsync({
        text: parsed.text,
        priority: parsed.priority,
        dueDate: parsed.dueDate,
        recurrence: parsed.recurrence,
        project: parsed.project,
        createdBy: currentStaffId,
        assignedTo: assigneeId || currentStaffId,
      })
      return true
    } catch {
      return false
    }
  }

  return {
    quickCreate,
    isLoading: createMutation.isPending,
    error: createMutation.error?.message,
  }
}
