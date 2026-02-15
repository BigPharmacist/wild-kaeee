import { useState, useEffect } from 'react'
import { Clock, Check, Plus, Trash, PencilSimple } from '@phosphor-icons/react'
import { useMjWorkRecords } from '../hooks/useMjWorkRecords'
import { MjMonthSelector } from '../shared/MjMonthSelector'
import { MjShiftBadge } from '../shared/MjShiftBadge'
import { MjHoursDisplay } from '../shared/MjHoursDisplay'
import { WorkRecordEditModal } from './WorkRecordEditModal'
import { ManualEntryModal } from './ManualEntryModal'

export function ZeiterfassungView({ theme, pharmacyId, profiles }) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [activeTab, setActiveTab] = useState('offen') // 'offen' | 'erfasst'
  const [openSchedules, setOpenSchedules] = useState([])
  const [editModal, setEditModal] = useState(null)
  const [showManualModal, setShowManualModal] = useState(false)

  const { workRecords, manualHours, loading, fetchWorkRecords, fetchOpenSchedules, createWorkRecord, updateWorkRecord, deleteWorkRecord, fetchManualHours, createManualHours, deleteManualHours } = useMjWorkRecords({ pharmacyId })

  useEffect(() => {
    if (pharmacyId) {
      fetchWorkRecords(year, month)
      fetchManualHours(year, month)
      fetchOpenSchedules(year, month).then(setOpenSchedules)
    }
  }, [pharmacyId, year, month]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleMonthChange = (y, m) => {
    setYear(y)
    setMonth(m)
  }

  const handleSaveRecord = async (scheduleId, startTime, endTime) => {
    const result = await createWorkRecord(scheduleId, startTime, endTime)
    if (result) {
      setEditModal(null)
      // Remove from open list
      setOpenSchedules(prev => prev.filter(s => s.id !== scheduleId))
    }
  }

  const handleUpdateRecord = async (recordId, startTime, endTime) => {
    const success = await updateWorkRecord(recordId, startTime, endTime)
    if (success) setEditModal(null)
  }

  const handleDeleteRecord = async (recordId) => {
    if (!confirm('Zeiterfassung löschen?')) return
    await deleteWorkRecord(recordId)
  }

  const handleSaveManual = async (staffId, date, hours, description) => {
    const result = await createManualHours(staffId, date, hours, description)
    if (result) setShowManualModal(false)
  }

  // Group work records by staff
  const recordsByStaff = {}
  workRecords.forEach(wr => {
    const staffId = wr.schedule?.staff_id
    if (!staffId) return
    if (!recordsByStaff[staffId]) recordsByStaff[staffId] = []
    recordsByStaff[staffId].push(wr)
  })

  // Group manual hours by staff
  const manualByStaff = {}
  manualHours.forEach(mh => {
    if (!manualByStaff[mh.staff_id]) manualByStaff[mh.staff_id] = []
    manualByStaff[mh.staff_id].push(mh)
  })

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className={`${theme.surface} border ${theme.border} rounded-xl p-4`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <MjMonthSelector theme={theme} year={year} month={month} onChange={handleMonthChange} />
          <div className="flex items-center gap-2">
            {['offen', 'erfasst'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  activeTab === tab
                    ? 'bg-[#F59E0B] text-white'
                    : `${theme.textSecondary} hover:bg-gray-100 border ${theme.border}`
                }`}
              >
                {tab === 'offen' ? `Offen (${openSchedules.length})` : `Erfasst (${workRecords.length})`}
              </button>
            ))}
            <button
              onClick={() => setShowManualModal(true)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border ${theme.border} ${theme.textSecondary} hover:bg-gray-100`}
            >
              <Plus size={14} />
              Manuell
            </button>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className={`${theme.surface} border ${theme.border} rounded-xl p-12 flex items-center justify-center`}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F59E0B]" />
        </div>
      )}

      {/* Open Tab */}
      {!loading && activeTab === 'offen' && (
        <div className={`${theme.surface} border ${theme.border} rounded-xl overflow-hidden ${theme.cardShadow}`}>
          {openSchedules.length === 0 ? (
            <div className={`p-6 text-center ${theme.textMuted}`}>
              <Check size={24} className="mx-auto mb-1" />
              <p className="text-sm">Alle Schichten für diesen Monat sind erfasst</p>
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className={`px-3 py-1.5 text-left ${theme.textSecondary} font-medium`}>Datum</th>
                  <th className={`px-3 py-1.5 text-left ${theme.textSecondary} font-medium`}>Mitarbeiter</th>
                  <th className={`px-3 py-1.5 text-left ${theme.textSecondary} font-medium`}>Schicht</th>
                  <th className={`px-3 py-1.5 text-left ${theme.textSecondary} font-medium`}>Soll</th>
                  <th className={`px-3 py-1.5 text-center ${theme.textSecondary} font-medium`}>Aktion</th>
                </tr>
              </thead>
              <tbody>
                {openSchedules.map((sched, idx, arr) => {
                  const date = sched.date
                  // Count unique dates up to this index to determine color
                  let dateIdx = 0
                  let prevDate = null
                  for (let i = 0; i <= idx; i++) {
                    if (arr[i].date !== prevDate) {
                      if (prevDate !== null) dateIdx++
                      prevDate = arr[i].date
                    }
                  }
                  const rowBg = dateIdx % 2 === 1 ? 'bg-gray-100' : ''
                  return (
                  <tr key={sched.id} className={`border-b border-gray-50 ${rowBg}`}>
                    <td className={`px-3 py-1 ${theme.textPrimary}`}>
                      {new Date(sched.date).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                    </td>
                    <td className={`px-3 py-1 ${theme.textPrimary}`}>
                      {sched.staff?.first_name} {sched.staff?.last_name}
                    </td>
                    <td className="px-3 py-1">
                      <MjShiftBadge shiftName={sched.shift?.name} compact />
                    </td>
                    <td className={`px-3 py-1 ${theme.textSecondary}`}>
                      {sched.shift?.start_time?.substring(0, 5)} – {sched.shift?.end_time?.substring(0, 5)}
                    </td>
                    <td className="px-3 py-1 text-center">
                      <button
                        onClick={() => setEditModal({
                          mode: 'create',
                          scheduleId: sched.id,
                          defaultStart: sched.shift?.start_time?.substring(0, 5) || '',
                          defaultEnd: sched.shift?.end_time?.substring(0, 5) || '',
                          label: `${sched.staff?.first_name} – ${sched.shift?.name} – ${new Date(sched.date).toLocaleDateString('de-DE')}`,
                        })}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs ${theme.accent} text-white`}
                      >
                        <Clock size={13} />
                        Erfassen
                      </button>
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Recorded Tab */}
      {!loading && activeTab === 'erfasst' && (
        <div className="space-y-2">
          {profiles.map(profile => {
            const staffId = profile.staff_id
            const records = recordsByStaff[staffId] || []
            const manuals = manualByStaff[staffId] || []
            if (records.length === 0 && manuals.length === 0) return null

            const name = profile.staff
              ? `${profile.staff.first_name} ${profile.staff.last_name}`
              : 'Unbekannt'

            const totalActual = records.reduce((sum, wr) => sum + (parseFloat(wr.actual_hours) || 0), 0)
            const totalManual = manuals.reduce((sum, mh) => sum + (parseFloat(mh.hours) || 0), 0)
            const total = totalActual + totalManual

            // Build combined list sorted by date, then assign alternating color per date
            const allEntries = [
              ...records.map(wr => ({ type: 'record', date: wr.schedule?.date || '', data: wr })),
              ...manuals.map(mh => ({ type: 'manual', date: mh.date, data: mh })),
            ].sort((a, b) => a.date.localeCompare(b.date))

            const dateColorMap = {}
            let colorIdx = 0
            let lastDate = null
            allEntries.forEach(e => {
              if (e.date !== lastDate) {
                if (lastDate !== null) colorIdx++
                lastDate = e.date
              }
              dateColorMap[e.type + '-' + e.data.id] = colorIdx % 2 === 1
            })

            return (
              <div key={staffId} className={`${theme.surface} border ${theme.border} rounded-xl ${theme.cardShadow}`}>
                <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-100">
                  <span className={`font-semibold text-sm ${theme.textPrimary}`}>{name}</span>
                  <MjHoursDisplay hours={total} className="font-semibold text-sm" />
                </div>
                <table className="w-full text-xs">
                  <tbody>
                    {allEntries.map(entry => {
                      const isShaded = dateColorMap[entry.type + '-' + entry.data.id]
                      const rowBg = isShaded ? 'bg-gray-100' : ''

                      if (entry.type === 'record') {
                        const wr = entry.data
                        return (
                          <tr key={wr.id} className={`border-b border-gray-50 ${rowBg}`}>
                            <td className={`px-3 py-1 ${theme.textPrimary} w-[110px]`}>
                              {wr.schedule?.date ? new Date(wr.schedule.date).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' }) : '–'}
                            </td>
                            <td className="px-3 py-1 w-[90px]">
                              <MjShiftBadge shiftName={wr.schedule?.shift?.name} compact />
                            </td>
                            <td className={`px-3 py-1 ${theme.textSecondary}`}>
                              {wr.actual_start_time?.substring(0, 5)} – {wr.actual_end_time?.substring(0, 5)}
                            </td>
                            <td className={`px-3 py-1 ${theme.textPrimary} font-medium w-[70px]`}>
                              {parseFloat(wr.actual_hours || 0).toFixed(2).replace('.', ',')} h
                            </td>
                            <td className="px-2 py-1 w-[60px] text-right">
                              <button
                                onClick={() => setEditModal({
                                  mode: 'edit',
                                  recordId: wr.id,
                                  defaultStart: wr.actual_start_time?.substring(0, 5) || '',
                                  defaultEnd: wr.actual_end_time?.substring(0, 5) || '',
                                  label: `${name} – ${wr.schedule?.shift?.name} – ${wr.schedule?.date ? new Date(wr.schedule.date).toLocaleDateString('de-DE') : ''}`,
                                })}
                                className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                              >
                                <PencilSimple size={13} />
                              </button>
                              <button
                                onClick={() => handleDeleteRecord(wr.id)}
                                className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50"
                              >
                                <Trash size={13} />
                              </button>
                            </td>
                          </tr>
                        )
                      }

                      const mh = entry.data
                      return (
                        <tr key={`manual-${mh.id}`} className={`border-b border-gray-50 ${isShaded ? 'bg-blue-100/60' : 'bg-blue-50/30'}`}>
                          <td className={`px-3 py-1 ${theme.textPrimary}`}>
                            {new Date(mh.date).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                          </td>
                          <td className="px-3 py-1">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-700">Manuell</span>
                          </td>
                          <td className={`px-3 py-1 ${theme.textSecondary}`}>
                            {mh.description || '–'}
                          </td>
                          <td className={`px-3 py-1 ${theme.textPrimary} font-medium`}>
                            {parseFloat(mh.hours).toFixed(2).replace('.', ',')} h
                          </td>
                          <td className="px-2 py-1 text-right">
                            <button
                              onClick={() => deleteManualHours(mh.id)}
                              className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash size={13} />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )
          })}

          {workRecords.length === 0 && manualHours.length === 0 && (
            <div className={`${theme.surface} border ${theme.border} rounded-xl p-8 text-center ${theme.textMuted}`}>
              Noch keine Zeiterfassungen für diesen Monat
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {editModal && (
        <WorkRecordEditModal
          theme={theme}
          isOpen={!!editModal}
          mode={editModal.mode}
          label={editModal.label}
          defaultStart={editModal.defaultStart}
          defaultEnd={editModal.defaultEnd}
          onSave={(start, end) => {
            if (editModal.mode === 'create') {
              handleSaveRecord(editModal.scheduleId, start, end)
            } else {
              handleUpdateRecord(editModal.recordId, start, end)
            }
          }}
          onClose={() => setEditModal(null)}
        />
      )}

      {showManualModal && (
        <ManualEntryModal
          theme={theme}
          isOpen={showManualModal}
          profiles={profiles}
          year={year}
          month={month}
          onSave={handleSaveManual}
          onClose={() => setShowManualModal(false)}
        />
      )}
    </div>
  )
}
