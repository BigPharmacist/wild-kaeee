import { useState, useEffect, useMemo } from 'react'
import { CaretLeft, CaretRight } from '@phosphor-icons/react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line, AreaChart, Area, Cell,
  ReferenceLine,
} from 'recharts'
import { useMjStatistiken } from '../hooks/useMjStatistiken'

const MONTH_LABELS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']

const COLORS = [
  '#F59E0B', '#0D9488', '#6366F1', '#EC4899', '#8B5CF6',
  '#EF4444', '#14B8A6', '#F97316', '#3B82F6', '#84CC16',
]

const formatNumber = (v) => v != null ? v.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '–'
const formatEuro = (v) => v != null ? v.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }) : '–'
const formatPercent = (v) => v != null ? `${v.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %` : '–'
const formatMinutes = (v) => v != null ? `${v.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} min` : '–'

function ChartCard({ theme, title, children }) {
  return (
    <div className={`${theme.surface} border ${theme.border} rounded-xl p-4`}>
      <h3 className={`text-sm font-semibold ${theme.textPrimary} mb-3`}>{title}</h3>
      <div style={{ width: '100%', height: 300 }}>
        {children}
      </div>
    </div>
  )
}

function EmptyState({ theme, message }) {
  return (
    <div className={`flex items-center justify-center h-full ${theme.textMuted} text-sm`}>
      {message || 'Keine Daten vorhanden'}
    </div>
  )
}

function CustomTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-2.5 text-xs">
      <p className="font-semibold text-gray-800 mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }} className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
          {entry.name}: {formatter ? formatter(entry.value) : formatNumber(entry.value)}
        </p>
      ))}
    </div>
  )
}

export function StatistikenView({ theme, pharmacyId, profiles }) {
  const [year, setYear] = useState(new Date().getFullYear())
  const { reports, schedules, workRecords, loading, fetchStatistiken } = useMjStatistiken({ pharmacyId })

  const staffIds = useMemo(() => (profiles || []).map(p => p.staff_id), [profiles])
  const staffMap = useMemo(() => {
    const map = {}
    for (const p of profiles || []) {
      map[p.staff_id] = `${p.staff?.first_name || ''} ${p.staff?.last_name || ''}`.trim()
    }
    return map
  }, [profiles])

  useEffect(() => {
    if (staffIds.length > 0) {
      fetchStatistiken(staffIds, year)
    }
  }, [staffIds, year]) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── 1. Stundenkonten ───
  const stundenkontenData = useMemo(() => {
    return staffIds.map(id => {
      const staffReports = reports.filter(r => r.staff_id === id).sort((a, b) => a.month - b.month)
      const last = staffReports[staffReports.length - 1]
      return {
        name: staffMap[id] || id,
        balance: last ? parseFloat(last.cumulative_balance) : 0,
      }
    }).sort((a, b) => b.balance - a.balance)
  }, [reports, staffIds, staffMap])

  // ─── 2. Soll vs. Ist ───
  const sollIstData = useMemo(() => {
    return MONTH_LABELS.map((label, i) => {
      const month = i + 1
      const monthReports = reports.filter(r => r.month === month)
      return {
        month: label,
        ist: monthReports.reduce((sum, r) => sum + parseFloat(r.actual_hours || 0), 0),
        soll: monthReports.reduce((sum, r) => sum + parseFloat(r.paid_hours || 0), 0),
      }
    })
  }, [reports])

  // ─── 3. Gesamtkosten ───
  const kostenData = useMemo(() => {
    return MONTH_LABELS.map((label, i) => {
      const month = i + 1
      const monthReports = reports.filter(r => r.month === month)
      return {
        month: label,
        kosten: monthReports.reduce((sum, r) => sum + parseFloat(r.monthly_payment || 0), 0),
      }
    })
  }, [reports])

  // ─── 4. Abwesenheitsquote ───
  const abwesenheitData = useMemo(() => {
    return staffIds.map(id => {
      const staffSchedules = schedules.filter(s => s.staff_id === id)
      const total = staffSchedules.length
      const absent = staffSchedules.filter(s => s.absent).length
      return {
        name: staffMap[id] || id,
        quote: total > 0 ? Math.round((absent / total) * 1000) / 10 : 0,
      }
    }).sort((a, b) => b.quote - a.quote)
  }, [schedules, staffIds, staffMap])

  // ─── 5. Stundenkonto-Trend ───
  const trendData = useMemo(() => {
    return MONTH_LABELS.map((label, i) => {
      const month = i + 1
      const point = { month: label }
      for (const id of staffIds) {
        const r = reports.find(r => r.staff_id === id && r.month === month)
        point[id] = r ? parseFloat(r.cumulative_balance) : null
      }
      return point
    })
  }, [reports, staffIds])

  // ─── 6. Schichtverteilung ───
  const { shiftDistData, shiftNames } = useMemo(() => {
    const shiftSet = new Map()
    for (const s of schedules) {
      if (s.shift?.id && !s.absent) {
        shiftSet.set(s.shift.id, s.shift.name)
      }
    }
    const names = [...shiftSet.entries()]

    const data = staffIds.map(id => {
      const row = { name: staffMap[id] || id }
      for (const [shiftId, shiftName] of names) {
        row[shiftName] = schedules.filter(s => s.staff_id === id && s.shift_id === shiftId && !s.absent).length
      }
      return row
    })

    return { shiftDistData: data, shiftNames: names.map(([, name]) => name) }
  }, [schedules, staffIds, staffMap])

  // ─── 7. Pünktlichkeit ───
  const puenktlichkeitData = useMemo(() => {
    return staffIds.map(id => {
      const staffRecords = workRecords.filter(wr => wr.schedule?.staff_id === id)
      const diffs = staffRecords
        .filter(wr => wr.actual_start_time && wr.schedule?.shift?.start_time)
        .map(wr => {
          const [ah, am] = wr.actual_start_time.split(':').map(Number)
          const [sh, sm] = wr.schedule.shift.start_time.split(':').map(Number)
          return (ah * 60 + am) - (sh * 60 + sm)
        })
      const avg = diffs.length > 0 ? Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length) : 0
      return {
        name: staffMap[id] || id,
        abweichung: avg,
      }
    }).sort((a, b) => Math.abs(b.abweichung) - Math.abs(a.abweichung))
  }, [workRecords, staffIds, staffMap])

  const hasReports = reports.length > 0
  const hasSchedules = schedules.length > 0
  const hasWorkRecords = workRecords.length > 0

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-20 ${theme.textMuted} text-sm`}>
        Statistiken werden geladen…
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Year selector */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setYear(y => y - 1)}
          className={`p-1.5 rounded-lg ${theme.textSecondary} hover:bg-gray-100`}
          title="Vorheriges Jahr"
        >
          <CaretLeft size={18} weight="bold" />
        </button>
        <span className={`text-sm font-semibold ${theme.textPrimary} min-w-[60px] text-center`}>
          {year}
        </span>
        <button
          onClick={() => setYear(y => y + 1)}
          className={`p-1.5 rounded-lg ${theme.textSecondary} hover:bg-gray-100`}
          title="Nächstes Jahr"
        >
          <CaretRight size={18} weight="bold" />
        </button>
      </div>

      {/* 1. Stundenkonten */}
      <ChartCard theme={theme} title="Stundenkonten-Übersicht">
        {hasReports ? (
          <ResponsiveContainer>
            <BarChart data={stundenkontenData} layout="vertical" margin={{ left: 20, right: 20, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={formatNumber} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
              <Tooltip content={<CustomTooltip formatter={v => `${formatNumber(v)} Std.`} />} />
              <ReferenceLine x={0} stroke="#64748B" strokeDasharray="3 3" />
              <Bar dataKey="balance" name="Saldo" radius={[0, 4, 4, 0]}>
                {stundenkontenData.map((entry, i) => (
                  <Cell key={i} fill={entry.balance >= 0 ? '#0D9488' : '#E11D48'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState theme={theme} />
        )}
      </ChartCard>

      {/* 2. Soll vs. Ist */}
      <ChartCard theme={theme} title="Soll vs. Ist (Teamstunden pro Monat)">
        {hasReports ? (
          <ResponsiveContainer>
            <BarChart data={sollIstData} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={formatNumber} />
              <Tooltip content={<CustomTooltip formatter={v => `${formatNumber(v)} Std.`} />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="soll" name="Soll" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              <Bar dataKey="ist" name="Ist" fill="#0D9488" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState theme={theme} />
        )}
      </ChartCard>

      {/* 3. Gesamtkosten */}
      <ChartCard theme={theme} title="Gesamtkosten pro Monat">
        {hasReports ? (
          <ResponsiveContainer>
            <AreaChart data={kostenData} margin={{ left: 10, right: 10, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v.toLocaleString('de-DE')} €`} />
              <Tooltip content={<CustomTooltip formatter={formatEuro} />} />
              <Area type="monotone" dataKey="kosten" name="Kosten" stroke="#F59E0B" fill="#FEF3C7" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState theme={theme} />
        )}
      </ChartCard>

      {/* 4. Abwesenheitsquote */}
      <ChartCard theme={theme} title="Abwesenheitsquote pro Mitarbeiter">
        {hasSchedules ? (
          <ResponsiveContainer>
            <BarChart data={abwesenheitData} layout="vertical" margin={{ left: 20, right: 20, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `${v} %`} domain={[0, 'auto']} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
              <Tooltip content={<CustomTooltip formatter={formatPercent} />} />
              <Bar dataKey="quote" name="Abwesenheit" fill="#64748B" radius={[0, 4, 4, 0]}>
                {abwesenheitData.map((entry, i) => (
                  <Cell key={i} fill={entry.quote > 15 ? '#E11D48' : entry.quote > 5 ? '#F59E0B' : '#0D9488'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState theme={theme} />
        )}
      </ChartCard>

      {/* 5. Stundenkonto-Trend */}
      <ChartCard theme={theme} title="Stundenkonto-Trend (kumulativ)">
        {hasReports ? (
          <ResponsiveContainer>
            <LineChart data={trendData} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={formatNumber} />
              <Tooltip content={<CustomTooltip formatter={v => `${formatNumber(v)} Std.`} />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <ReferenceLine y={0} stroke="#64748B" strokeDasharray="3 3" />
              {staffIds.map((id, i) => (
                <Line
                  key={id}
                  type="monotone"
                  dataKey={id}
                  name={staffMap[id]}
                  stroke={COLORS[i % COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState theme={theme} />
        )}
      </ChartCard>

      {/* 6. Schichtverteilung */}
      <ChartCard theme={theme} title="Schichtverteilung pro Mitarbeiter">
        {hasSchedules && shiftNames.length > 0 ? (
          <ResponsiveContainer>
            <BarChart data={shiftDistData} margin={{ left: 20, right: 10, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip formatter={v => `${v} Schichten`} />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {shiftNames.map((name, i) => (
                <Bar key={name} dataKey={name} name={name} stackId="shifts" fill={COLORS[i % COLORS.length]} radius={i === shiftNames.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState theme={theme} />
        )}
      </ChartCard>

      {/* 7. Pünktlichkeit */}
      <ChartCard theme={theme} title="Pünktlichkeit (Ø Abweichung Arbeitsbeginn)">
        {hasWorkRecords ? (
          <ResponsiveContainer>
            <BarChart data={puenktlichkeitData} layout="vertical" margin={{ left: 20, right: 20, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `${v} min`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
              <Tooltip content={<CustomTooltip formatter={formatMinutes} />} />
              <ReferenceLine x={0} stroke="#64748B" strokeDasharray="3 3" />
              <Bar dataKey="abweichung" name="Ø Abweichung" radius={[0, 4, 4, 0]}>
                {puenktlichkeitData.map((entry, i) => (
                  <Cell key={i} fill={Math.abs(entry.abweichung) <= 5 ? '#0D9488' : Math.abs(entry.abweichung) <= 15 ? '#F59E0B' : '#E11D48'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState theme={theme} />
        )}
      </ChartCard>
    </div>
  )
}
