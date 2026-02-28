import { useState, useEffect, useMemo, useRef } from 'react'
import { CaretLeft, CaretRight, CalendarBlank, ListBullets, FilePdf, WhatsappLogo, X, PaperPlaneTilt, Warning } from '@phosphor-icons/react'
import { useMjSchedules } from '../hooks/useMjSchedules'
import { WeekGrid } from './WeekGrid'
import { MonthTable } from './MonthTable'
import { StaffPickerModal } from './StaffPickerModal'
import { generateDienstplanPdf } from './DienstplanPdf'
import { PdfPreviewModal } from '../shared/PdfPreviewModal'

const dayNames = ['Mo', 'Di', 'Mi', 'Do', 'Fr']

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
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false)
  const [whatsAppText, setWhatsAppText] = useState('')
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false)
  const [whatsAppMessage, setWhatsAppMessage] = useState(null)
  const [copySourceWeek, setCopySourceWeek] = useState(null)
  const [pasteTarget, setPasteTarget] = useState(null)
  const [pdfPreview, setPdfPreview] = useState(null)
  const whatsAppTextRef = useRef(null)

  const schedulesHook = useMjSchedules({ pharmacyId })
  const { schedules, shifts, holidays, loading, fetchShifts, fetchSchedules, fetchHolidays,
    createScheduleEntry, updateScheduleEntry, deleteScheduleEntry,
    copyWeekToWeek, deleteSchedulesForWeek } = schedulesHook

  // Calculate week dates
  const weekDates = Array.from({ length: 5 }, (_, i) => addDays(currentWeekStart, i))
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

  // Escape to cancel copy mode
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setCopySourceWeek(null)
    }
    if (copySourceWeek) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [copySourceWeek])

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

  const handleCellClick = (shiftId, date, currentStaffId) => {
    const existingEntry = currentStaffId
      ? schedules.find(s => s.staff_id === currentStaffId && s.date === date && s.shift_id === shiftId)
      : null
    setEditModal({ shiftId, date, currentStaffId, existingEntry })
  }

  const handleDeleteWeek = async () => {
    if (!confirm('Alle Einträge dieser Woche löschen?')) return
    const startStr = formatDate(currentWeekStart)
    const endStr = formatDate(weekEnd)
    await deleteSchedulesForWeek(startStr, endStr)
  }

  const handleDeleteMonthWeek = async (startDate, endDate, kw) => {
    if (!confirm(`Alle Einträge in KW ${kw} löschen?`)) return
    await deleteSchedulesForWeek(startDate, endDate)
    fetchSchedules(formatDate(monthFirstDay), formatDate(monthLastDay))
  }

  const handleAssignStaff = async (staffId) => {
    if (!editModal) return
    const { shiftId, date, existingEntry } = editModal
    if (existingEntry) {
      // Reassign: delete old, create new
      await deleteScheduleEntry(existingEntry.id)
    }
    await createScheduleEntry(staffId, shiftId, date)
    setEditModal(null)
  }

  const handleRemoveAssignment = async () => {
    if (!editModal?.existingEntry) return
    await deleteScheduleEntry(editModal.existingEntry.id)
    setEditModal(null)
  }

  const handleToggleAbsent = async (absent) => {
    if (!editModal?.existingEntry) return
    await updateScheduleEntry(editModal.existingEntry.id, { absent, absent_reason: absent ? 'Abwesend' : null })
    setEditModal(null)
  }

  const handleConfirmPaste = async () => {
    if (!copySourceWeek || !pasteTarget) return
    const success = await copyWeekToWeek(copySourceWeek.startDate, copySourceWeek.endDate, pasteTarget.startDate)
    if (success) {
      fetchSchedules(formatDate(monthFirstDay), formatDate(monthLastDay))
    }
    setCopySourceWeek(null)
    setPasteTarget(null)
  }

  const monthNamesDE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']

  const openWhatsAppModal = () => {
    setWhatsAppText('')
    setWhatsAppMessage(null)
    setShowWhatsAppModal(true)
    setTimeout(() => whatsAppTextRef.current?.focus(), 50)
  }

  const handleSendWhatsApp = async () => {
    setSendingWhatsApp(true)
    setWhatsAppMessage(null)
    try {
      const blob = generateDienstplanPdf({
        year: currentMonth.year,
        month: currentMonth.month,
        schedules, shifts, profiles, holidays, pharmacyName,
        returnBlob: true,
      })

      const monthName = monthNamesDE[currentMonth.month]
      const fileName = `Dienstplan_${monthName}_${currentMonth.year}.pdf`

      const baseText = `Dienstplan Botendienst für ${monthName} ${currentMonth.year} im Anhang.`
      const fullText = whatsAppText.trim()
        ? `${baseText}\n\n${whatsAppText.trim()}`
        : baseText

      // Convert blob to base64 (chunked to avoid call stack overflow)
      const arrayBuffer = await blob.arrayBuffer()
      const bytes = new Uint8Array(arrayBuffer)
      let binary = ''
      for (let i = 0; i < bytes.length; i += 8192) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192))
      }
      const base64 = btoa(binary)

      const res = await fetch('/api/wa/', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer bfd1b0f60654a512fdc21a08dfeb44f542d5f1bba3843478',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: fullText,
          pdf: base64,
          filename: fileName,
        }),
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.error || `HTTP ${res.status}`)

      setShowWhatsAppModal(false)
      setWhatsAppMessage({ type: 'success', text: 'Dienstplan per WhatsApp gesendet' })
      setTimeout(() => setWhatsAppMessage(null), 3000)
    } catch (err) {
      console.error('WhatsApp-Versand fehlgeschlagen:', err)
      setWhatsAppMessage({ type: 'error', text: err.message || 'Versand fehlgeschlagen' })
    } finally {
      setSendingWhatsApp(false)
    }
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
            {/* View Mode Toggle */}
            <div className={`flex rounded-lg border ${theme.border} overflow-hidden mr-2`}>
              <button
                onClick={() => setViewMode('week')}
                className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium transition-colors ${
                  viewMode === 'week' ? 'bg-[#FEE2E2] text-[#1E293B]' : `${theme.textSecondary} hover:bg-gray-50`
                }`}
              >
                <CalendarBlank size={14} />
                Woche
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium transition-colors border-l ${theme.border} ${
                  viewMode === 'month' ? 'bg-[#FEE2E2] text-[#1E293B]' : `${theme.textSecondary} hover:bg-gray-50`
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
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const result = generateDienstplanPdf({
                    year: currentMonth.year,
                    month: currentMonth.month,
                    schedules,
                    shifts,
                    profiles,
                    holidays,
                    pharmacyName,
                  })
                  setPdfPreview(result)
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200"
              >
                <FilePdf size={14} weight="bold" />
                PDF
              </button>
              <button
                onClick={openWhatsAppModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 border border-green-200"
              >
                <WhatsappLogo size={14} weight="bold" />
                WhatsApp
              </button>
              {whatsAppMessage && (
                <span className={`text-xs font-medium ${whatsAppMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                  {whatsAppMessage.text}
                </span>
              )}
            </div>
          )}

          {viewMode === 'week' && (
            <div className="flex items-center gap-2">
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

      {/* Grid / Table */}
      {loading && schedules.length === 0 ? (
        <div className={`${theme.surface} border ${theme.border} rounded-xl p-12 flex items-center justify-center`}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#DC2626]" />
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
          copySourceWeek={copySourceWeek}
          onCopySource={setCopySourceWeek}
          onPasteWeek={setPasteTarget}
          onDeleteWeek={handleDeleteMonthWeek}
        />
      )}

      {/* Staff Picker Modal */}
      {editModal && (
        <StaffPickerModal
          theme={theme}
          shiftId={editModal.shiftId}
          date={editModal.date}
          currentStaffId={editModal.currentStaffId}
          existingEntry={editModal.existingEntry}
          shifts={shifts}
          profiles={profiles}
          onAssign={handleAssignStaff}
          onRemove={handleRemoveAssignment}
          onMarkAbsent={handleToggleAbsent}
          onClose={() => setEditModal(null)}
        />
      )}

      {/* Copy Week Confirmation Modal */}
      {pasteTarget && copySourceWeek && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className={`${theme.surface} rounded-xl shadow-xl w-full max-w-sm mx-4`}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#CBD5E1]">
              <div className="flex items-center gap-2">
                <Warning size={20} weight="bold" className="text-red-500" />
                <h3 className={`text-sm font-semibold ${theme.textPrimary}`}>
                  Woche kopieren
                </h3>
              </div>
              <button
                onClick={() => setPasteTarget(null)}
                className={`p-1 rounded-lg ${theme.textSecondary} hover:bg-gray-100`}
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-5 py-4">
              <p className={`text-sm ${theme.textPrimary}`}>
                KW {copySourceWeek.kw} → KW {pasteTarget.kw} kopieren?
              </p>
              <p className={`text-xs ${theme.textSecondary} mt-1`}>
                Bestehende Einträge in KW {pasteTarget.kw} werden überschrieben.
              </p>
            </div>
            <div className="flex justify-end gap-2 px-5 py-3 border-t border-[#CBD5E1]">
              <button
                onClick={() => setPasteTarget(null)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium ${theme.textSecondary} hover:bg-gray-100 border ${theme.border}`}
              >
                Abbrechen
              </button>
              <button
                onClick={handleConfirmPaste}
                className="px-4 py-1.5 rounded-lg text-xs font-medium text-white bg-[#DC2626] hover:bg-[#B91C1C]"
              >
                Kopieren
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Send Modal */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className={`${theme.surface} rounded-xl shadow-xl w-full max-w-md mx-4`}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#CBD5E1]">
              <div className="flex items-center gap-2">
                <WhatsappLogo size={20} weight="bold" className="text-green-600" />
                <h3 className={`text-sm font-semibold ${theme.textPrimary}`}>
                  Dienstplan per WhatsApp senden
                </h3>
              </div>
              <button
                onClick={() => setShowWhatsAppModal(false)}
                className={`p-1 rounded-lg ${theme.textSecondary} hover:bg-gray-100`}
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <p className={`text-xs ${theme.textSecondary}`}>
                {monthNamesDE[currentMonth.month]} {currentMonth.year} — PDF wird als Anhang mitgesendet.
              </p>
              <textarea
                ref={whatsAppTextRef}
                value={whatsAppText}
                onChange={e => setWhatsAppText(e.target.value)}
                placeholder="Zusätzliche Nachricht (optional)"
                rows={3}
                className={`w-full rounded-lg border ${theme.border} px-3 py-2 text-sm ${theme.textPrimary} placeholder-[#94A3B8] focus:border-green-500 focus:ring-1 focus:ring-green-500 resize-none`}
              />
              {whatsAppMessage && (
                <p className={`text-xs font-medium ${whatsAppMessage.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                  {whatsAppMessage.text}
                </p>
              )}
            </div>
            <div className="flex justify-end gap-2 px-5 py-3 border-t border-[#CBD5E1]">
              <button
                onClick={() => setShowWhatsAppModal(false)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium ${theme.textSecondary} hover:bg-gray-100 border ${theme.border}`}
              >
                Abbrechen
              </button>
              <button
                onClick={handleSendWhatsApp}
                disabled={sendingWhatsApp}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                {sendingWhatsApp ? (
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white" />
                ) : (
                  <PaperPlaneTilt size={14} weight="bold" />
                )}
                Senden
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Preview */}
      {pdfPreview && (
        <PdfPreviewModal
          theme={theme}
          blob={pdfPreview.blob}
          fileName={pdfPreview.fileName}
          onClose={() => setPdfPreview(null)}
        />
      )}
    </div>
  )
}
