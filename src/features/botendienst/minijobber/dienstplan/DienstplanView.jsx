import { useState, useEffect, useCallback } from 'react'
import { CaretLeft, CaretRight, Copy, Rows, GridFour } from '@phosphor-icons/react'
import { useMjSchedules } from '../hooks/useMjSchedules'
import { WeekGrid } from './WeekGrid'
import { ShiftEditModal } from './ShiftEditModal'
import { StandardWeekManager } from './StandardWeekManager'

const dayNames = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']
const dayNamesFull = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag']

function getMonday(d) {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  date.setDate(diff)
  return date
}

function formatDate(d) {
  return d.toISOString().split('T')[0]
}

function addDays(d, days) {
  const result = new Date(d)
  result.setDate(result.getDate() + days)
  return result
}

export function DienstplanView({ theme, pharmacyId, profiles }) {
  const [viewMode, setViewMode] = useState('week') // 'week' or 'month'
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getMonday(new Date()))
  const [editModal, setEditModal] = useState(null)
  const [showStandardWeeks, setShowStandardWeeks] = useState(false)

  const schedulesHook = useMjSchedules({ pharmacyId })
  const { schedules, shifts, holidays, loading, fetchShifts, fetchSchedules, fetchHolidays,
    createScheduleEntry, updateScheduleEntry, deleteScheduleEntry,
    copyFromTwoWeeksAgo, deleteSchedulesForWeek } = schedulesHook

  // Calculate week dates
  const weekDates = Array.from({ length: 6 }, (_, i) => addDays(currentWeekStart, i))
  const weekEnd = weekDates[weekDates.length - 1]

  // Load shifts + schedules
  useEffect(() => {
    if (pharmacyId) {
      fetchShifts()
      fetchHolidays(currentWeekStart.getFullYear())
    }
  }, [pharmacyId, fetchShifts, fetchHolidays, currentWeekStart])

  useEffect(() => {
    if (pharmacyId && shifts.length > 0) {
      if (viewMode === 'week') {
        fetchSchedules(formatDate(currentWeekStart), formatDate(weekEnd))
      } else {
        // Month view: load full month
        const year = currentWeekStart.getFullYear()
        const month = currentWeekStart.getMonth()
        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)
        fetchSchedules(formatDate(firstDay), formatDate(lastDay))
      }
    }
  }, [pharmacyId, shifts, viewMode, currentWeekStart, fetchSchedules]) // eslint-disable-line react-hooks/exhaustive-deps

  const goToPreviousWeek = () => {
    setCurrentWeekStart(prev => addDays(prev, -7))
  }

  const goToNextWeek = () => {
    setCurrentWeekStart(prev => addDays(prev, 7))
  }

  const goToThisWeek = () => {
    setCurrentWeekStart(getMonday(new Date()))
  }

  const handleCellClick = (staffId, date) => {
    setEditModal({ staffId, date, existingSchedules: schedules.filter(s => s.staff_id === staffId && s.date === date) })
  }

  const handleCopyFromTwoWeeksAgo = async () => {
    const startStr = formatDate(currentWeekStart)
    const endStr = formatDate(weekEnd)
    const success = await copyFromTwoWeeksAgo(startStr, endStr)
    if (success) {
      fetchSchedules(startStr, endStr)
    }
  }

  const handleDeleteWeek = async () => {
    if (!confirm('Alle Einträge dieser Woche löschen?')) return
    const startStr = formatDate(currentWeekStart)
    const endStr = formatDate(weekEnd)
    await deleteSchedulesForWeek(startStr, endStr)
  }

  const handleSaveSchedule = async (staffId, date, shiftId) => {
    await createScheduleEntry(staffId, shiftId, date)
    setEditModal(null)
  }

  const handleDeleteSchedule = async (scheduleId) => {
    await deleteScheduleEntry(scheduleId)
    setEditModal(null)
  }

  const handleMarkAbsent = async (scheduleId, absent, reason) => {
    await updateScheduleEntry(scheduleId, { absent, absent_reason: reason || null })
    setEditModal(null)
  }

  // Holiday lookup
  const holidayMap = {}
  holidays.forEach(h => { holidayMap[h.date] = h.name })

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className={`${theme.surface} border ${theme.border} rounded-xl p-4`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button onClick={goToPreviousWeek} className={`p-1.5 rounded-lg ${theme.textSecondary} hover:bg-gray-100`}>
              <CaretLeft size={18} weight="bold" />
            </button>
            <span className={`text-sm font-semibold ${theme.textPrimary} min-w-[200px] text-center`}>
              {currentWeekStart.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
              {' – '}
              {weekEnd.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </span>
            <button onClick={goToNextWeek} className={`p-1.5 rounded-lg ${theme.textSecondary} hover:bg-gray-100`}>
              <CaretRight size={18} weight="bold" />
            </button>
            <button
              onClick={goToThisWeek}
              className={`ml-2 px-3 py-1.5 rounded-lg text-xs font-medium ${theme.textSecondary} hover:bg-gray-100 border ${theme.border}`}
            >
              Heute
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyFromTwoWeeksAgo}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${theme.textSecondary} hover:bg-gray-100 border ${theme.border}`}
              title="Schichtplan von vor 2 Wochen kopieren"
            >
              <Copy size={14} />
              Vor 2 Wo. kopieren
            </button>
            <button
              onClick={() => setShowStandardWeeks(true)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${theme.textSecondary} hover:bg-gray-100 border ${theme.border}`}
            >
              <GridFour size={14} />
              Standard-Woche
            </button>
            <button
              onClick={handleDeleteWeek}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 border border-red-200"
            >
              Woche löschen
            </button>
          </div>
        </div>
      </div>

      {/* Week Grid */}
      {loading && schedules.length === 0 ? (
        <div className={`${theme.surface} border ${theme.border} rounded-xl p-12 flex items-center justify-center`}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F59E0B]" />
        </div>
      ) : (
        <WeekGrid
          theme={theme}
          profiles={profiles}
          weekDates={weekDates}
          schedules={schedules}
          shifts={shifts}
          holidayMap={holidayMap}
          dayNames={dayNames}
          onCellClick={handleCellClick}
        />
      )}

      {/* Shift Edit Modal */}
      {editModal && (
        <ShiftEditModal
          theme={theme}
          isOpen={!!editModal}
          staffId={editModal.staffId}
          date={editModal.date}
          existingSchedules={editModal.existingSchedules}
          shifts={shifts}
          profiles={profiles}
          onSave={handleSaveSchedule}
          onDelete={handleDeleteSchedule}
          onMarkAbsent={handleMarkAbsent}
          onClose={() => setEditModal(null)}
        />
      )}

      {/* Standard Week Manager */}
      {showStandardWeeks && (
        <StandardWeekManager
          theme={theme}
          isOpen={showStandardWeeks}
          pharmacyId={pharmacyId}
          profiles={profiles}
          schedulesHook={schedulesHook}
          targetWeekStart={formatDate(currentWeekStart)}
          onClose={() => setShowStandardWeeks(false)}
          onApplied={() => {
            setShowStandardWeeks(false)
            fetchSchedules(formatDate(currentWeekStart), formatDate(weekEnd))
          }}
        />
      )}
    </div>
  )
}
