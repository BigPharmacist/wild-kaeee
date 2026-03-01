import { useState, useMemo } from 'react'
import { CaretLeft, CaretRight } from '@phosphor-icons/react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Line, AreaChart, Area, Cell,
} from 'recharts'
import useGesundStatistik from './useGesundStatistik'

const MONTH_LABELS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']
const WEEKDAY_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

const ORDER_TYPE_LABELS = {
  OTC_ONLY: 'OTC',
  FOTO: 'Foto-Rezept',
  PARTNER: 'Partner',
  EREZEPT: 'E-Rezept',
}

const ORDER_TYPE_COLORS = {
  OTC_ONLY: '#3B82F6',
  FOTO: '#8B5CF6',
  PARTNER: '#F59E0B',
  EREZEPT: '#0D9488',
}

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
          {entry.name}: {formatter ? formatter(entry.value) : entry.value}
        </p>
      ))}
    </div>
  )
}

const formatCount = (v) => v != null ? v.toLocaleString('de-DE') : '–'

export default function GesundStatistikView({ theme }) {
  const [year, setYear] = useState(new Date().getFullYear())
  const { data, loading } = useGesundStatistik(year)

  // 1. Bestellungen pro Monat
  const ordersPerMonth = useMemo(() => {
    if (!data?.orders_per_month) return []
    return data.orders_per_month.map(d => ({
      month: MONTH_LABELS[d.month - 1],
      count: d.count,
      prev_count: d.prev_count,
    }))
  }, [data])

  // 2. Rezepte pro Monat
  const prescriptionsPerMonth = useMemo(() => {
    if (!data?.prescriptions_per_month) return []
    return data.prescriptions_per_month.map(d => ({
      month: MONTH_LABELS[d.month - 1],
      erezept: d.erezept,
      foto: d.foto,
    }))
  }, [data])

  // 3. Neue Kunden pro Monat
  const newCustomersPerMonth = useMemo(() => {
    if (!data?.new_customers_per_month) return []
    return data.new_customers_per_month.map(d => ({
      month: MONTH_LABELS[d.month - 1],
      count: d.count,
    }))
  }, [data])

  // 4. Bestellungen nach Typ
  const ordersByType = useMemo(() => {
    if (!data?.orders_by_type) return []
    return data.orders_by_type.map(d => ({
      type: ORDER_TYPE_LABELS[d.type] || d.type,
      count: d.count,
      fill: ORDER_TYPE_COLORS[d.type] || '#64748B',
    }))
  }, [data])

  // 5. Bestellungen nach Wochentag
  const ordersByWeekday = useMemo(() => {
    if (!data?.orders_by_weekday) return []
    return data.orders_by_weekday.map(d => ({
      weekday: WEEKDAY_LABELS[d.weekday - 1],
      avg_count: Number(d.avg_count),
    }))
  }, [data])

  // 6. Stammkunden vs. Einmalkunden
  const customerRetention = useMemo(() => {
    if (!data?.customer_retention) return []
    const r = data.customer_retention
    return [
      { label: 'Stammkunden', count: r.returning, fill: '#0D9488' },
      { label: 'Einmalkunden', count: r.one_time, fill: '#64748B' },
    ]
  }, [data])

  // 7. Top 10 Kunden
  const topCustomers = useMemo(() => {
    if (!data?.top_customers) return []
    return data.top_customers.map(d => ({
      name: d.name,
      count: d.count,
    }))
  }, [data])

  // 8. Stornoquote
  const cancelRate = useMemo(() => {
    if (!data?.cancel_rate) return []
    return data.cancel_rate.map(d => ({
      month: MONTH_LABELS[d.month - 1],
      total: d.total,
      canceled: d.canceled,
      quote: d.total > 0 ? Math.round((d.canceled / d.total) * 1000) / 10 : 0,
    }))
  }, [data])

  // 9. Bestellungen nach Uhrzeit
  const ordersByHour = useMemo(() => {
    if (!data?.orders_by_hour) return []
    return data.orders_by_hour.map(d => ({
      hour: `${String(d.hour).padStart(2, '0')}:00`,
      count: d.count,
    }))
  }, [data])

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-20 ${theme.textMuted} text-sm`}>
        Statistiken werden geladen…
      </div>
    )
  }

  const hasData = data && data.orders_per_month?.some(d => d.count > 0)

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

      {!hasData ? (
        <div className={`${theme.surface} border ${theme.border} rounded-xl flex items-center justify-center py-20`}>
          <p className={`text-sm ${theme.textMuted}`}>Keine Bestellungen in {year}</p>
        </div>
      ) : (
        <>
          {/* 1. Bestellungen pro Monat */}
          <ChartCard theme={theme} title="Bestellungen pro Monat">
            <ResponsiveContainer>
              <BarChart data={ordersPerMonth} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip formatter={formatCount} />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="count" name={String(year)} fill="#0D9488" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="prev_count" name={String(year - 1)} stroke="#94A3B8" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* 2. Rezepte pro Monat */}
          <ChartCard theme={theme} title="Rezepte pro Monat">
            <ResponsiveContainer>
              <BarChart data={prescriptionsPerMonth} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip formatter={formatCount} />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="erezept" name="E-Rezept" stackId="rx" fill="#0D9488" radius={[0, 0, 0, 0]} />
                <Bar dataKey="foto" name="Foto-Rezept" stackId="rx" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* 3. Neue Kunden pro Monat */}
          <ChartCard theme={theme} title="Neue Kunden pro Monat">
            <ResponsiveContainer>
              <AreaChart data={newCustomersPerMonth} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip formatter={formatCount} />} />
                <Area type="monotone" dataKey="count" name="Neue Kunden" stroke="#F59E0B" fill="#FEF3C7" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* 4. Bestellungen nach Typ */}
          <ChartCard theme={theme} title="Bestellungen nach Typ">
            {ordersByType.length > 0 ? (
              <ResponsiveContainer>
                <BarChart data={ordersByType} layout="vertical" margin={{ left: 20, right: 20, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="type" tick={{ fontSize: 11 }} width={100} />
                  <Tooltip content={<CustomTooltip formatter={formatCount} />} />
                  <Bar dataKey="count" name="Bestellungen" radius={[0, 4, 4, 0]}>
                    {ordersByType.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState theme={theme} />
            )}
          </ChartCard>

          {/* 5. Bestellungen nach Wochentag */}
          <ChartCard theme={theme} title="Bestellungen nach Wochentag (Ø)">
            <ResponsiveContainer>
              <BarChart data={ordersByWeekday} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="weekday" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip formatter={v => v?.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} />} />
                <Bar dataKey="avg_count" name="Ø Bestellungen" fill="#0D9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* 6. Stammkunden vs. Einmalkunden */}
          <ChartCard theme={theme} title="Stammkunden vs. Einmalkunden">
            <ResponsiveContainer>
              <BarChart data={customerRetention} layout="vertical" margin={{ left: 20, right: 20, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={120} />
                <Tooltip content={<CustomTooltip formatter={formatCount} />} />
                <Bar dataKey="count" name="Kunden" radius={[0, 4, 4, 0]}>
                  {customerRetention.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* 7. Top 10 Kunden */}
          <ChartCard theme={theme} title={`Top 10 Kunden ${year}`}>
            {topCustomers.length > 0 ? (
              <ResponsiveContainer>
                <BarChart data={topCustomers} layout="vertical" margin={{ left: 20, right: 20, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={140} />
                  <Tooltip content={<CustomTooltip formatter={formatCount} />} />
                  <Bar dataKey="count" name="Bestellungen" fill="#F59E0B" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState theme={theme} />
            )}
          </ChartCard>

          {/* 8. Stornoquote */}
          <ChartCard theme={theme} title="Stornoquote">
            <ResponsiveContainer>
              <BarChart data={cancelRate} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickFormatter={v => `${v} %`} />
                <Tooltip content={<CustomTooltip formatter={(v, name) => name === 'Quote' ? `${v} %` : formatCount(v)} />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar yAxisId="left" dataKey="total" name="Gesamt" fill="#0D9488" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="left" dataKey="canceled" name="Storniert" fill="#E11D48" radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="quote" name="Quote" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* 9. Bestellungen nach Uhrzeit */}
          <ChartCard theme={theme} title="Bestellungen nach Uhrzeit">
            <ResponsiveContainer>
              <AreaChart data={ordersByHour} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="hour" tick={{ fontSize: 11 }} interval={1} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip formatter={formatCount} />} />
                <Area type="monotone" dataKey="count" name="Bestellungen" stroke="#0D9488" fill="#CCFBF1" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </>
      )}
    </div>
  )
}
