import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

// Bereitschaft-Termine 2026
const NOTDIENST_TERMINE_2026 = [
  '2026-01-09',
  '2026-01-20',
  '2026-02-14',
  '2026-02-23',
  '2026-03-24',
  '2026-05-05',
  '2026-05-24',
  '2026-06-05',
  '2026-06-13',
  '2026-06-23',
  '2026-08-03',
  '2026-08-14',
  '2026-09-16',
  '2026-10-04',
  '2026-10-31',
  '2026-12-01',
]

const NOTDIENST_CALENDAR_COLOR = '#722F37' // Bordeaux-rot für Bereitschaft

const BereitschaftplanungView = ({ theme, staff, session }) => {
  const [assignments, setAssignments] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(null)
  const [notdienstCalendarId, setBereitschaftCalendarId] = useState(null)

  // Nur ApothekerInnen (ohne Ausgetretene)
  const apotheker = staff.filter((s) => s.role === 'ApothekerIn' && !s.exit_date)

  // Bereitschaft-Kalender holen oder erstellen
  const ensureBereitschaftCalendar = useCallback(async () => {
    // Prüfen ob Kalender existiert
    const { data: existing } = await supabase
      .from('calendars')
      .select('id')
      .eq('name', 'Bereitschaft')
      .single()

    if (existing) {
      setBereitschaftCalendarId(existing.id)
      return existing.id
    }

    // Kalender erstellen
    const { data: created, error } = await supabase
      .from('calendars')
      .insert({
        name: 'Bereitschaft',
        description: 'Bereitschaft-Termine',
        color: NOTDIENST_CALENDAR_COLOR,
        owner_id: session?.user?.id,
      })
      .select()
      .single()

    if (!error && created) {
      // Berechtigung für den Ersteller
      await supabase
        .from('calendar_permissions')
        .insert({
          calendar_id: created.id,
          user_id: session?.user?.id,
          permission: 'write',
        })
      setBereitschaftCalendarId(created.id)
      return created.id
    }

    return null
  }, [session?.user?.id])

  // Kalender-Event synchronisieren
  const syncCalendarEvent = async (calendarId, date, staffId, staffName) => {
    const startTime = new Date(date + 'T00:00:00')
    const endTime = new Date(date + 'T23:59:59')
    const externalId = `notdienst_${date}`

    if (staffId && staffName) {
      // Event erstellen oder aktualisieren
      const { data: existing } = await supabase
        .from('calendar_events')
        .select('id')
        .eq('external_id', externalId)
        .single()

      const eventData = {
        calendar_id: calendarId,
        title: `Bereitschaft: ${staffName}`,
        description: 'Bereitschaft',
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        all_day: true,
        external_id: externalId,
        external_source: 'notdienstplanung',
      }

      if (existing) {
        await supabase
          .from('calendar_events')
          .update(eventData)
          .eq('id', existing.id)
      } else {
        await supabase
          .from('calendar_events')
          .insert(eventData)
      }
    } else {
      // Event löschen
      await supabase
        .from('calendar_events')
        .delete()
        .eq('external_id', externalId)
    }
  }

  // Zuweisungen und Kalender laden
  useEffect(() => {
    const init = async () => {
      setLoading(true)

      // Kalender sicherstellen
      await ensureBereitschaftCalendar()

      // Zuweisungen laden
      const { data, error } = await supabase
        .from('notdienst_assignments')
        .select('*')
        .gte('date', '2026-01-01')
        .lte('date', '2026-12-31')

      if (!error && data) {
        const assignmentMap = {}
        data.forEach((a) => {
          assignmentMap[a.date] = a.staff_id
        })
        setAssignments(assignmentMap)
      }
      setLoading(false)
    }

    init()
  }, [ensureBereitschaftCalendar])

  // Zuweisung speichern
  const handleAssign = async (date, staffId) => {
    setSaving(date)

    const staffMember = staffId ? staff.find((s) => s.id === staffId) : null
    const staffName = staffMember ? `${staffMember.first_name} ${staffMember.last_name}` : null

    if (staffId) {
      // Upsert: Zuweisung erstellen oder aktualisieren
      const { error } = await supabase
        .from('notdienst_assignments')
        .upsert(
          { date, staff_id: staffId },
          { onConflict: 'date' }
        )

      if (!error) {
        setAssignments((prev) => ({ ...prev, [date]: staffId }))
        // Kalender-Event synchronisieren
        if (notdienstCalendarId) {
          await syncCalendarEvent(notdienstCalendarId, date, staffId, staffName)
        }
      }
    } else {
      // Zuweisung löschen
      const { error } = await supabase
        .from('notdienst_assignments')
        .delete()
        .eq('date', date)

      if (!error) {
        setAssignments((prev) => {
          const next = { ...prev }
          delete next[date]
          return next
        })
        // Kalender-Event löschen
        if (notdienstCalendarId) {
          await syncCalendarEvent(notdienstCalendarId, date, null, null)
        }
      }
    }

    setSaving(null)
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('de-DE', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const getStaffName = (staffId) => {
    const s = staff.find((st) => st.id === staffId)
    return s ? `${s.first_name} ${s.last_name}` : ''
  }

  // Statistik berechnen
  const stats = apotheker.map((a) => ({
    ...a,
    count: Object.values(assignments).filter((id) => id === a.id).length,
  }))

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl lg:text-3xl font-semibold tracking-tight">Bereitschaftplanung 2026</h2>
      </div>

      {loading ? (
        <div className={`${theme.panel} rounded-2xl p-6 border ${theme.border} ${theme.cardShadow}`}>
          <p className={theme.textMuted}>Lade Bereitschaftplanung...</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Terminliste */}
          <div className={`lg:col-span-2 ${theme.panel} rounded-2xl p-5 border ${theme.border} ${theme.cardShadow}`}>
            <h3 className={`text-lg font-medium mb-4 ${theme.text}`}>Termine</h3>
            <div className="space-y-2">
              {NOTDIENST_TERMINE_2026.map((date) => {
                const isPast = new Date(date) < new Date()
                return (
                  <div
                    key={date}
                    className={`flex items-center gap-4 p-3 rounded-xl border ${theme.border} ${isPast ? 'opacity-50' : ''}`}
                  >
                    <div className={`w-32 text-sm font-medium ${theme.text}`}>
                      {formatDate(date)}
                    </div>
                    <select
                      value={assignments[date] || ''}
                      onChange={(e) => handleAssign(date, e.target.value || null)}
                      disabled={saving === date}
                      className={`flex-1 px-3 py-2 rounded-lg border ${theme.input} ${theme.text} text-sm`}
                    >
                      <option value="">– Nicht zugewiesen –</option>
                      {apotheker.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.first_name} {a.last_name}
                        </option>
                      ))}
                    </select>
                    {saving === date && (
                      <span className={`text-xs ${theme.textMuted}`}>Speichern...</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Statistik */}
          <div className={`${theme.panel} rounded-2xl p-5 border ${theme.border} ${theme.cardShadow}`}>
            <h3 className={`text-lg font-medium mb-4 ${theme.text}`}>Übersicht</h3>
            <div className="space-y-3">
              {stats.map((a) => (
                <div key={a.id} className="flex items-center justify-between">
                  <span className={`text-sm ${theme.text}`}>
                    {a.first_name} {a.last_name}
                  </span>
                  <span className={`text-sm font-medium px-2 py-0.5 rounded ${
                    a.count === 0
                      ? 'bg-gray-100 text-gray-600'
                      : 'bg-[#4C8BF5]/10 text-[#4C8BF5]'
                  }`}>
                    {a.count} Dienste
                  </span>
                </div>
              ))}
              {apotheker.length === 0 && (
                <p className={`text-sm ${theme.textMuted}`}>
                  Keine ApothekerInnen gefunden.
                </p>
              )}
            </div>

            <div className={`mt-6 pt-4 border-t ${theme.border}`}>
              <div className="flex items-center justify-between">
                <span className={`text-sm ${theme.textSecondary}`}>Gesamt</span>
                <span className={`text-sm font-medium ${theme.text}`}>
                  {NOTDIENST_TERMINE_2026.length} Termine
                </span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className={`text-sm ${theme.textSecondary}`}>Zugewiesen</span>
                <span className={`text-sm font-medium ${theme.text}`}>
                  {Object.keys(assignments).length} / {NOTDIENST_TERMINE_2026.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default BereitschaftplanungView
