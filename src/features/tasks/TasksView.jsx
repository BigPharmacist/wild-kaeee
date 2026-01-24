import { useState } from 'react'
import { Plus, CaretDown, Trash, PencilSimple, FunnelSimple, Circle, CheckCircle } from '@phosphor-icons/react'

// Priority colors for left bar and badge (sleek-style)
const priorityColors = {
  A: { bar: 'bg-[#ff0000]', badge: 'bg-[#ff0000]', text: 'text-white' },
  B: { bar: 'bg-[#fd7d67]', badge: 'bg-[#fd7d67]', text: 'text-white' },
  C: { bar: 'bg-[#ffdd57]', badge: 'bg-[#ffdd57]', text: 'text-[#5a5a5a]' },
}

// Tag Pill Component (sleek-style colored pills)
const TagPill = ({ label, value, isOverdue, type }) => {
  // sleek color scheme: projects=purple, contexts=green, due=red if overdue
  const getColors = () => {
    if (isOverdue) return 'bg-[#ff0000]/10 text-[#ff0000]'
    if (type === 'project') return 'bg-[#f1d6f1] text-[#6f266f]'
    if (type === 'context') return 'bg-[#c5ede3] text-[#1e6251]'
    if (type === 'due') return 'bg-[#ebebeb] text-[#5a5a5a]'
    if (type === 'rec') return 'bg-[#ebebeb] text-[#5a5a5a]'
    return 'bg-[#ebebeb] text-[#5a5a5a]'
  }

  return (
    <span className={`
      inline-flex items-center gap-1 px-2 py-0.5 rounded-[0.65em] text-xs font-medium
      ${getColors()}
    `}>
      {label && <span className="opacity-70">{label}</span>}
      <span>{value}</span>
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
        transition-all hover:bg-[#f0f0f0] group cursor-pointer
      `}>
        {/* Colored left bar based on priority */}
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${barColor}`} />

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

        {/* Task Content */}
        <div className="flex-1 min-w-0">
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
            {assignee && task.assigned_to !== currentStaffId && (
              <TagPill label="@" value={assignee.first_name} type="context" />
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

  // Actions
  createTask,
  toggleTaskComplete,
  deleteTask,
  openTaskModal,
}) => {
  const [showFilters, setShowFilters] = useState(false)

  // Quick add submission
  const handleQuickAdd = async (e) => {
    e.preventDefault()
    if (quickAddInput.trim()) {
      await createTask(quickAddInput)
    }
  }

  // Group order for display
  const groupOrder = {
    priority: ['Priorität A', 'Priorität B', 'Priorität C', 'Ohne Priorität'],
    due: ['Überfällig', 'Heute', 'Zukünftig', 'Ohne Fälligkeit'],
  }

  const sortedGroupKeys = Object.keys(groupedTasks).sort((a, b) => {
    const order = groupOrder[groupBy]
    if (order) {
      return (order.indexOf(a) - order.indexOf(b)) || a.localeCompare(b)
    }
    return a.localeCompare(b)
  })

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
              className="rounded accent-[#F59E0B]"
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
              <option value="A">Priorität A</option>
              <option value="B">Priorität B</option>
              <option value="C">Priorität C</option>
            </select>

            {/* Project Filter */}
            <select
              value={filterProject || ''}
              onChange={(e) => setFilterProject(e.target.value || null)}
              className={`px-3 py-2 ${theme.input} border rounded-lg text-sm`}
            >
              <option value="">Alle Projekte</option>
              {allProjects.map(p => (
                <option key={p} value={p}>+{p}</option>
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
      {!tasksLoading && sortedGroupKeys.length === 0 && (
        <p className={theme.textMuted}>Keine Aufgaben gefunden.</p>
      )}

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
            <div className="space-y-2">
              {groupedTasks[groupKey].map(task => (
                <TaskItem
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
          </div>
        ))}
      </div>
    </>
  )
}

export default TasksView
