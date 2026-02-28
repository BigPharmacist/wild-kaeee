import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  ArrowClockwise,
  ShoppingCart,
  Eye,
  Printer,
  Pill,
  ChatDots,
  User,
  CaretRight,
} from '@phosphor-icons/react'
import { supabase } from '../../lib/supabase'
import useGesundBestellungen from './useGesundBestellungen'
import OrderDetailPopup from './OrderDetailPopup'

const ORDER_TYPE_LABELS = {
  OTC_ONLY: 'OTC',
  FOTO: 'Foto-Rezept',
  PARTNER: 'Partner',
  EREZEPT: 'E-Rezept',
}

const ORDER_TYPE_COLORS = {
  OTC_ONLY: 'bg-blue-100 text-blue-700',
  FOTO: 'bg-purple-100 text-purple-700',
  PARTNER: 'bg-red-100 text-red-700',
  EREZEPT: 'bg-teal-100 text-teal-700',
}

const STATUS_LABELS = {
  NEW: 'Neu',
  PHARMACIST_NEW: 'Neu',
  IN_PROGRESS: 'Offen',
  PHARMACIST_IN_PROGRESS: 'In Bearbeitung',
  PHARMACIST_AWAIT_WHOLESALE: 'Warten auf Großhändler',
  PHARMACIST_READY_COLLECT: 'Abholbereit',
  PHARMACIST_READY_DELIVERY: 'Lieferbereit',
  READY_COLLECT: 'Abholbereit',
  READY_DELIVERY: 'Lieferbereit',
  PHARMACIST_DONE_COLLECT: 'Abgeholt',
  PHARMACIST_DONE_DELIVERY: 'Zugestellt',
  DONE: 'Abgeschlossen',
  CANCELED: 'Storniert',
  PHARMACIST_CANCELLED: 'Storniert',
  ENDED: 'Beendet',
}

const STATUS_COLORS = {
  NEW: 'bg-blue-100 text-blue-700',
  PHARMACIST_NEW: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-red-100 text-red-700',
  PHARMACIST_IN_PROGRESS: 'bg-red-100 text-red-700',
  PHARMACIST_AWAIT_WHOLESALE: 'bg-orange-100 text-orange-700',
  PHARMACIST_READY_COLLECT: 'bg-teal-100 text-teal-700',
  PHARMACIST_READY_DELIVERY: 'bg-teal-100 text-teal-700',
  READY_COLLECT: 'bg-teal-100 text-teal-700',
  READY_DELIVERY: 'bg-teal-100 text-teal-700',
  PHARMACIST_DONE_COLLECT: 'bg-green-100 text-green-700',
  PHARMACIST_DONE_DELIVERY: 'bg-green-100 text-green-700',
  DONE: 'bg-green-100 text-green-700',
  CANCELED: 'bg-red-100 text-red-700',
  PHARMACIST_CANCELLED: 'bg-red-100 text-red-700',
  ENDED: 'bg-gray-100 text-gray-600',
}

function StatusBadge({ status }) {
  const label = STATUS_LABELS[status] || status
  const colors = STATUS_COLORS[status] || 'bg-gray-100 text-gray-700'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors}`}>
      {label}
    </span>
  )
}

function TypeBadge({ orderType, partnerName }) {
  const label = orderType === 'PARTNER' && partnerName
    ? partnerName.charAt(0).toUpperCase() + partnerName.slice(1)
    : ORDER_TYPE_LABELS[orderType] || orderType
  const colors = orderType === 'PARTNER' && partnerName
    ? 'bg-rose-100 text-rose-700'
    : ORDER_TYPE_COLORS[orderType] || 'bg-gray-100 text-gray-700'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors}`}>
      {label}
    </span>
  )
}

// order_date von Gesund.de ist lokale Zeit (CET/CEST), aber als UTC gespeichert.
function formatTime(isoStr) {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`
}

function isUnseen(order) {
  if (order.seen_at) return false
  return order.status === 'NEW' || order.status === 'PHARMACIST_NEW'
}

const WEEKDAYS_LONG = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag']
const MONTHS_SHORT = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']

function getISOWeek(date) {
  const d = new Date(date.getTime())
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
  const yearStart = new Date(d.getFullYear(), 0, 4)
  return 1 + Math.round(((d - yearStart) / 86400000 - 3 + ((yearStart.getDay() + 6) % 7)) / 7)
}

function getWeekMonday(date) {
  const d = new Date(date.getTime())
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return d
}

function formatWeekLabel(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const weekNum = getISOWeek(d)
  const monday = getWeekMonday(d)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  if (monday.getMonth() === sunday.getMonth()) {
    return `KW ${weekNum} \u00B7 ${monday.getDate()}.–${sunday.getDate()}. ${MONTHS_SHORT[sunday.getMonth()]}`
  }
  return `KW ${weekNum} \u00B7 ${monday.getDate()}. ${MONTHS_SHORT[monday.getMonth()]} – ${sunday.getDate()}. ${MONTHS_SHORT[sunday.getMonth()]}`
}

function formatDaySubheader(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return `${WEEKDAYS_LONG[d.getDay()]}, ${d.getDate()}. ${MONTHS_SHORT[d.getMonth()]}`
}

function getWeekKey(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return getWeekMonday(d).toISOString().split('T')[0]
}

function buildSections(ordersByDay) {
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const yd = new Date(now)
  yd.setDate(yd.getDate() - 1)
  const yesterday = yd.toISOString().split('T')[0]

  const sections = []
  const weekBuckets = new Map()
  const weekKeys = []

  for (const dayGroup of ordersByDay) {
    const { date } = dayGroup
    if (date === today) {
      sections.push({ key: 'today', label: 'Heute', days: [dayGroup] })
    } else if (date === yesterday) {
      sections.push({ key: 'yesterday', label: 'Gestern', days: [dayGroup] })
    } else {
      const wk = getWeekKey(date)
      if (!weekBuckets.has(wk)) {
        weekBuckets.set(wk, [])
        weekKeys.push(wk)
      }
      weekBuckets.get(wk).push(dayGroup)
    }
  }

  for (const wk of weekKeys) {
    const days = weekBuckets.get(wk)
    sections.push({ key: `week-${wk}`, label: formatWeekLabel(days[0].date), days })
  }

  return sections
}

// Ältere Wochen gruppieren (aus lazy-geladenen Orders)
function groupByDay(orders) {
  const groups = {}
  for (const order of orders) {
    const date = new Date(order.order_date || order.created_at)
    const dayKey = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
    if (!groups[dayKey]) groups[dayKey] = []
    groups[dayKey].push(order)
  }
  return Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, dayOrders]) => ({ date, orders: dayOrders }))
}

function formatWeekLabelFromDate(monday) {
  const weekNum = getISOWeek(monday)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  if (monday.getMonth() === sunday.getMonth()) {
    return `KW ${weekNum} \u00B7 ${monday.getDate()}.–${sunday.getDate()}. ${MONTHS_SHORT[sunday.getMonth()]}`
  }
  return `KW ${weekNum} \u00B7 ${monday.getDate()}. ${MONTHS_SHORT[monday.getMonth()]} – ${sunday.getDate()}. ${MONTHS_SHORT[sunday.getMonth()]}`
}

// Wochen-Index per RPC laden (nur Wochen die Daten haben)
function useOlderWeeks() {
  const [weeks, setWeeks] = useState([])

  const fetchWeeks = useCallback(async () => {
    const { data, error } = await supabase.rpc('get_gesund_week_index')
    if (error) {
      console.error('Fehler beim Laden des Wochen-Index:', error)
      return
    }
    setWeeks((data || []).map(w => ({
      weekStart: new Date(w.week_start + 'T00:00:00'),
      label: formatWeekLabelFromDate(new Date(w.week_start + 'T00:00:00')),
      orderCount: w.order_count,
      unseenCount: w.unseen_count,
    })))
  }, [])

  useEffect(() => {
    fetchWeeks()
  }, [fetchWeeks])

  // Refresh bei gesund-orders-changed
  useEffect(() => {
    const handler = () => fetchWeeks()
    window.addEventListener('gesund-orders-changed', handler)
    return () => window.removeEventListener('gesund-orders-changed', handler)
  }, [fetchWeeks])

  return weeks
}

export default function GesundBestellungenView({ theme }) {
  const { ordersByDay, loading, refreshing, refresh, getViewUrl, printFile, markSeen, loadWeek } = useGesundBestellungen()
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [expandedSections, setExpandedSections] = useState(new Set(['today']))
  const [olderWeeksData, setOlderWeeksData] = useState({}) // weekKey → { orders, loading }

  const sections = useMemo(() => buildSections(ordersByDay), [ordersByDay])

  const olderWeeks = useOlderWeeks()

  const toggleSection = (key) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const handleExpandOlderWeek = useCallback(async (weekKey, weekStart) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(weekKey)) {
        next.delete(weekKey)
        return next
      }
      next.add(weekKey)
      return next
    })

    // Nur laden wenn noch nicht geladen
    if (olderWeeksData[weekKey]?.orders) return

    setOlderWeeksData(prev => ({ ...prev, [weekKey]: { orders: null, loading: true } }))
    const orders = await loadWeek(weekStart)
    setOlderWeeksData(prev => ({ ...prev, [weekKey]: { orders, loading: false } }))
  }, [loadWeek, olderWeeksData])

  const handleOpenOrder = (order) => {
    setSelectedOrder(order)
    if (isUnseen(order)) {
      markSeen(order.id)
    }
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <h1 className={`text-xl font-semibold tracking-tight ${theme.text}`}>
          Gesund.de Bestellungen
        </h1>
        <div className="flex-1" />
        <button
          type="button"
          onClick={refresh}
          disabled={refreshing}
          className={`p-2 rounded-lg ${theme.bgHover} ${refreshing ? 'opacity-50' : ''}`}
          title="Aktualisieren"
        >
          <ArrowClockwise size={20} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <ArrowClockwise size={32} className={`animate-spin ${theme.textMuted}`} />
        </div>
      ) : ordersByDay.length === 0 && olderWeeks.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <ShoppingCart size={48} className={theme.textMuted} />
          <p className={`text-lg ${theme.textMuted}`}>Keine Bestellungen vorhanden</p>
        </div>
      ) : (
        <div className={`${theme.panel} rounded-xl border ${theme.border} overflow-hidden`}>
          {/* Aktuelle + Vorwoche Sections */}
          {sections.map((section, si) => {
            const expanded = expandedSections.has(section.key)
            const totalOrders = section.days.reduce((sum, d) => sum + d.orders.length, 0)
            const totalUnseen = section.days.reduce((sum, d) => sum + d.orders.filter(isUnseen).length, 0)

            return (
              <div key={section.key} className={si > 0 ? `border-t ${theme.border}` : ''}>
                {/* Section header */}
                <button
                  type="button"
                  onClick={() => toggleSection(section.key)}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                >
                  <CaretRight
                    size={14}
                    weight="bold"
                    className={`shrink-0 ${theme.textMuted} transition-transform ${expanded ? 'rotate-90' : ''}`}
                  />
                  <span className={`text-sm font-semibold ${theme.text}`}>{section.label}</span>
                  <span className={`text-xs ${theme.textMuted}`}>{totalOrders}</span>
                  {totalUnseen > 0 && (
                    <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
                      {totalUnseen}
                    </span>
                  )}
                </button>

                {expanded && section.key === 'today' && (
                  <div className={`border-t ${theme.border} p-4`}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {section.days[0].orders.map(order => {
                        const unseen = isUnseen(order)
                        return (
                          <div
                            key={order.id}
                            className={`flex flex-col rounded-2xl border-2 ${unseen ? 'border-red-400 ring-1 ring-red-200' : theme.border} ${theme.cardShadow} ${theme.cardHoverShadow} transition-all cursor-pointer overflow-hidden`}
                            onClick={() => handleOpenOrder(order)}
                          >
                            <div className={`p-4 ${theme.panel}`}>
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <User size={18} className={theme.textMuted} />
                                  <p className={`text-sm font-semibold truncate ${theme.text}`}>
                                    {order.customer_name || 'Unbekannt'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 flex-wrap mb-2">
                                <TypeBadge orderType={order.order_type} partnerName={order.partner_name} />
                                <StatusBadge status={order.status} />
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={`text-xs ${theme.textMuted}`}>#{order.order_number}</span>
                                <span className={`text-xs ${theme.textMuted}`}>{formatTime(order.order_date)}</span>
                              </div>
                              <div className="flex items-center gap-3 mt-2">
                                {order.erezept_count > 0 && (
                                  <span className="flex items-center gap-1 text-xs text-teal-600">
                                    <Pill size={14} />
                                    {order.erezept_count} E-Rezept{order.erezept_count > 1 ? 'e' : ''}
                                  </span>
                                )}
                                {order.chat_count > 0 && (
                                  <span className={`flex items-center gap-1 text-xs ${theme.textMuted}`}>
                                    <ChatDots size={14} />
                                    {order.chat_count}
                                  </span>
                                )}
                              </div>
                            </div>
                            {order.pdf_path && (
                              <div className={`flex border-t ${theme.border} ${theme.panel}`}>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); handleOpenOrder(order) }}
                                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium ${theme.textSecondary} hover:bg-black/5 transition-colors`}
                                  title="Ansehen"
                                >
                                  <Eye size={16} />
                                  Ansehen
                                </button>
                                <div className={`w-px ${theme.border}`} />
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); printFile(order.pdf_path) }}
                                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium ${theme.textSecondary} hover:bg-black/5 transition-colors`}
                                  title="Drucken"
                                >
                                  <Printer size={16} />
                                  Drucken
                                </button>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {expanded && section.key !== 'today' && (
                  <div className={`border-t ${theme.border}`}>
                    {section.days.map(({ date, orders }) => (
                      <div key={date}>
                        {section.days.length > 1 && (
                          <div className={`px-4 py-1.5 text-xs font-medium ${theme.textMuted} bg-gray-50/60 border-b ${theme.border}`}>
                            {formatDaySubheader(date)}
                          </div>
                        )}
                        {orders.map(order => (
                          <OrderRow key={order.id} order={order} theme={theme} onOpen={handleOpenOrder} printFile={printFile} />
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          {/* Ältere Wochen — lazy loaded */}
          {olderWeeks.map((week, wi) => {
            const weekKey = `older-${week.weekStart.toISOString().split('T')[0]}`
            const expanded = expandedSections.has(weekKey)
            const weekData = olderWeeksData[weekKey]
            const isFirst = wi === 0 && sections.length === 0

            return (
              <div key={weekKey} className={!isFirst ? `border-t ${theme.border}` : ''}>
                <button
                  type="button"
                  onClick={() => handleExpandOlderWeek(weekKey, week.weekStart)}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                >
                  <CaretRight
                    size={14}
                    weight="bold"
                    className={`shrink-0 ${theme.textMuted} transition-transform ${expanded ? 'rotate-90' : ''}`}
                  />
                  <span className={`text-sm font-semibold ${theme.text}`}>{week.label}</span>
                  <span className={`text-xs ${theme.textMuted}`}>{week.orderCount}</span>
                  {week.unseenCount > 0 && (
                    <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
                      {week.unseenCount}
                    </span>
                  )}
                </button>

                {expanded && (
                  <div className={`border-t ${theme.border}`}>
                    {weekData?.loading && (
                      <div className="flex items-center justify-center py-6">
                        <ArrowClockwise size={20} className={`animate-spin ${theme.textMuted}`} />
                      </div>
                    )}
                    {weekData?.orders && weekData.orders.length === 0 && (
                      <div className={`px-4 py-4 text-sm ${theme.textMuted} text-center`}>
                        Keine Bestellungen in dieser Woche
                      </div>
                    )}
                    {weekData?.orders && weekData.orders.length > 0 && (() => {
                      const days = groupByDay(weekData.orders)
                      return days.map(({ date, orders }) => (
                        <div key={date}>
                          {days.length > 1 && (
                            <div className={`px-4 py-1.5 text-xs font-medium ${theme.textMuted} bg-gray-50/60 border-b ${theme.border}`}>
                              {formatDaySubheader(date)}
                            </div>
                          )}
                          {orders.map(order => (
                            <OrderRow key={order.id} order={order} theme={theme} onOpen={handleOpenOrder} printFile={printFile} />
                          ))}
                        </div>
                      ))
                    })()}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Order Detail Popup */}
      {selectedOrder && (
        <OrderDetailPopup
          order={selectedOrder}
          theme={theme}
          onClose={() => setSelectedOrder(null)}
          getViewUrl={getViewUrl}
          printFile={printFile}
        />
      )}
    </>
  )
}

function OrderRow({ order, theme, onOpen, printFile }) {
  const unseen = isUnseen(order)
  return (
    <div
      className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors border-l-2 ${unseen ? 'border-l-red-400 bg-red-50/30' : 'border-l-transparent'}`}
      onClick={() => onOpen(order)}
    >
      <span className={`text-xs tabular-nums ${theme.textMuted} w-10 shrink-0`}>
        {formatTime(order.order_date)}
      </span>
      <span className={`text-sm truncate flex-1 min-w-0 ${unseen ? 'font-semibold' : ''} ${theme.text}`}>
        {order.customer_name || 'Unbekannt'}
      </span>
      <div className="hidden sm:flex items-center gap-1.5 shrink-0">
        <TypeBadge orderType={order.order_type} partnerName={order.partner_name} />
        <StatusBadge status={order.status} />
      </div>
      <div className="flex items-center gap-0.5 shrink-0">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onOpen(order) }}
          className={`p-1.5 rounded-md ${theme.textMuted} hover:bg-gray-100`}
          title="Ansehen"
        >
          <Eye size={15} />
        </button>
        {order.pdf_path && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); printFile(order.pdf_path) }}
            className={`p-1.5 rounded-md ${theme.textMuted} hover:bg-gray-100`}
            title="Drucken"
          >
            <Printer size={15} />
          </button>
        )}
      </div>
    </div>
  )
}
