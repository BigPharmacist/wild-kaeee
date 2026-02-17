import { useState, useEffect, useMemo } from 'react'
import { CaretLeft, CaretRight, Copy, GridFour, CalendarBlank, ListBullets, FilePdf } from '@phosphor-icons/react'
import { useMjSchedules } from '../hooks/useMjSchedules'
import { WeekGrid } from './WeekGrid'
import { MonthTable } from './MonthTable'
import { ShiftEditModal } from './ShiftEditModal'
import { StandardWeekManager } from './StandardWeekManager'
import { generateDienstplanPdf } from './DienstplanPdf'
import { MjHoursDisplay } from '../shared/MjHoursDisplay'

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
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function addDays(d, days) {
  const result = new Date(d)
  result.setDate(result.getDate() + days)
  return result
}

export function DienstplanView({ theme, pharmacyId, profiles, pharmacyName }) {
  const [viewMode, setViewMode] = useState('week') // 'week' or 'month'
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getMonday(new Date()))
  const [currentMonth, setCurrentMonth] = useState(() => ({ year: new Date().getFullYear(), month: new Date().getMonth() }))
  const [editModal, setEditModal] = useState(null)
  const [showStandardWeeks, setShowStandardWeeks] = useState(false)

  const schedulesHook = useMjSchedules({ pharmacyId })
  const { schedules, shifts, holidays, loading, fetchShifts, fetchSchedules, fetchHolidays,
    createScheduleEntry, updateScheduleEntry, deleteScheduleEntry,
    copyFromTwoWeeksAgo, deleteSchedulesForWeek } = schedulesHook

  // Calculate week dates
  const weekDates = Array.from({ length: 6 }, (_, i) => addDays(currentWeekStart, i))
  const weekEnd = weekDates[weekDates.length - 1]

  // Month date range
  const monthFirstDay = useMemo(() => new Date(currentMonth.year, currentMonth.month, 1), [currentMonth])
  const monthLastDay = useMemo(() => new Date(currentMonth.year, currentMonth.month + 1, 0), [currentMonth])
  const monthLabel = monthFirstDay.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })

  // Load shifts + schedules
  useEffect(() => {
    if (pharmacyId) {
      fetchShifts()
      const year = viewMode === 'month' ? currentMonth.year : currentWeekStart.getFullYear()
      fetchHolidays(year)
    }
  }, [pharmacyId, fetchShifts, fetchHolidays, currentWeekStart, currentMonth, viewMode])

  useEffect(() => {
    if (pharmacyId && shifts.length > 0) {
      if (viewMode === 'week') {
        fetchSchedules(formatDate(currentWeekStart), formatDate(weekEnd))
      } else {
        fetchSchedules(formatDate(monthFirstDay), formatDate(monthLastDay))
      }
    }
  }, [pharmacyId, shifts, viewMode, currentWeekStart, monthFirstDay, monthLastDay, fetchSchedules]) // eslint-disable-line react-hooks/exhaustive-deps

  // Week navigation
  const goToPreviousWeek = () => setCurrentWeekStart(prev => addDays(prev, -7))
  const goToNextWeek = () => setCurrentWeekStart(prev => addDays(prev, 7))
  const goToThisWeek = () => setCurrentWeekStart(getMonday(new Date()))

  // Month navigation
  const goToPreviousMonth = () => setCurrentMonth(prev => {
    const m = prev.month - 1
    return m < 0 ? { year: prev.year - 1, month: 11 } : { year: prev.year, month: m }
  })
  const goToNextMonth = () => setCurrentMonth(prev => {
    const m = prev.month + 1
    return m > 11 ? { year: prev.year + 1, month: 0 } : { year: prev.year, month: m }
  })
  const goToThisMonth = () => setCurrentMonth({ year: new Date().getFullYear(), month: new Date().getMonth() })

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

  const activeProfiles = profiles.filter(p => p.active)

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className={`${theme.surface} border ${theme.border} rounded-xl p-4`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className={`flex rounded-lg border ${theme.border} overflow-hidden mr-2`}>
              <button
                onClick={() => setViewMode('week')}
                className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium transition-colors ${
                  viewMode === 'week' ? 'bg-[#FEF3C7] text-[#1E293B]' : `${theme.textSecondary} hover:bg-gray-50`
                }`}
              >
                <CalendarBlank size={14} />
                Woche
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium transition-colors border-l ${theme.border} ${
                  viewMode === 'month' ? 'bg-[#FEF3C7] text-[#1E293B]' : `${theme.textSecondary} hover:bg-gray-50`
                }`}
              >
                <ListBullets size={14} />
                Monat
              </button>
            </div>

            {/* Navigation */}
            <button
              onClick={viewMode === 'week' ? goToPreviousWeek : goToPreviousMonth}
              className={`p-1.5 rounded-lg ${theme.textSecondary} hover:bg-gray-100`}
            >
              <CaretLeft size={18} weight="bold" />
            </button>
            <span className={`text-sm font-semibold ${theme.textPrimary} min-w-[200px] text-center`}>
              {viewMode === 'week' ? (
                <>
                  {currentWeekStart.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                  {' – '}
                  {weekEnd.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </>
              ) : (
                monthLabel
              )}
            </span>
            <button
              onClick={viewMode === 'week' ? goToNextWeek : goToNextMonth}
              className={`p-1.5 rounded-lg ${theme.textSecondary} hover:bg-gray-100`}
            >
              <CaretRight size={18} weight="bold" />
            </button>
            <button
              onClick={viewMode === 'week' ? goToThisWeek : goToThisMonth}
              className={`ml-2 px-3 py-1.5 rounded-lg text-xs font-medium ${theme.textSecondary} hover:bg-gray-100 border ${theme.border}`}
            >
              Heute
            </button>
          </div>

          {viewMode === 'month' && (
            <button
              onClick={() => generateDienstplanPdf({
                year: currentMonth.year,
                month: currentMonth.month,
                schedules,
                shifts,
                profiles,
                holidays,
                pharmacyName,
              })}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200`}
            >
              <FilePdf size={14} weight="bold" />
              PDF
            </button>
          )}

          {viewMode === 'week' && (
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
          )}
        </div>
      </div>

      {/* Stundenstände */}
      {activeProfiles.length > 0 && (
        <div className={`${theme.surface} border ${theme.border} rounded-xl p-3`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-semibold ${theme.textPrimary}`}>Stundenstände</span>
            <span className={`text-xs ${theme.textMuted}`}>kumuliert</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {activeProfiles.map(p => {
              const name = p.staff ? `${p.staff.first_name} ${p.staff.last_name}` : 'Unbekannt'
              const initials = p.initials || name.split(' ').map(n => n[0]).join('').toUpperCase()
              return (
                <div key={p.id} className={`min-w-[160px] flex items-center justify-between gap-2 px-3 py-2 rounded-lg border ${theme.border} bg-white`}>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#F59E0B]/10 flex items-center justify-center text-xs font-semibold text-[#F59E0B]">
                      {initials}
                    </div>
                    <span className={`text-xs ${theme.textSecondary}`}>{name}</span>
                  </div>
                  <MjHoursDisplay hours={p.hours_balance} showSign className="text-sm font-semibold" />
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Grid / Table */}
      {loading && schedules.length === 0 ? (
        <div className={`${theme.surface} border ${theme.border} rounded-xl p-12 flex items-center justify-center`}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F59E0B]" />
        </div>
      ) : viewMode === 'week' ? (
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
      ) : (
        <MonthTable
          theme={theme}
          profiles={profiles}
          schedules={schedules}
          shifts={shifts}
          holidayMap={holidayMap}
          year={currentMonth.year}
          month={currentMonth.month}
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
