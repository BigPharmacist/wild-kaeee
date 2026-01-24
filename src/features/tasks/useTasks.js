import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../../lib/supabase'

export default function useTasks({ session, activeView, currentStaff }) {
  // Core task state
  const [tasks, setTasks] = useState([])
  const [tasksLoading, setTasksLoading] = useState(false)
  const [tasksError, setTasksError] = useState('')

  // Quick add input
  const [quickAddInput, setQuickAddInput] = useState('')

  // Filter state
  const [filterPriority, setFilterPriority] = useState(null)
  const [filterProjectId, setFilterProjectId] = useState(null)
  const [filterAssignee, setFilterAssignee] = useState(null)
  const [filterDue, setFilterDue] = useState(null)
  const [showCompleted, setShowCompleted] = useState(false)
  const [groupBy, setGroupBy] = useState('priority')

  // Edit modal state
  const [editingTask, setEditingTask] = useState(null)
  const [taskForm, setTaskForm] = useState({
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
  })
  const [taskSaving, setTaskSaving] = useState(false)
  const [taskSaveError, setTaskSaveError] = useState('')

  // Complete modal state (for confirming task completion with attachments)
  const [completingTask, setCompletingTask] = useState(null)

  // Parse quick-add input to extract components
  const parseTaskInput = (input) => {
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

    // Extract recurrence: rec:daily, rec:weekly, rec:monthly
    const recMatch = text.match(/\brec:(daily|weekly|monthly)\b/)
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

  // Fetch all tasks
  const fetchTasks = useCallback(async () => {
    if (!session?.user?.id) return
    setTasksLoading(true)
    setTasksError('')

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setTasksError(error.message)
      setTasks([])
    } else {
      setTasks(data || [])
    }
    setTasksLoading(false)
  }, [session])

  // Create task from quick-add
  const createTask = async (inputText, assigneeId = null) => {
    if (!inputText.trim() || !currentStaff?.id) return false

    const parsed = parseTaskInput(inputText)

    const { error } = await supabase
      .from('tasks')
      .insert({
        text: parsed.text,
        priority: parsed.priority,
        due_date: parsed.dueDate,
        recurrence: parsed.recurrence,
        project: parsed.project,
        created_by: currentStaff.id,
        assigned_to: assigneeId || currentStaff.id,
      })

    if (error) {
      setTasksError(error.message)
      return false
    }

    setQuickAddInput('')
    return true
  }

  // Toggle task completion - opens modal for completing, direct toggle for uncompleting
  const toggleTaskComplete = async (taskId) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return false

    if (!task.completed) {
      // Opening completion: show modal for confirmation and attachments
      setCompletingTask(task)
      return true
    }

    // Uncompleting: direct toggle without modal
    const { error } = await supabase
      .from('tasks')
      .update({
        completed: false,
        completed_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId)

    if (error) {
      setTasksError(error.message)
      return false
    }

    // Optimistic update
    setTasks(prev => prev.map(t =>
      t.id === taskId
        ? { ...t, completed: false, completed_at: null }
        : t
    ))
    return true
  }

  // Confirm task completion (called from modal)
  const confirmTaskComplete = async (note) => {
    const task = completingTask
    if (!task) return false

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
          case 'b': // business days
            let daysAdded = 0
            while (daysAdded < count) {
              nextDue.setDate(nextDue.getDate() + 1)
              const day = nextDue.getDay()
              if (day !== 0 && day !== 6) daysAdded++ // skip weekends
            }
            break
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

    const { error } = await supabase
      .from('tasks')
      .update({
        completed: true,
        completed_at: completedAt,
        completed_note: note,
        completed_by: currentStaff?.id,
        updated_at: completedAt,
      })
      .eq('id', task.id)

    if (error) {
      setTasksError(error.message)
      return false
    }

    // Optimistic update
    setTasks(prev => prev.map(t =>
      t.id === task.id
        ? { ...t, completed: true, completed_at: completedAt, completed_note: note, completed_by: currentStaff?.id }
        : t
    ))

    // Close modal
    setCompletingTask(null)
    return true
  }

  // Cancel task completion modal
  const cancelTaskComplete = () => {
    setCompletingTask(null)
  }

  // Update task
  const updateTask = async (taskId, updates) => {
    const { error } = await supabase
      .from('tasks')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId)

    if (error) {
      setTaskSaveError(error.message)
      return false
    }

    // Optimistic update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t))
    return true
  }

  // Delete task
  const deleteTask = async (taskId) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)

    if (error) {
      setTasksError(error.message)
      return false
    }

    setTasks(prev => prev.filter(t => t.id !== taskId))
    return true
  }

  // Update task order after drag & drop
  const updateTaskOrder = async (taskId, newPriority, newSortOrder) => {
    const { error } = await supabase
      .from('tasks')
      .update({
        priority: newPriority,
        sort_order: newSortOrder,
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId)

    if (error) {
      setTasksError(error.message)
      return false
    }

    // Optimistic update
    setTasks(prev => prev.map(t =>
      t.id === taskId
        ? { ...t, priority: newPriority, sort_order: newSortOrder }
        : t
    ))
    return true
  }

  // Calculate new sort_order for a task dropped between two others
  const calculateSortOrder = (tasksInZone, dropIndex) => {
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

  // Filtered and sorted tasks (memoized)
  const filteredTasks = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const filtered = tasks.filter(task => {
      // Hide completed unless showCompleted
      if (!showCompleted && task.completed) return false

      // Priority filter
      if (filterPriority && task.priority !== filterPriority) return false

      // Project filter
      if (filterProjectId && task.project_id !== filterProjectId) return false

      // Assignee filter
      if (filterAssignee && task.assigned_to !== filterAssignee) return false

      // Due date filter
      if (filterDue) {
        const taskDue = task.due_date ? new Date(task.due_date) : null

        switch (filterDue) {
          case 'today':
            if (!taskDue || taskDue.toDateString() !== today.toDateString()) return false
            break
          case 'week': {
            const weekEnd = new Date(today)
            weekEnd.setDate(weekEnd.getDate() + 7)
            if (!taskDue || taskDue < today || taskDue > weekEnd) return false
            break
          }
          case 'overdue':
            if (!taskDue || taskDue >= today) return false
            break
        }
      }

      return true
    })

    // Sort by: 1. Priority (A→Z→none), 2. sort_order, 3. Due date, 4. Created at
    // Priority order: A=0, B=1, ..., Z=25, none=26
    const getPriorityOrder = (p) => {
      if (!p) return 26
      const code = p.toUpperCase().charCodeAt(0)
      return code >= 65 && code <= 90 ? code - 65 : 26
    }

    filtered.sort((a, b) => {
      // 1. Priority: A < B < ... < Z < none
      const prioA = getPriorityOrder(a.priority)
      const prioB = getPriorityOrder(b.priority)
      if (prioA !== prioB) return prioA - prioB

      // 2. sort_order (lower values first, for manual drag & drop ordering)
      const sortA = a.sort_order || 0
      const sortB = b.sort_order || 0
      if (sortA !== sortB) return sortA - sortB

      // 3. Due date: overdue < today < future < none
      const dueA = a.due_date ? new Date(a.due_date) : null
      const dueB = b.due_date ? new Date(b.due_date) : null

      // Tasks with due date come before tasks without
      if (dueA && !dueB) return -1
      if (!dueA && dueB) return 1

      // Both have due dates: sort by date (earliest first)
      if (dueA && dueB) {
        const diff = dueA.getTime() - dueB.getTime()
        if (diff !== 0) return diff
      }

      // 4. Created at (newest first as fallback)
      return new Date(b.created_at) - new Date(a.created_at)
    })

    return filtered
  }, [tasks, showCompleted, filterPriority, filterProjectId, filterAssignee, filterDue])

  // Grouped tasks (memoized)
  const groupedTasks = useMemo(() => {
    if (groupBy === 'none') {
      return { 'Alle Aufgaben': filteredTasks }
    }

    const groups = {}

    filteredTasks.forEach(task => {
      let groupKey

      switch (groupBy) {
        case 'priority':
          groupKey = task.priority ? `Priorität ${task.priority}` : 'Ohne Priorität'
          break
        case 'project':
          groupKey = task.project ? `+${task.project}` : 'Ohne Projekt'
          break
        case 'due': {
          if (!task.due_date) {
            groupKey = 'Ohne Fälligkeit'
          } else {
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            const due = new Date(task.due_date)
            if (due < today) groupKey = 'Überfällig'
            else if (due.toDateString() === today.toDateString()) groupKey = 'Heute'
            else groupKey = 'Zukünftig'
          }
          break
        }
        case 'assignee':
          groupKey = task.assigned_to || 'Nicht zugewiesen'
          break
        default:
          groupKey = 'Alle'
      }

      if (!groups[groupKey]) groups[groupKey] = []
      groups[groupKey].push(task)
    })

    return groups
  }, [filteredTasks, groupBy])

  // Extract unique projects for filter dropdown
  const allProjects = useMemo(() => {
    const projects = new Set()
    tasks.forEach(t => {
      if (t.project) projects.add(t.project)
    })
    return Array.from(projects).sort()
  }, [tasks])

  // Parse recurrence string (e.g., "+2w" or "1m") into components
  const parseRecurrence = (rec) => {
    if (!rec) return { interval: null, count: 1, strict: false }
    const strict = rec.startsWith('+')
    const cleanRec = strict ? rec.slice(1) : rec
    const match = cleanRec.match(/^(\d+)([dbwmy])$/)
    if (match) {
      return { interval: match[2], count: parseInt(match[1]) || 1, strict }
    }
    return { interval: null, count: 1, strict: false }
  }

  // Open edit modal
  const openTaskModal = (task = null) => {
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
      assignedUsers = currentStaff?.id ? [currentStaff.id] : []
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
  }

  // Close edit modal
  const closeTaskModal = () => {
    setEditingTask(null)
    setTaskSaveError('')
  }

  // Handle form input
  const handleTaskInput = (field, value) => {
    setTaskForm(prev => ({ ...prev, [field]: value }))
  }

  // Build recurrence string from components (sleek format: [+]<count><interval>)
  const buildRecurrence = (interval, count, strict) => {
    if (!interval) return null
    const prefix = strict ? '+' : ''
    return `${prefix}${count || 1}${interval}`
  }

  // Save task from modal
  const saveTaskFromModal = async () => {
    if (!taskForm.text.trim()) {
      setTaskSaveError('Aufgabenbeschreibung erforderlich')
      return false
    }

    setTaskSaving(true)
    setTaskSaveError('')

    const recurrence = buildRecurrence(
      taskForm.recurrenceInterval,
      taskForm.recurrenceCount,
      taskForm.recurrenceStrict
    )

    // Use new array fields for multi-assignment
    const assignedGroups = taskForm.assignedGroups || []
    const assignedUsers = taskForm.assignedUsers || []

    const taskData = {
      text: taskForm.text.trim(),
      priority: taskForm.priority || null,
      due_date: taskForm.dueDate || null,
      recurrence: recurrence,
      project_id: taskForm.projectId || null,
      // New array fields
      assigned_groups: assignedGroups,
      assigned_users: assignedUsers,
      // Keep old fields for backward compatibility (first item or null)
      assigned_to: assignedUsers.length > 0 ? assignedUsers[0] : null,
      assigned_to_group: assignedGroups.length > 0 ? assignedGroups[0] : null,
    }

    let success
    if (editingTask?.id) {
      success = await updateTask(editingTask.id, taskData)
    } else {
      const { error } = await supabase.from('tasks').insert({
        ...taskData,
        created_by: currentStaff.id,
      })
      success = !error
      if (error) setTaskSaveError(error.message)
    }

    setTaskSaving(false)
    if (success) closeTaskModal()
    return success
  }

  // Realtime subscription
  useEffect(() => {
    if (!session || activeView !== 'tasks') return

    fetchTasks()

    const channel = supabase
      .channel('tasks_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tasks' }, (payload) => {
        setTasks(prev => {
          // Prevent duplicates
          if (prev.some(t => t.id === payload.new.id)) return prev
          return [payload.new, ...prev]
        })
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tasks' }, (payload) => {
        setTasks(prev => prev.map(t => t.id === payload.new.id ? payload.new : t))
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'tasks' }, (payload) => {
        setTasks(prev => prev.filter(t => t.id !== payload.old.id))
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [session, activeView, fetchTasks])

  return {
    // State
    tasks,
    tasksLoading,
    tasksError,
    quickAddInput,
    setQuickAddInput,
    filteredTasks,
    groupedTasks,
    allProjects,

    // Filters
    filterPriority,
    setFilterPriority,
    filterProjectId,
    setFilterProjectId,
    filterAssignee,
    setFilterAssignee,
    filterDue,
    setFilterDue,
    showCompleted,
    setShowCompleted,
    groupBy,
    setGroupBy,

    // Edit Modal
    editingTask,
    taskForm,
    taskSaving,
    taskSaveError,
    setTaskForm,
    openTaskModal,
    closeTaskModal,
    handleTaskInput,
    saveTaskFromModal,

    // Complete Modal
    completingTask,
    confirmTaskComplete,
    cancelTaskComplete,

    // Actions
    fetchTasks,
    createTask,
    toggleTaskComplete,
    updateTask,
    deleteTask,
    parseTaskInput,

    // Drag & Drop
    updateTaskOrder,
    calculateSortOrder,
  }
}
