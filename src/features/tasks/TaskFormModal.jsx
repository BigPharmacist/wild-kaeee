import { useState, useRef, useEffect } from 'react'
import { X, CalendarBlank, Question } from '@phosphor-icons/react'

// Recurrence Picker Component (sleek-style floating popup)
const RecurrencePicker = ({ taskForm, handleTaskInput }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 })
  const buttonRef = useRef(null)
  const popupRef = useRef(null)

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target) &&
          buttonRef.current && !buttonRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Calculate position when opening
  const handleOpen = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      // Position centered above the button
      setPopupPosition({
        top: rect.top - 10,
        left: rect.left + rect.width / 2,
      })
    }
    setIsOpen(!isOpen)
  }

  // Build display text
  const getDisplayText = () => {
    if (!taskForm.recurrenceInterval) return '-'
    const count = taskForm.recurrenceCount || 1
    const intervalLabels = { d: 'Tag', b: 'Arbeitstag', w: 'Woche', m: 'Monat', y: 'Jahr' }
    const label = intervalLabels[taskForm.recurrenceInterval] || ''
    const strict = taskForm.recurrenceStrict ? ' (streng)' : ''
    return `${count} ${label}${strict}`
  }

  // Clear recurrence
  const clearRecurrence = (e) => {
    e.stopPropagation()
    handleTaskInput('recurrenceInterval', null)
    handleTaskInput('recurrenceCount', 1)
    handleTaskInput('recurrenceStrict', false)
  }

  return (
    <div className="flex flex-col">
      <label className="text-[11px] text-[#ccc] mb-1">Wiederholung</label>

      {/* Trigger button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={handleOpen}
        className="h-[38px] px-3 bg-[#f0f0f0] rounded-[0.65em] text-sm text-[#5a5a5a] text-left flex items-center justify-between min-w-[120px] hover:bg-[#ebebeb] transition-colors"
      >
        <span>{getDisplayText()}</span>
        {taskForm.recurrenceInterval && (
          <button
            type="button"
            onClick={clearRecurrence}
            className="p-0.5 text-[#ccc] hover:text-[#5a5a5a]"
          >
            <X size={14} />
          </button>
        )}
      </button>

      {/* Fixed popup (no overlay) */}
      {isOpen && (
        <div
          ref={popupRef}
          className="fixed bg-white rounded-[0.65em] shadow-xl border border-[#ccc] p-4 z-[100]"
          style={{
            top: popupPosition.top,
            left: popupPosition.left,
            transform: 'translate(-50%, -100%)',
          }}
        >
            <div className="flex items-start gap-4">
              {/* Frequency */}
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs text-[#ccc]">Jeden</span>
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={taskForm.recurrenceCount || 1}
                  onChange={(e) => handleTaskInput('recurrenceCount', parseInt(e.target.value) || 1)}
                  className="w-14 h-9 px-2 bg-white rounded-[0.65em] text-sm text-[#5a5a5a] border border-[#ccc] text-center focus:ring-2 focus:ring-[#1976d2] focus:border-transparent"
                />
              </div>

              {/* Interval radio buttons */}
              <div className="flex flex-col gap-2">
                {[
                  { value: 'd', label: 'Tag' },
                  { value: 'b', label: 'Arbeitstag' },
                  { value: 'w', label: 'Woche' },
                  { value: 'm', label: 'Monat' },
                  { value: 'y', label: 'Jahr' },
                ].map(({ value, label }) => (
                  <label key={value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="recurrenceInterval"
                      value={value}
                      checked={taskForm.recurrenceInterval === value}
                      onChange={(e) => handleTaskInput('recurrenceInterval', e.target.value)}
                      className="w-4 h-4 accent-[#1976d2]"
                    />
                    <span className="text-sm text-[#5a5a5a]">{label}</span>
                  </label>
                ))}
              </div>

              {/* Strict checkbox */}
              <div className="flex flex-col justify-start">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={taskForm.recurrenceStrict || false}
                    onChange={(e) => handleTaskInput('recurrenceStrict', e.target.checked)}
                    className="w-4 h-4 accent-[#1976d2]"
                  />
                  <span className="text-sm text-[#5a5a5a]">Streng</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

const TaskFormModal = ({
  theme,
  editingTask,
  taskForm,
  taskSaving,
  taskSaveError,
  handleTaskInput,
  saveTaskFromModal,
  closeTaskModal,
  staff,
}) => {
  if (!editingTask) return null

  const isNew = !editingTask.id

  // Build preview text showing parsed syntax (todo.txt format)
  const buildPreviewText = () => {
    let parts = []
    if (taskForm.priority) parts.push(`(${taskForm.priority})`)
    if (taskForm.dueDate) parts.push(`due:${taskForm.dueDate}`)
    // Build recurrence string from components (sleek format: [+]<count><interval>)
    if (taskForm.recurrenceInterval) {
      const count = taskForm.recurrenceCount || 1
      const interval = taskForm.recurrenceInterval
      const strict = taskForm.recurrenceStrict ? '+' : ''
      parts.push(`rec:${strict}${count}${interval}`)
    }
    // Only show if there's something to preview
    if (parts.length === 0) return null
    return parts.join(' ')
  }

  const previewText = buildPreviewText()

  return (
    <div
      className="fixed inset-0 z-50 bg-[#2d2d2d]/40 flex items-center justify-center p-4"
      onClick={closeTaskModal}
    >
      <div
        className="bg-white rounded-[0.65em] shadow-xl w-full max-w-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Main input area (sleek-style) */}
        <div className="p-5 pb-4">
          {/* Task text input with preview */}
          <div className="relative">
            {/* Preview line showing parsed syntax */}
            {previewText && (
              <div className="text-[#5a5a5a] text-sm mb-1 font-mono">
                {previewText}
              </div>
            )}
            <div className="relative">
              <input
                type="text"
                value={taskForm.text}
                onChange={(e) => handleTaskInput('text', e.target.value)}
                placeholder="Klicken Sie auf die Hilfeschaltfläche, um zu erfahren, was Sie hier eingeben sollen"
                className="w-full pr-10 py-2 bg-transparent border-0 outline-none text-[#5a5a5a] text-base placeholder:text-[#ccc]"
                autoFocus
              />
              <button
                type="button"
                className="absolute right-0 top-1/2 -translate-y-1/2 text-[#ccc] hover:text-[#5a5a5a] p-1"
                title="Hilfe zur Eingabe"
              >
                <Question size={22} weight="light" />
              </button>
            </div>
          </div>

          {/* Fields row (sleek-style) */}
          <div className="flex items-end gap-2 mt-4 flex-wrap">
            {/* Priority */}
            <div className="flex flex-col">
              <label className="text-[11px] text-[#ccc] mb-1">Priorität</label>
              <select
                value={taskForm.priority || ''}
                onChange={(e) => handleTaskInput('priority', e.target.value || null)}
                className="h-[38px] px-3 bg-[#f0f0f0] rounded-[0.65em] text-sm text-[#5a5a5a] border-0 outline-none min-w-[70px] cursor-pointer focus:ring-2 focus:ring-[#1976d2]"
              >
                <option value="">-</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
              </select>
            </div>

            {/* Due Date */}
            <div className="flex flex-col">
              <label className="text-[11px] text-[#ccc] mb-1">Fälligkeitsdatum</label>
              <div className="h-[38px] flex items-center bg-[#f0f0f0] rounded-[0.65em]">
                <input
                  type="date"
                  value={taskForm.dueDate}
                  onChange={(e) => handleTaskInput('dueDate', e.target.value)}
                  className="h-full px-3 bg-transparent rounded-[0.65em] text-sm text-[#5a5a5a] border-0 outline-none w-[140px] focus:ring-2 focus:ring-[#1976d2]"
                />
                {taskForm.dueDate && (
                  <button
                    type="button"
                    onClick={() => handleTaskInput('dueDate', '')}
                    className="p-1 text-[#ccc] hover:text-[#5a5a5a]"
                  >
                    <X size={14} />
                  </button>
                )}
                <CalendarBlank size={16} className="mr-2 text-[#ccc]" />
              </div>
            </div>

            {/* Recurrence (sleek-style popover picker) */}
            <RecurrencePicker
              taskForm={taskForm}
              handleTaskInput={handleTaskInput}
            />

            {/* Assignee (Team feature) */}
            <div className="flex flex-col">
              <label className="text-[11px] text-[#ccc] mb-1">Zugewiesen</label>
              <select
                value={taskForm.assignedTo || ''}
                onChange={(e) => handleTaskInput('assignedTo', e.target.value || null)}
                className="h-[38px] px-3 bg-[#f0f0f0] rounded-[0.65em] text-sm text-[#5a5a5a] border-0 outline-none min-w-[100px] cursor-pointer focus:ring-2 focus:ring-[#1976d2]"
              >
                <option value="">-</option>
                {staff?.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.first_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Error message (sleek-style) */}
          {taskSaveError && (
            <div className="mt-4 bg-[#ff0000]/10 border border-[#ff0000]/20 rounded-[0.65em] px-3 py-2">
              <p className="text-[#ff0000] text-sm">{taskSaveError}</p>
            </div>
          )}
        </div>

        {/* Footer with text buttons (sleek-style) */}
        <div className="flex border-t border-[#ebebeb]">
          <button
            type="button"
            onClick={closeTaskModal}
            className="flex-1 px-4 py-3 text-sm font-medium text-[#5a5a5a] hover:bg-[#f0f0f0] transition-colors"
          >
            Abbrechen
          </button>
          <div className="w-px bg-[#ebebeb]" />
          <button
            type="button"
            onClick={saveTaskFromModal}
            disabled={taskSaving || !taskForm.text.trim()}
            className="flex-1 px-4 py-3 text-sm font-medium text-[#1976d2] hover:bg-[#f0f0f0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {taskSaving ? 'Speichern...' : (isNew ? 'Hinzufügen' : 'Speichern')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default TaskFormModal
