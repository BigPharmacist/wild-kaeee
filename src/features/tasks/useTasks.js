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
  const [filterProject, setFilterProject] = useState(null)
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
    project: '',
    assignedTo: null,
  })
  const [taskSaving, setTaskSaving] = useState(false)
  const [taskSaveError, setTaskSaveError] = useState('')

  // Parse quick-add input to extract components
  const parseTaskInput = (input) => {
    let text = input.trim()
    let priority = null
    let dueDate = null
    let recurrence = null
    let project = null

    // Extract priority: (A), (B), (C) at start
    const priorityMatch = text.match(/^\(([ABC])\)\s*/)
    if (priorityMatch) {
      priority = priorityMatch[1]
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

  // Toggle task completion
  const toggleTaskComplete = async (taskId) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return false

    const newCompleted = !task.completed

    // Handle recurrence: if completing a recurring task, create next occurrence
    if (newCompleted && task.recurrence && task.due_date) {
      const currentDue = new Date(task.due_date)
      let nextDue = new Date(currentDue)

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

      // Create new recurring task
      await supabase.from('tasks').insert({
        text: task.text,
        priority: task.priority,
        due_date: nextDue.toISOString().substring(0, 10),
        recurrence: task.recurrence,
        project: task.project,
        created_by: task.created_by,
        assigned_to: task.assigned_to,
      })
    }

    const { error } = await supabase
      .from('tasks')
      .update({
        completed: newCompleted,
        completed_at: newCompleted ? new Date().toISOString() : null,
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
        ? { ...t, completed: newCompleted, completed_at: newCompleted ? new Date().toISOString() : null }
        : t
    ))
    return true
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

  // Filtered tasks (memoized)
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Hide completed unless showCompleted
      if (!showCompleted && task.completed) return false

      // Priority filter
      if (filterPriority && task.priority !== filterPriority) return false

      // Project filter
      if (filterProject && task.project !== filterProject) return false

      // Assignee filter
      if (filterAssignee && task.assigned_to !== filterAssignee) return false

      // Due date filter
      if (filterDue) {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
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
  }, [tasks, showCompleted, filterPriority, filterProject, filterAssignee, filterDue])

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
    setTaskForm({
      text: task?.text || '',
      priority: task?.priority || null,
      dueDate: task?.due_date || '',
      recurrence: task?.recurrence || null,
      recurrenceInterval: recParsed.interval,
      recurrenceCount: recParsed.count,
      recurrenceStrict: recParsed.strict,
      project: task?.project || '',
      assignedTo: task?.assigned_to || currentStaff?.id || null,
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

    const taskData = {
      text: taskForm.text.trim(),
      priority: taskForm.priority || null,
      due_date: taskForm.dueDate || null,
      recurrence: recurrence,
      project: taskForm.project || null,
      assigned_to: taskForm.assignedTo || currentStaff?.id,
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
    filterProject,
    setFilterProject,
    filterAssignee,
    setFilterAssignee,
    filterDue,
    setFilterDue,
    showCompleted,
    setShowCompleted,
    groupBy,
    setGroupBy,

    // Modal
    editingTask,
    taskForm,
    taskSaving,
    taskSaveError,
    setTaskForm,
    openTaskModal,
    closeTaskModal,
    handleTaskInput,
    saveTaskFromModal,

    // Actions
    fetchTasks,
    createTask,
    toggleTaskComplete,
    updateTask,
    deleteTask,
    parseTaskInput,
  }
}
