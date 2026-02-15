import { useState, useEffect } from 'react'
import { X, FloppyDisk, Play } from '@phosphor-icons/react'

const weekDays = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag']

export function StandardWeekManager({ theme, isOpen, pharmacyId, profiles, schedulesHook, targetWeekStart, onClose, onApplied }) {
  const { shifts, standardWeeks, fetchStandardWeeks, saveStandardWeek, applyStandardWeek } = schedulesHook
  const [activeWeek, setActiveWeek] = useState(1)
  const [weekName, setWeekName] = useState('')
  const [weekData, setWeekData] = useState({})
  const [saving, setSaving] = useState(false)

  const activeProfiles = profiles.filter(p => p.active)

  useEffect(() => {
    if (isOpen) {
      fetchStandardWeeks()
    }
  }, [isOpen, fetchStandardWeeks])

  useEffect(() => {
    const week = standardWeeks.find(w => w.week_number === activeWeek)
    if (week) {
      setWeekName(week.name || `Rollierung ${activeWeek}`)
      setWeekData(week.schedule_data || {})
    } else {
      setWeekName(`Rollierung ${activeWeek}`)
      setWeekData({})
    }
  }, [activeWeek, standardWeeks])

  const toggleAssignment = (day, staffId, shiftId) => {
    setWeekData(prev => {
      const dayData = prev[day] || []
      const exists = dayData.some(a => a.staff_id === staffId && a.shift_id === shiftId)

      const newDayData = exists
        ? dayData.filter(a => !(a.staff_id === staffId && a.shift_id === shiftId))
        : [...dayData, { staff_id: staffId, shift_id: shiftId }]

      return { ...prev, [day]: newDayData }
    })
  }

  const isAssigned = (day, staffId, shiftId) => {
    return (weekData[day] || []).some(a => a.staff_id === staffId && a.shift_id === shiftId)
  }

  const handleSave = async () => {
    setSaving(true)
    await saveStandardWeek(activeWeek, weekName, weekData)
    setSaving(false)
  }

  const handleApply = async () => {
    if (!confirm(`Rollierung "${weekName}" auf die Woche ab ${new Date(targetWeekStart).toLocaleDateString('de-DE')} anwenden?`)) return
    setSaving(true)
    const success = await applyStandardWeek(activeWeek, targetWeekStart)
    setSaving(false)
    if (success) {
      onApplied()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative ${theme.surface} rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <h2 className={`text-lg font-semibold ${theme.textPrimary}`}>Standard-Wochen (Rollierungen)</h2>
          <button onClick={onClose} className={`p-2 rounded-lg ${theme.textSecondary} ${theme.bgHover}`}>
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Week Tabs */}
          <div className="flex items-center gap-2">
            {[1, 2].map(n => (
              <button
                key={n}
                onClick={() => setActiveWeek(n)}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  activeWeek === n
                    ? 'bg-[#F59E0B] text-white'
                    : `${theme.textSecondary} hover:bg-gray-100 border ${theme.border}`
                }`}
              >
                Rollierung {n}
              </button>
            ))}

            <div className="flex-1" />

            <input
              type="text"
              value={weekName}
              onChange={(e) => setWeekName(e.target.value)}
              className={`px-3 py-2 rounded-lg border text-sm ${theme.input} w-48`}
              placeholder="Name der Rollierung"
            />
          </div>

          {/* Grid */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className={`px-3 py-2 text-left ${theme.textSecondary} font-medium`}>Mitarbeiter</th>
                  <th className={`px-3 py-2 text-left ${theme.textSecondary} font-medium`}>Schicht</th>
                  {weekDays.map(day => (
                    <th key={day} className={`px-2 py-2 text-center ${theme.textSecondary} font-medium`}>
                      {day.substring(0, 2)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeProfiles.map((profile) => {
                  const name = profile.staff
                    ? `${profile.staff.first_name} ${profile.staff.last_name}`
                    : '?'
                  return shifts.map((shift, si) => (
                    <tr key={`${profile.id}-${shift.id}`} className={si === 0 ? 'border-t border-gray-100' : ''}>
                      {si === 0 && (
                        <td className={`px-3 py-1.5 font-medium ${theme.textPrimary}`} rowSpan={shifts.length}>
                          {name}
                        </td>
                      )}
                      <td className={`px-3 py-1.5 ${theme.textSecondary}`}>{shift.name}</td>
                      {weekDays.map(day => {
                        const assigned = isAssigned(day, profile.staff_id, shift.id)
                        return (
                          <td key={day} className="px-2 py-1.5 text-center">
                            <button
                              onClick={() => toggleAssignment(day, profile.staff_id, shift.id)}
                              className={`w-7 h-7 rounded-md text-xs font-bold transition-colors ${
                                assigned
                                  ? 'bg-[#F59E0B] text-white'
                                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                              }`}
                            >
                              {assigned ? '✓' : ''}
                            </button>
                          </td>
                        )
                      })}
                    </tr>
                  ))
                })}
              </tbody>
            </table>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              onClick={handleSave}
              disabled={saving}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${theme.border} ${theme.textSecondary} hover:bg-gray-100`}
            >
              <FloppyDisk size={16} />
              Speichern
            </button>
            <button
              onClick={handleApply}
              disabled={saving}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${theme.accent} text-white`}
            >
              <Play size={16} weight="bold" />
              Auf aktuelle Woche anwenden
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
