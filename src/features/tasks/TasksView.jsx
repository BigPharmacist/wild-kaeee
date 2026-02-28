import { useState, useMemo } from 'react'
import { Plus, CaretDown, Trash, PencilSimple, FunnelSimple, Circle, CheckCircle, CalendarBlank, DotsSixVertical } from '@phosphor-icons/react'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// Priority colors for left bar and badge (A-Z with unique colors)
const priorityColors = {
  A: { bar: 'bg-[#ff0000]', badge: 'bg-[#ff0000]', text: 'text-white' },       // Rot
  B: { bar: 'bg-[#ff4500]', badge: 'bg-[#ff4500]', text: 'text-white' },       // Orange-Rot
  C: { bar: 'bg-[#ff8c00]', badge: 'bg-[#ff8c00]', text: 'text-white' },       // Dunkelorange
  D: { bar: 'bg-[#ffa500]', badge: 'bg-[#ffa500]', text: 'text-white' },       // Orange
  E: { bar: 'bg-[#ffc800]', badge: 'bg-[#ffc800]', text: 'text-[#5a5a5a]' },   // Gold
  F: { bar: 'bg-[#ffeb3b]', badge: 'bg-[#ffeb3b]', text: 'text-[#5a5a5a]' },   // Gelb
  G: { bar: 'bg-[#cddc39]', badge: 'bg-[#cddc39]', text: 'text-[#5a5a5a]' },   // Limette
  H: { bar: 'bg-[#8bc34a]', badge: 'bg-[#8bc34a]', text: 'text-white' },       // Hellgrün
  I: { bar: 'bg-[#4caf50]', badge: 'bg-[#4caf50]', text: 'text-white' },       // Grün
  J: { bar: 'bg-[#009688]', badge: 'bg-[#009688]', text: 'text-white' },       // Teal
  K: { bar: 'bg-[#00bcd4]', badge: 'bg-[#00bcd4]', text: 'text-white' },       // Cyan
  L: { bar: 'bg-[#03a9f4]', badge: 'bg-[#03a9f4]', text: 'text-white' },       // Hellblau
  M: { bar: 'bg-[#2196f3]', badge: 'bg-[#2196f3]', text: 'text-white' },       // Blau
  N: { bar: 'bg-[#3f51b5]', badge: 'bg-[#3f51b5]', text: 'text-white' },       // Indigo
  O: { bar: 'bg-[#673ab7]', badge: 'bg-[#673ab7]', text: 'text-white' },       // Violett
  P: { bar: 'bg-[#9c27b0]', badge: 'bg-[#9c27b0]', text: 'text-white' },       // Lila
  Q: { bar: 'bg-[#e91e63]', badge: 'bg-[#e91e63]', text: 'text-white' },       // Pink
  R: { bar: 'bg-[#f44336]', badge: 'bg-[#f44336]', text: 'text-white' },       // Hellrot
  S: { bar: 'bg-[#795548]', badge: 'bg-[#795548]', text: 'text-white' },       // Braun
  T: { bar: 'bg-[#607d8b]', badge: 'bg-[#607d8b]', text: 'text-white' },       // Blaugrau
  U: { bar: 'bg-[#9e9e9e]', badge: 'bg-[#9e9e9e]', text: 'text-white' },       // Grau
  V: { bar: 'bg-[#78909c]', badge: 'bg-[#78909c]', text: 'text-white' },       // Stahlblau
  W: { bar: 'bg-[#5d4037]', badge: 'bg-[#5d4037]', text: 'text-white' },       // Dunkelbraun
  X: { bar: 'bg-[#455a64]', badge: 'bg-[#455a64]', text: 'text-white' },       // Schiefergrau
  Y: { bar: 'bg-[#263238]', badge: 'bg-[#263238]', text: 'text-white' },       // Fast Schwarz
  Z: { bar: 'bg-[#000000]', badge: 'bg-[#000000]', text: 'text-white' },       // Schwarz
}

// Tag Pill Component (sleek-style colored pills with split background)
const TagPill = ({ label, value, isOverdue, type }) => {
  // Colors: dark side (label) and light side (value)
  const getColors = () => {
    if (isOverdue) return { dark: 'bg-[#ff0000]/25 text-[#ff0000]', light: 'bg-[#ff0000]/10 text-[#ff0000]' }
    if (type === 'project') return { dark: 'bg-[#e4c0e4] text-[#6f266f]', light: 'bg-[#f1d6f1] text-[#6f266f]' }
    if (type === 'context') return { dark: 'bg-[#a8dfd1] text-[#1e6251]', light: 'bg-[#c5ede3] text-[#1e6251]' }
    if (type === 'due') return { dark: 'bg-[#d4d4d4] text-[#5a5a5a]', light: 'bg-[#ebebeb] text-[#5a5a5a]' }
    if (type === 'rec') return { dark: 'bg-[#d4d4d4] text-[#5a5a5a]', light: 'bg-[#ebebeb] text-[#5a5a5a]' }
    return { dark: 'bg-[#d4d4d4] text-[#5a5a5a]', light: 'bg-[#ebebeb] text-[#5a5a5a]' }
  }

  const colors = getColors()

  // If no label, show single pill
  if (!label) {
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-[0.65em] text-xs font-medium ${colors.light}`}>
        {value}
      </span>
    )
  }

  return (
    <span className="inline-flex items-center text-xs font-medium">
      <span className={`px-2 py-1 rounded-l-[0.65em] font-semibold ${colors.dark}`}>
        {label}
      </span>
      <span className={`px-2 py-1 rounded-r-[0.65em] ${colors.light}`}>
        {value}
      </span>
    </span>
  )
}

// Round Priority Badge (Sleek-style)
const PriorityBadge = ({ priority }) => {
  if (!priority) return null
  const colors = priorityColors[priority] || { badge: 'bg-gray-400', text: 'text-white' }

  return (
    <span className={`
      w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
      ${colors.badge} ${colors.text} shadow-sm
    `}>
      {priority}
    </span>
  )
}

// Task Item Component (Sleek-style)
const TaskItem = ({
  task,
  theme,
  staff,
  onToggle,
  onEdit,
  onDelete,
  currentStaffId,
  isDragging,
  dragHandleProps,
}) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const taskDue = task.due_date ? new Date(task.due_date) : null
  const isOverdue = taskDue && taskDue < today && !task.completed
  const isToday = taskDue && taskDue.toDateString() === today.toDateString()

  const assignee = staff?.find(s => s.id === task.assigned_to)
  const barColor = task.priority ? priorityColors[task.priority]?.bar : 'bg-transparent'

  // Format due date for display
  const formatDueDate = () => {
    if (!taskDue) return null
    if (isOverdue) return 'überfällig'
    if (isToday) return 'heute'
    return taskDue.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
  }

  // Format recurrence for display (sleek-style)
  const formatRecurrence = () => {
    if (!task.recurrence) return null
    // Recurrence is now stored directly as sleek format (1d, 1b, 1w, 2w, 1m, 3m, 1y)
    return task.recurrence
  }

  return (
    <div className={`relative ${task.priority ? 'mt-4' : ''}`}>
      {/* Priority Badge - floating above the row */}
      {task.priority && (
        <div className="absolute -top-3 left-3 z-10">
          <PriorityBadge priority={task.priority} />
        </div>
      )}

      {/* Task Row (sleek-style: dashed border bottom, no card) */}
      <div className={`
        relative flex items-center gap-3 pl-4 pr-3 py-3
        border-b border-dashed border-[#ccc]
        ${task.completed ? 'opacity-50 grayscale' : ''}
        ${isDragging ? 'opacity-50 bg-[#f0f0f0] shadow-lg' : ''}
        transition-all hover:bg-[#f0f0f0] group
      `}>
        {/* Colored left bar based on priority */}
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${barColor}`} />

        {/* Drag Handle */}
        <button
          type="button"
          {...dragHandleProps}
          className="flex-shrink-0 text-[#ccc] hover:text-[#5a5a5a] cursor-grab active:cursor-grabbing touch-none"
          title="Ziehen zum Verschieben"
        >
          <DotsSixVertical size={20} weight="bold" />
        </button>

        {/* Checkbox (sleek-style: blue when checked) */}
        <button
          type="button"
          onClick={() => onToggle(task.id)}
          className="flex-shrink-0 text-[#ccc] hover:text-[#1976d2] transition-colors"
        >
          {task.completed ? (
            <CheckCircle size={22} weight="fill" className="text-[#1976d2]" />
          ) : (
            <Circle size={22} weight="regular" />
          )}
        </button>

        {/* Task Content - click to edit */}
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onEdit(task)}>
          {/* Task text and tags inline (sleek-style) */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm ${task.completed ? 'line-through text-[#ccc]' : 'text-[#5a5a5a]'}`}>
              {task.text}
            </span>
            {task.due_date && (
              <TagPill label="due:" value={formatDueDate()} isOverdue={isOverdue} type="due" />
            )}
            {task.recurrence && (
              <TagPill label="rec:" value={formatRecurrence()} type="rec" />
            )}
            {task.project && (
              <TagPill value={`+${task.project}`} type="project" />
            )}
            {/* Assignee Avatars (Groups + Users) */}
            {((task.assigned_groups?.length > 0) || (task.assigned_users?.length > 0) || assignee) && (
              <div className="flex items-center -space-x-2">
                {/* Group Avatars */}
                {task.assigned_groups?.map(groupId => (
                  <span key={groupId} className="relative group/avatar">
                    <span className={`w-8 h-8 rounded-full text-white text-xs font-bold flex items-center justify-center border-2 border-white shadow-sm ${
                      groupId === 'APO' ? 'bg-[#673ab7]' :
                      groupId === 'PTA' ? 'bg-[#2196f3]' :
                      'bg-[#4caf50]'
                    }`}>
                      {groupId}
                    </span>
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-[#333] text-white text-xs rounded whitespace-nowrap opacity-0 group-hover/avatar:opacity-100 transition-opacity pointer-events-none z-20">
                      {groupId === 'APO' ? 'ApothekerInnen' : groupId}
                    </span>
                  </span>
                ))}
                {/* User Avatars */}
                {task.assigned_users?.map(userId => {
                  const user = staff?.find(s => s.id === userId)
                  if (!user) return null
                  return (
                    <span key={userId} className="relative group/avatar">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.first_name}
                          className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm"
                        />
                      ) : (
                        <span className="w-8 h-8 rounded-full bg-[#a8dfd1] text-[#1e6251] text-sm font-medium flex items-center justify-center border-2 border-white shadow-sm">
                          {user.first_name?.[0]?.toUpperCase() || '?'}
                        </span>
                      )}
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-[#333] text-white text-xs rounded whitespace-nowrap opacity-0 group-hover/avatar:opacity-100 transition-opacity pointer-events-none z-20">
                        {user.first_name} {user.last_name || ''}
                      </span>
                    </span>
                  )
                })}
                {/* Fallback to old single assignee if no new arrays */}
                {!task.assigned_groups?.length && !task.assigned_users?.length && assignee && (
                  <span className="relative group/avatar">
                    {assignee.avatar_url ? (
                      <img
                        src={assignee.avatar_url}
                        alt={assignee.first_name}
                        className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm"
                      />
                    ) : (
                      <span className="w-8 h-8 rounded-full bg-[#a8dfd1] text-[#1e6251] text-sm font-medium flex items-center justify-center border-2 border-white shadow-sm">
                        {assignee.first_name?.[0]?.toUpperCase() || '?'}
                      </span>
                    )}
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-[#333] text-white text-xs rounded whitespace-nowrap opacity-0 group-hover/avatar:opacity-100 transition-opacity pointer-events-none z-20">
                      {assignee.first_name} {assignee.last_name || ''}
                    </span>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Actions (visible on hover, sleek-style) */}
        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => onEdit(task)}
            className="p-1.5 rounded-[0.65em] hover:bg-[#ebebeb] text-[#ccc] hover:text-[#5a5a5a]"
            title="Bearbeiten"
          >
            <PencilSimple size={16} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(task.id)}
            className="p-1.5 rounded-[0.65em] hover:bg-[#ff0000]/10 text-[#ccc] hover:text-[#ff0000]"
            title="Löschen"
          >
            <Trash size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

// Sortable wrapper for TaskItem
const SortableTaskItem = (props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <TaskItem
        {...props}
        isDragging={isDragging}
        dragHandleProps={listeners}
      />
    </div>
  )
}

// Main TasksView Component
const TasksView = ({
  theme,
  tasksLoading,
  tasksError,
  quickAddInput,
  setQuickAddInput,
  groupedTasks,
  allProjects,
  staff,
  currentStaff,
  filteredTasks,

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
  projects,

  // Actions
  createTask,
  toggleTaskComplete,
  deleteTask,
  openTaskModal,
  openProjectModal,

  // Drag & Drop
  updateTaskOrder,
  calculateSortOrder,
}) => {
  const [showFilters, setShowFilters] = useState(false)
  const [activeId, setActiveId] = useState(null)

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Get task by ID
  const getTaskById = (id) => filteredTasks?.find(t => t.id === id)

  // Handle drag start
  const handleDragStart = (event) => {
    setActiveId(event.active.id)
  }

  // Handle drag end
  const handleDragEnd = (event) => {
    const { active, over } = event
    setActiveId(null)

    if (!over || active.id === over.id) return

    const activeTask = getTaskById(active.id)
    const overTask = getTaskById(over.id)

    if (!activeTask) return

    // Determine new priority from drop target
    const newPriority = overTask?.priority || null

    // Get tasks in the target priority zone
    const tasksInZone = filteredTasks.filter(t =>
      t.priority === newPriority && t.id !== active.id
    )

    // Find drop index
    const overIndex = tasksInZone.findIndex(t => t.id === over.id)
    const dropIndex = overIndex >= 0 ? overIndex : tasksInZone.length

    // Calculate new sort_order
    const newSortOrder = calculateSortOrder(tasksInZone, dropIndex)

    // Update task
    updateTaskOrder(active.id, newPriority, newSortOrder)
  }

  // Get active task for drag overlay
  const activeTask = activeId ? getTaskById(activeId) : null

  // Quick add submission
  const handleQuickAdd = async (e) => {
    e.preventDefault()
    if (quickAddInput.trim()) {
      await createTask(quickAddInput)
    }
  }

  // Group order for display
  const priorityLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
  const groupOrder = {
    priority: [...priorityLetters.map(l => `Priorität ${l}`), 'Ohne Priorität'],
    due: ['Überfällig', 'Heute', 'Zukünftig', 'Ohne Fälligkeit'],
  }

  const sortedGroupKeys = Object.keys(groupedTasks).sort((a, b) => {
    const order = groupOrder[groupBy]
    if (order) {
      return (order.indexOf(a) - order.indexOf(b)) || a.localeCompare(b)
    }
    return a.localeCompare(b)
  })

  // Get all tasks from grouped structure
  const allTasks = Object.values(groupedTasks).flat()

  // Group tasks by project (for "Alle Aufgaben" view)
  const tasksByProject = useMemo(() => {
    const grouped = { noProject: [] }

    // Initialize groups for each project
    projects?.forEach(p => {
      grouped[p.id] = []
    })

    // Distribute tasks
    allTasks.forEach(task => {
      if (task.project_id && grouped[task.project_id]) {
        grouped[task.project_id].push(task)
      } else {
        grouped.noProject.push(task)
      }
    })

    return grouped
  }, [allTasks, projects])

  // Check if we're showing all tasks (no project filter)
  const showingAllTasks = !filterProjectId

  return (
    <>
      <h2 className="text-2xl lg:text-3xl font-semibold mb-6 tracking-tight">Aufgaben</h2>

      {/* Filter/Group Bar */}
      <div className={`mb-6 p-4 rounded-xl border ${theme.border} ${theme.surface}`}>
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 text-sm font-medium ${theme.textSecondary}`}
          >
            <FunnelSimple size={18} />
            Filter & Gruppierung
            <CaretDown size={14} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          <label className={`flex items-center gap-2 text-sm ${theme.textSecondary}`}>
            <input
              type="checkbox"
              checked={showCompleted}
              onChange={(e) => setShowCompleted(e.target.checked)}
              className="rounded accent-[#DC2626]"
            />
            Erledigte anzeigen
          </label>
        </div>

        {showFilters && (
          <div className={`grid grid-cols-2 md:grid-cols-5 gap-3 pt-4 mt-4 border-t ${theme.border}`}>
            {/* Priority Filter */}
            <select
              value={filterPriority || ''}
              onChange={(e) => setFilterPriority(e.target.value || null)}
              className={`px-3 py-2 ${theme.input} border rounded-lg text-sm`}
            >
              <option value="">Alle Prioritäten</option>
              {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(letter => (
                <option key={letter} value={letter}>Priorität {letter}</option>
              ))}
            </select>

            {/* Project Filter */}
            <select
              value={filterProjectId || ''}
              onChange={(e) => setFilterProjectId(e.target.value || null)}
              className={`px-3 py-2 ${theme.input} border rounded-lg text-sm`}
            >
              <option value="">Alle Projekte</option>
              {projects?.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            {/* Assignee Filter */}
            <select
              value={filterAssignee || ''}
              onChange={(e) => setFilterAssignee(e.target.value || null)}
              className={`px-3 py-2 ${theme.input} border rounded-lg text-sm`}
            >
              <option value="">Alle Personen</option>
              {staff?.map(s => (
                <option key={s.id} value={s.id}>
                  {s.first_name} {s.last_name}
                </option>
              ))}
            </select>

            {/* Due Date Filter */}
            <select
              value={filterDue || ''}
              onChange={(e) => setFilterDue(e.target.value || null)}
              className={`px-3 py-2 ${theme.input} border rounded-lg text-sm`}
            >
              <option value="">Alle Termine</option>
              <option value="overdue">Überfällig</option>
              <option value="today">Heute</option>
              <option value="week">Diese Woche</option>
            </select>

            {/* Group By */}
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
              className={`px-3 py-2 ${theme.input} border rounded-lg text-sm`}
            >
              <option value="none">Keine Gruppierung</option>
              <option value="priority">Nach Priorität</option>
              <option value="project">Nach Projekt</option>
              <option value="due">Nach Fälligkeit</option>
              <option value="assignee">Nach Person</option>
            </select>
          </div>
        )}
      </div>

      {/* Loading/Error States */}
      {tasksLoading && (
        <p className={theme.textMuted}>Aufgaben werden geladen...</p>
      )}

      {tasksError && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 mb-4">
          <p className="text-rose-500 text-sm">{tasksError}</p>
        </div>
      )}

      {/* Task Groups */}
      {!tasksLoading && allTasks.length === 0 && (
        <p className={theme.textMuted}>Keine Aufgaben gefunden.</p>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Show tasks grouped by project when viewing "Alle Aufgaben" */}
        {showingAllTasks ? (
          <div className="space-y-6">
            {/* Tasks without project */}
            {tasksByProject.noProject.length > 0 && (
              <div>
                <h3 className={`text-sm font-semibold mb-3 ${theme.textSecondary} uppercase tracking-wide`}>
                  Ohne Projekt
                  <span className={`ml-2 ${theme.textMuted} font-normal`}>
                    ({tasksByProject.noProject.length})
                  </span>
                </h3>
                <SortableContext
                  items={tasksByProject.noProject.map(t => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {tasksByProject.noProject.map(task => (
                      <SortableTaskItem
                        key={task.id}
                        task={task}
                        theme={theme}
                        staff={staff}
                        currentStaffId={currentStaff?.id}
                        onToggle={toggleTaskComplete}
                        onEdit={openTaskModal}
                        onDelete={deleteTask}
                      />
                    ))}
                  </div>
                </SortableContext>
              </div>
            )}

            {/* Tasks grouped by project */}
            {projects?.map(project => {
              const projectTasks = tasksByProject[project.id] || []
              if (projectTasks.length === 0) return null

              return (
                <div
                  key={project.id}
                  className="rounded-xl border-l-4 bg-[#f0f0f0]"
                  style={{ borderLeftColor: project.color }}
                >
                  {/* Clickable project header */}
                  <button
                    type="button"
                    onClick={() => openProjectModal(project)}
                    className="w-full p-4 pb-3 text-left hover:bg-[#e8e8e8] rounded-t-xl transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: project.color }}
                      />
                      <h3 className="text-base font-semibold text-[#5a5a5a] flex-1">
                        {project.name}
                      </h3>
                      <span className="text-xs text-[#999] bg-white/60 px-2 py-0.5 rounded-full">
                        {projectTasks.length} {projectTasks.length === 1 ? 'Aufgabe' : 'Aufgaben'}
                      </span>
                      <PencilSimple size={16} className="text-[#ccc]" />
                    </div>
                    {/* Project description */}
                    {project.description && (
                      <p className="mt-1 ml-6 text-sm text-[#888] line-clamp-2">
                        {project.description}
                      </p>
                    )}
                    {/* Project deadline */}
                    {project.deadline && (
                      <div className="mt-2 ml-6 flex items-center gap-1.5 text-xs text-[#999]">
                        <CalendarBlank size={14} />
                        <span>
                          Deadline: {new Date(project.deadline).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </span>
                      </div>
                    )}
                  </button>

                  {/* Tasks inside project */}
                  <SortableContext
                    items={projectTasks.map(t => t.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="px-4 pb-4 space-y-2">
                      {projectTasks.map(task => (
                        <SortableTaskItem
                          key={task.id}
                          task={task}
                          theme={theme}
                          staff={staff}
                          currentStaffId={currentStaff?.id}
                          onToggle={toggleTaskComplete}
                          onEdit={openTaskModal}
                          onDelete={deleteTask}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </div>
              )
            })}
          </div>
        ) : (
          /* Show tasks with standard grouping when a specific project is filtered */
          <div className="space-y-6">
            {sortedGroupKeys.map(groupKey => (
              <div key={groupKey}>
                {/* Keine Überschrift bei Priorität - die Badges zeigen das bereits */}
                {groupBy !== 'none' && groupBy !== 'priority' && (
                  <h3 className={`text-sm font-semibold mb-3 ${theme.textSecondary} uppercase tracking-wide`}>
                    {groupKey}
                    <span className={`ml-2 ${theme.textMuted} font-normal`}>
                      ({groupedTasks[groupKey].length})
                    </span>
                  </h3>
                )}
                <SortableContext
                  items={groupedTasks[groupKey].map(t => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {groupedTasks[groupKey].map(task => (
                      <SortableTaskItem
                        key={task.id}
                        task={task}
                        theme={theme}
                        staff={staff}
                        currentStaffId={currentStaff?.id}
                        onToggle={toggleTaskComplete}
                        onEdit={openTaskModal}
                        onDelete={deleteTask}
                      />
                    ))}
                  </div>
                </SortableContext>
              </div>
            ))}
          </div>
        )}

        {/* Drag Overlay - shows the task being dragged */}
        <DragOverlay>
          {activeTask ? (
            <div className="opacity-90 shadow-xl">
              <TaskItem
                task={activeTask}
                theme={theme}
                staff={staff}
                currentStaffId={currentStaff?.id}
                onToggle={() => {}}
                onEdit={() => {}}
                onDelete={() => {}}
                isDragging={true}
                dragHandleProps={{}}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </>
  )
}

export default TasksView
