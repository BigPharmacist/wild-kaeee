import { useState, useCallback } from 'react'

const initialFormState = {
  text: '',
  priority: null,
  dueDate: '',
  recurrence: null,
  recurrenceInterval: null,
  recurrenceCount: 1,
  recurrenceStrict: false,
  projectId: null,
  assignedTo: null,
  assignedGroups: [],
  assignedUsers: [],
}

/**
 * Parse recurrence string (e.g., "+2w" or "1m") into components
 */
function parseRecurrence(rec) {
  if (!rec) return { interval: null, count: 1, strict: false }
  const strict = rec.startsWith('+')
  const cleanRec = strict ? rec.slice(1) : rec
  const match = cleanRec.match(/^(\d+)([dbwmy])$/)
  if (match) {
    return { interval: match[2], count: parseInt(match[1]) || 1, strict }
  }
  return { interval: null, count: 1, strict: false }
}

/**
 * Build recurrence string from components (sleek format: [+]<count><interval>)
 */
function buildRecurrence(interval, count, strict) {
  if (!interval) return null
  const prefix = strict ? '+' : ''
  return `${prefix}${count || 1}${interval}`
}

/**
 * Hook für Task-Form-State-Verwaltung
 */
export function useTaskForm(currentStaffId) {
  const [editingTask, setEditingTask] = useState(null)
  const [taskForm, setTaskForm] = useState(initialFormState)
  const [taskSaveError, setTaskSaveError] = useState('')

  // Open edit modal
  const openTaskModal = useCallback((task = null) => {
    setEditingTask(task || { id: null })
    setTaskSaveError('')
    const recParsed = parseRecurrence(task?.recurrence)

    // Get assigned groups and users from task or set defaults
    let assignedGroups = task?.assigned_groups || []
    let assignedUsers = task?.assigned_users || []

    // Fallback to old single-assignment fields if arrays are empty
    if (assignedGroups.length === 0 && task?.assigned_to_group) {
      assignedGroups = [task.assigned_to_group]
    }
    if (assignedUsers.length === 0 && task?.assigned_to) {
      assignedUsers = [task.assigned_to]
    }
    // Default to current user if nothing assigned
    if (assignedGroups.length === 0 && assignedUsers.length === 0 && !task?.id) {
      assignedUsers = currentStaffId ? [currentStaffId] : []
    }

    setTaskForm({
      text: task?.text || '',
      priority: task?.priority || null,
      dueDate: task?.due_date || '',
      recurrence: task?.recurrence || null,
      recurrenceInterval: recParsed.interval,
      recurrenceCount: recParsed.count,
      recurrenceStrict: recParsed.strict,
      projectId: task?.project_id || null,
      assignedTo: null, // deprecated, kept for compatibility
      assignedGroups,
      assignedUsers,
    })
  }, [currentStaffId])

  // Close edit modal
  const closeTaskModal = useCallback(() => {
    setEditingTask(null)
    setTaskSaveError('')
  }, [])

  // Handle form input
  const handleTaskInput = useCallback((field, value) => {
    setTaskForm(prev => ({ ...prev, [field]: value }))
  }, [])

  // Get task data ready for saving
  const getTaskData = useCallback(() => {
    if (!taskForm.text.trim()) {
      setTaskSaveError('Aufgabenbeschreibung erforderlich')
      return null
    }

    const recurrence = buildRecurrence(
      taskForm.recurrenceInterval,
      taskForm.recurrenceCount,
      taskForm.recurrenceStrict
    )

    const assignedGroups = taskForm.assignedGroups || []
    const assignedUsers = taskForm.assignedUsers || []

    return {
      text: taskForm.text.trim(),
      priority: taskForm.priority || null,
      due_date: taskForm.dueDate || null,
      recurrence: recurrence,
      project_id: taskForm.projectId || null,
      assigned_groups: assignedGroups,
      assigned_users: assignedUsers,
      assigned_to: assignedUsers.length > 0 ? assignedUsers[0] : null,
      assigned_to_group: assignedGroups.length > 0 ? assignedGroups[0] : null,
    }
  }, [taskForm])

  return {
    // State
    editingTask,
    taskForm,
    taskSaveError,
    setTaskSaveError,

    // Actions
    openTaskModal,
    closeTaskModal,
    handleTaskInput,
    setTaskForm,
    getTaskData,

    // Helpers
    isNewTask: !editingTask?.id,
    isModalOpen: editingTask !== null,
  }
}
