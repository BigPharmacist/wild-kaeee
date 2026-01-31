import { useState, useMemo } from 'react'

/**
 * Hook für lokale Filter-State-Verwaltung
 * Enthält Filterung, Sortierung und Gruppierung von Tasks
 */
export function useTaskFilters(tasks = []) {
  // Filter state
  const [filterPriority, setFilterPriority] = useState(null)
  const [filterProjectId, setFilterProjectId] = useState(null)
  const [filterAssignee, setFilterAssignee] = useState(null)
  const [filterDue, setFilterDue] = useState(null)
  const [showCompleted, setShowCompleted] = useState(false)
  const [groupBy, setGroupBy] = useState('priority')

  // Filtered and sorted tasks
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

      if (dueA && !dueB) return -1
      if (!dueA && dueB) return 1

      if (dueA && dueB) {
        const diff = dueA.getTime() - dueB.getTime()
        if (diff !== 0) return diff
      }

      // 4. Created at (newest first as fallback)
      return new Date(b.created_at) - new Date(a.created_at)
    })

    return filtered
  }, [tasks, showCompleted, filterPriority, filterProjectId, filterAssignee, filterDue])

  // Grouped tasks
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

  // Clear all filters
  const clearFilters = () => {
    setFilterPriority(null)
    setFilterProjectId(null)
    setFilterAssignee(null)
    setFilterDue(null)
  }

  // Check if any filter is active
  const hasActiveFilters = filterPriority || filterProjectId || filterAssignee || filterDue

  return {
    // Filter state
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

    // Computed values
    filteredTasks,
    groupedTasks,
    allProjects,

    // Helpers
    clearFilters,
    hasActiveFilters,
  }
}
