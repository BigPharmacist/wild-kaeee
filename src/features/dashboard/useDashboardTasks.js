import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../../lib/supabase'

// Rolle zu Gruppe Mapping
const roleToGroup = {
  'ApothekerIn': 'APO',
  'Apotheker': 'APO',
  'Apothekerin': 'APO',
  'PTA': 'PTA',
  'PKA': 'PKA'
}

export default function useDashboardTasks({ session, currentStaff }) {
  const [tasks, setTasks] = useState([])
  const [tasksLoading, setTasksLoading] = useState(false)
  const [tasksError, setTasksError] = useState('')

  // Benutzergruppe ermitteln
  const userGroup = currentStaff?.role ? roleToGroup[currentStaff.role] : null
  const staffId = currentStaff?.id || null
  const authUserId = currentStaff?.auth_user_id || session?.user?.id || null

  // Tasks laden - nur eigene und Gruppen-Tasks
  const fetchTasks = useCallback(async () => {
    if (!session?.user?.id || !currentStaff?.id) return

    setTasksLoading(true)
    setTasksError('')

    try {
      // Tasks mit Projektinfo laden
      const { data, error } = await supabase
        .from('tasks')
        .select('*, projects(id, name, color)')
        .eq('completed', false)
        .order('priority', { ascending: true, nullsFirst: false })
        .order('due_date', { ascending: true, nullsFirst: false })

      if (error) throw error

      // Client-seitig filtern: nur Tasks des Benutzers oder seiner Gruppe
      const filteredTasks = data.filter(task => {
        // Direkt zugewiesen (Staff-ID oder Auth-User-ID)
        if (staffId && task.assigned_to === staffId) return true
        if (authUserId && task.assigned_to === authUserId) return true
        // Im assigned_users Array (Staff-ID oder Auth-User-ID)
        if (staffId && Array.isArray(task.assigned_users) && task.assigned_users.includes(staffId)) return true
        if (authUserId && Array.isArray(task.assigned_users) && task.assigned_users.includes(authUserId)) return true
        // Gruppe zugewiesen (Textfeld)
        if (userGroup && task.assigned_to_group === userGroup) return true
        // Im assigned_groups Array
        if (userGroup && Array.isArray(task.assigned_groups) && task.assigned_groups.includes(userGroup)) return true
        return false
      })

      setTasks(filteredTasks)
    } catch (err) {
      setTasksError(err.message)
      setTasks([])
    } finally {
      setTasksLoading(false)
    }
  }, [session, currentStaff?.id, userGroup])

  // Initial laden und bei Änderungen aktualisieren
  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  // Realtime Updates abonnieren
  useEffect(() => {
    if (!session?.user?.id) return

    const channel = supabase
      .channel('dashboard-tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        fetchTasks()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [session, fetchTasks])

  // Tasks nach Fälligkeit gruppieren (als Objekt, nicht als Funktion)
  const tasksByDue = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().substring(0, 10)

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().substring(0, 10)

    const weekEnd = new Date(today)
    weekEnd.setDate(weekEnd.getDate() + 7)
    const weekEndStr = weekEnd.toISOString().substring(0, 10)

    const overdue = []
    const todayTasks = []
    const tomorrowTasks = []
    const thisWeek = []
    const later = []
    const noDue = []

    tasks.forEach(task => {
      if (!task.due_date) {
        noDue.push(task)
      } else if (task.due_date < todayStr) {
        overdue.push(task)
      } else if (task.due_date === todayStr) {
        todayTasks.push(task)
      } else if (task.due_date === tomorrowStr) {
        tomorrowTasks.push(task)
      } else if (task.due_date <= weekEndStr) {
        thisWeek.push(task)
      } else {
        later.push(task)
      }
    })

    return { overdue, today: todayTasks, tomorrow: tomorrowTasks, thisWeek, later, noDue }
  }, [tasks])

  // Anzahl überfälliger und heutiger Tasks
  const urgentCount = useMemo(() => {
    return tasksByDue.overdue.length + tasksByDue.today.length
  }, [tasksByDue])

  return {
    tasks,
    tasksLoading,
    tasksError,
    fetchTasks,
    tasksByDue,
    urgentCount
  }
}
