import { useState, useEffect, useCallback, lazy } from 'react'
import { useTheme, useStaff, useAuth, useSecondaryNav, useNavigation } from '../../context'
import { useTasksQuery } from './api/useTasksQuery'
import { useQuickCreateTask } from './api/useCreateTask'
import { useUpdateTask, useCompleteTask, useUncompleteTask, useUpdateTaskOrder, calculateSortOrder } from './api/useUpdateTask'
import { useDeleteTask } from './api/useDeleteTask'
import { useTaskFilters } from './hooks/useTaskFilters'
import { useTaskForm } from './hooks/useTaskForm'
import TasksView from './TasksView'
import TaskFormModal from './TaskFormModal'
import TaskCompleteModal from './TaskCompleteModal'

const ProjectFormModal = lazy(() => import('../projects/ProjectFormModal'))

// Projekte-Hook (wird später auch auf TanStack Query migriert)
import useProjects from '../projects/useProjects'

/**
 * TasksPage - Wrapper-Komponente die TanStack Query Hooks verwendet
 * Wird für die /tasks Route und als eigenständige Komponente verwendet
 */
export default function TasksPage({ initialFilters = {} }) {
  const { theme } = useTheme()
  const { staff, currentStaff } = useStaff()
  const { session } = useAuth()

  // Quick add input state
  const [quickAddInput, setQuickAddInput] = useState('')

  // TanStack Query hooks
  const { data: tasks = [], isLoading: tasksLoading, error: tasksQueryError } = useTasksQuery()
  const { quickCreate, isLoading: createLoading } = useQuickCreateTask()
  const updateTaskMutation = useUpdateTask()
  const completeTaskMutation = useCompleteTask()
  const uncompleteTaskMutation = useUncompleteTask()
  const updateTaskOrderMutation = useUpdateTaskOrder()
  const deleteTaskMutation = useDeleteTask()

  // Local filter state
  const {
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
    filteredTasks,
    groupedTasks,
    allProjects,
  } = useTaskFilters(tasks)

  // Task form state
  const {
    editingTask,
    taskForm,
    taskSaveError,
    setTaskSaveError,
    openTaskModal,
    closeTaskModal,
    handleTaskInput,
    setTaskForm,
    getTaskData,
  } = useTaskForm(currentStaff?.id)

  // Completing task state (for modal)
  const [completingTask, setCompletingTask] = useState(null)

  // Projects (noch alte Hook-Implementierung)
  const {
    projects,
    editingProject,
    projectForm,
    projectSaving,
    projectSaveError,
    openProjectModal,
    closeProjectModal,
    handleProjectInput,
    saveProject,
  } = useProjects({ session, currentStaff })

  // Sidebar wiring
  const { setDynamicNavData, setSidebarCallbacks, setSecondarySelectOverride } = useSecondaryNav()
  const { handleSecondarySelect } = useNavigation()

  useEffect(() => {
    setDynamicNavData({ projects })
  }, [projects, setDynamicNavData])

  useEffect(() => {
    setSidebarCallbacks({ onAddTask: openTaskModal, onAddProject: openProjectModal })
    return () => setSidebarCallbacks({ onAddTask: null, onAddProject: null })
  }, [openTaskModal, openProjectModal, setSidebarCallbacks])

  const handleSecondarySelectWithFilter = useCallback((itemId) => {
    if (itemId === 'divider') return
    handleSecondarySelect(itemId)

    if (itemId === 'all') {
      setFilterProjectId(null)
    } else if (itemId.startsWith('project-')) {
      const projectId = itemId.replace('project-', '')
      setFilterProjectId(projectId)
    }
  }, [handleSecondarySelect, setFilterProjectId])

  useEffect(() => {
    setSecondarySelectOverride(() => handleSecondarySelectWithFilter)
    return () => setSecondarySelectOverride(null)
  }, [handleSecondarySelectWithFilter, setSecondarySelectOverride])

  // Apply initial filters from URL
  useEffect(() => {
    if (initialFilters.projectId) setFilterProjectId(initialFilters.projectId)
    if (initialFilters.priority) setFilterPriority(initialFilters.priority)
    if (initialFilters.assignee) setFilterAssignee(initialFilters.assignee)
    if (initialFilters.due) setFilterDue(initialFilters.due)
    if (initialFilters.showCompleted) setShowCompleted(initialFilters.showCompleted)
  }, []) // Only on mount

  // Quick add task
  const createTask = async (inputText, assigneeId = null) => {
    const success = await quickCreate(inputText, currentStaff?.id, assigneeId)
    if (success) {
      setQuickAddInput('')
    }
    return success
  }

  // Toggle task completion
  const toggleTaskComplete = async (taskId) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return false

    if (!task.completed) {
      // Open modal for completing
      setCompletingTask(task)
      return true
    }

    // Uncomplete directly
    try {
      await uncompleteTaskMutation.mutateAsync(taskId)
      return true
    } catch {
      return false
    }
  }

  // Confirm task completion (from modal)
  const confirmTaskComplete = async (note) => {
    if (!completingTask) return false

    try {
      await completeTaskMutation.mutateAsync({
        task: completingTask,
        note,
        completedBy: currentStaff?.id,
      })
      setCompletingTask(null)
      return true
    } catch {
      return false
    }
  }

  // Cancel task completion
  const cancelTaskComplete = () => {
    setCompletingTask(null)
  }

  // Delete task
  const deleteTask = async (taskId) => {
    try {
      await deleteTaskMutation.mutateAsync(taskId)
      return true
    } catch {
      return false
    }
  }

  // Update task order (drag & drop)
  const updateTaskOrder = async (taskId, newPriority, newSortOrder) => {
    try {
      await updateTaskOrderMutation.mutateAsync({ taskId, newPriority, newSortOrder })
      return true
    } catch {
      return false
    }
  }

  // Save task from modal
  const [taskSaving, setTaskSaving] = useState(false)

  const saveTaskFromModal = async () => {
    const taskData = getTaskData()
    if (!taskData) return false

    setTaskSaving(true)

    try {
      if (editingTask?.id) {
        // Update existing task
        await updateTaskMutation.mutateAsync({
          taskId: editingTask.id,
          updates: taskData,
        })
      } else {
        // Create new task
        await quickCreate(taskData.text, currentStaff?.id)
      }
      closeTaskModal()
      return true
    } catch (error) {
      setTaskSaveError(error.message)
      return false
    } finally {
      setTaskSaving(false)
    }
  }

  // Error message
  const tasksError = tasksQueryError?.message || ''

  return (
    <>
      <div className="max-w-5xl">
      <TasksView
        theme={theme}
        tasksLoading={tasksLoading || createLoading}
        tasksError={tasksError}
        quickAddInput={quickAddInput}
        setQuickAddInput={setQuickAddInput}
        groupedTasks={groupedTasks}
        allProjects={allProjects}
        staff={staff}
        currentStaff={currentStaff}
        filteredTasks={filteredTasks}
        filterPriority={filterPriority}
        setFilterPriority={setFilterPriority}
        filterProjectId={filterProjectId}
        setFilterProjectId={setFilterProjectId}
        filterAssignee={filterAssignee}
        setFilterAssignee={setFilterAssignee}
        filterDue={filterDue}
        setFilterDue={setFilterDue}
        showCompleted={showCompleted}
        setShowCompleted={setShowCompleted}
        groupBy={groupBy}
        setGroupBy={setGroupBy}
        projects={projects}
        createTask={createTask}
        toggleTaskComplete={toggleTaskComplete}
        deleteTask={deleteTask}
        openTaskModal={openTaskModal}
        openProjectModal={openProjectModal}
        updateTaskOrder={updateTaskOrder}
        calculateSortOrder={calculateSortOrder}
      />
      </div>

      {/* Task Form Modal */}
      {editingTask && (
        <TaskFormModal
          theme={theme}
          editingTask={editingTask}
          taskForm={taskForm}
          setTaskForm={setTaskForm}
          taskSaving={taskSaving}
          taskSaveError={taskSaveError}
          handleTaskInput={handleTaskInput}
          saveTaskFromModal={saveTaskFromModal}
          closeTaskModal={closeTaskModal}
          projects={projects}
          staff={staff}
          currentStaff={currentStaff}
          deleteTask={deleteTask}
        />
      )}

      {/* Task Complete Modal */}
      {completingTask && (
        <TaskCompleteModal
          theme={theme}
          task={completingTask}
          confirmTaskComplete={confirmTaskComplete}
          cancelTaskComplete={cancelTaskComplete}
        />
      )}

      {/* Project Form Modal */}
      <ProjectFormModal
        editingProject={editingProject}
        projectForm={projectForm}
        projectSaving={projectSaving}
        projectSaveError={projectSaveError}
        handleProjectInput={handleProjectInput}
        saveProject={saveProject}
        closeProjectModal={closeProjectModal}
      />
    </>
  )
}
