import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import {
  ArrowClockwise,
  ShoppingCart,
  Eye,
  Printer,
  Pill,
  ChatDots,
  User,
  CalendarBlank,
  ChartBar,
  MagnifyingGlass,
  X,
} from '@phosphor-icons/react'
import { supabase } from '../../lib/supabase'
import useGesundBestellungen from './useGesundBestellungen'
import OrderDetailPopup from './OrderDetailPopup'
import GesundStatistikView from './GesundStatistikView'

const ORDER_TYPE_LABELS = {
  OTC_ONLY: 'OTC',
  FOTO: 'Foto-Rezept',
  PARTNER: 'Partner',
  EREZEPT: 'E-Rezept',
}

const ORDER_TYPE_COLORS = {
  OTC_ONLY: 'bg-blue-100 text-blue-700',
  FOTO: 'bg-purple-100 text-purple-700',
  PARTNER: 'bg-amber-100 text-amber-700',
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
  IN_PROGRESS: 'bg-amber-100 text-amber-700',
  PHARMACIST_IN_PROGRESS: 'bg-amber-100 text-amber-700',
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

function formatDaySubheader(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return `${WEEKDAYS_LONG[d.getDay()]}, ${d.getDate()}. ${MONTHS_SHORT[d.getMonth()]}`
}

function getTodayKey() {
  const now = new Date()
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`
}

function getYesterdayKey() {
  const now = new Date()
  now.setUTCDate(now.getUTCDate() - 1)
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`
}

function getMondayOfCurrentWeek() {
  const now = new Date()
  const day = now.getUTCDay() // 0=So
  const diff = day === 0 ? 6 : day - 1
  const monday = new Date(now)
  monday.setUTCDate(now.getUTCDate() - diff)
  monday.setUTCHours(0, 0, 0, 0)
  return monday
}

function getMondayOfLastWeek() {
  const monday = getMondayOfCurrentWeek()
  monday.setUTCDate(monday.getUTCDate() - 7)
  return monday
}

const TABS = [
  { key: 'today', label: 'Heute' },
  { key: 'yesterday', label: 'Gestern' },
  { key: 'this-week', label: 'Woche' },
  { key: 'last-week', label: 'Vorwoche' },
  { key: 'custom', label: 'Datum' },
]

export default function GesundBestellungenView({ theme }) {
  const { ordersByDay, todayOrders, loading, refreshing, refresh, getViewUrl, printFile, markSeen, loadDay } = useGesundBestellungen()
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showStats, setShowStats] = useState(false)
  const [activeTab, setActiveTab] = useState('today')
  const [customDate, setCustomDate] = useState('')
  const [customOrders, setCustomOrders] = useState(null) // null = nicht geladen, [] = leer
  const [customLoading, setCustomLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const searchTimerRef = useRef(null)
  const searchInputRef = useRef(null)

  const handleSearchChange = useCallback((value) => {
    setSearchQuery(value)
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)

    const trimmed = value.trim()
    if (trimmed.length < 2) {
      setSearchResults(null)
      setSearchLoading(false)
      return
    }

    setSearchLoading(true)
    searchTimerRef.current = setTimeout(async () => {
      const { data, error } = await supabase.rpc('search_gesund_orders', { p_query: trimmed })
      if (error) {
        console.error('Search error:', error)
        setSearchResults([])
      } else {
        setSearchResults(data)
      }
      setSearchLoading(false)
    }, 400)
  }, [])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current) }
  }, [])

  const clearSearch = useCallback(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    setSearchQuery('')
    setSearchResults(null)
    setSearchLoading(false)
    searchInputRef.current?.focus()
  }, [])

  // Unseen-Counts pro Tab
  const tabCounts = useMemo(() => {
    const todayKey = getTodayKey()
    const yesterdayKey = getYesterdayKey()
    const mondayKey = getMondayOfCurrentWeek().toISOString().split('T')[0]
    const lastMondayKey = getMondayOfLastWeek().toISOString().split('T')[0]

    let yesterdayUnseen = 0
    let weekUnseen = 0
    let lastWeekUnseen = 0

    for (const { date, orders } of ordersByDay) {
      const unseen = orders.filter(isUnseen).length
      if (date === yesterdayKey) yesterdayUnseen += unseen
      if (date >= mondayKey && date !== todayKey) weekUnseen += unseen
      if (date >= lastMondayKey && date < mondayKey) lastWeekUnseen += unseen
    }

    return {
      today: todayOrders.filter(isUnseen).length,
      yesterday: yesterdayUnseen,
      'this-week': weekUnseen,
      'last-week': lastWeekUnseen,
    }
  }, [ordersByDay, todayOrders])

  // Tab-Inhalt berechnen (für Nicht-Heute und Nicht-Custom Tabs)
  const tabData = useMemo(() => {
    const todayKey = getTodayKey()
    const yesterdayKey = getYesterdayKey()
    const mondayKey = getMondayOfCurrentWeek().toISOString().split('T')[0]
    const lastMondayKey = getMondayOfLastWeek().toISOString().split('T')[0]

    if (activeTab === 'yesterday') {
      const dayGroup = ordersByDay.find(d => d.date === yesterdayKey)
      return dayGroup ? [dayGroup] : []
    }
    if (activeTab === 'this-week') {
      return ordersByDay.filter(d => d.date >= mondayKey && d.date !== todayKey)
    }
    if (activeTab === 'last-week') {
      return ordersByDay.filter(d => d.date >= lastMondayKey && d.date < mondayKey)
    }
    return []
  }, [activeTab, ordersByDay])

  const handleCustomDateChange = useCallback(async (dateStr) => {
    setCustomDate(dateStr)
    if (!dateStr) {
      setCustomOrders(null)
      return
    }

    // Prüfen ob Datum im bereits geladenen Bereich liegt
    const dayGroup = ordersByDay.find(d => d.date === dateStr)
    if (dayGroup) {
      setCustomOrders(dayGroup.orders)
      return
    }

    // Aus DB laden
    setCustomLoading(true)
    const orders = await loadDay(dateStr)
    setCustomOrders(orders)
    setCustomLoading(false)
  }, [ordersByDay, loadDay])

  const handleOpenOrder = (order) => {
    setSelectedOrder(order)
    if (isUnseen(order)) {
      markSeen(order.id)
    }
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <h1 className={`text-xl font-semibold tracking-tight ${theme.text}`}>
          Gesund.de Bestellungen
        </h1>
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => setShowStats(s => !s)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            showStats
              ? 'bg-[#F59E0B] text-white shadow-sm'
              : `${theme.textSecondary} hover:text-[#1E293B] hover:bg-[#F59E0B]/10`
          }`}
          title="Statistik"
        >
          <ChartBar size={16} />
          Statistik
        </button>
        <button
          type="button"
          onClick={refresh}
          disabled={refreshing}
          className={`p-2 rounded-lg ${theme.textSecondary} hover:text-[#1E293B] hover:bg-[#F59E0B]/10 ${refreshing ? 'opacity-50' : ''}`}
          title="Aktualisieren"
        >
          <ArrowClockwise size={20} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Suchfeld */}
      <div className="relative mb-4">
        <MagnifyingGlass size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme.textMuted}`} />
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Name, Bestellnr., Produkt, PZN..."
          className={`w-full text-sm rounded-xl pl-9 pr-9 py-2 border ${theme.border} ${theme.panel} ${theme.text} placeholder-[#94A3B8] focus:outline-none focus:ring-1 focus:ring-[#0D9488] focus:border-[#0D9488]`}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={clearSearch}
            className={`absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full bg-[#94A3B8]/20 ${theme.textMuted} hover:bg-[#94A3B8]/40 hover:text-[#1E293B]`}
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Content */}
      {showStats ? (
        <GesundStatistikView theme={theme} />
      ) : searchResults !== null || searchLoading ? (
        /* === Suchergebnisse === */
        <div>
          {searchLoading ? (
            <div className={`${theme.panel} rounded-xl border ${theme.border} flex items-center justify-center py-8`}>
              <ArrowClockwise size={20} className={`animate-spin ${theme.textMuted}`} />
            </div>
          ) : searchResults.length === 0 ? (
            <div className={`${theme.panel} rounded-xl border ${theme.border} flex flex-col items-center justify-center py-10 gap-2`}>
              <MagnifyingGlass size={32} className={theme.textMuted} />
              <p className={`text-sm ${theme.textMuted}`}>Keine Bestellungen gefunden für &quot;{searchQuery.trim()}&quot;</p>
            </div>
          ) : (
            <>
              <p className={`text-sm ${theme.textSecondary} mb-3`}>
                {searchResults.length}{searchResults.length === 50 ? '+' : ''} Treffer für &quot;{searchQuery.trim()}&quot;
              </p>
              <div className={`${theme.panel} rounded-xl border ${theme.border} overflow-hidden`}>
                {searchResults.map(order => (
                  <SearchResultRow key={order.id} order={order} theme={theme} onOpen={handleOpenOrder} printFile={printFile} />
                ))}
              </div>
            </>
          )}
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center h-64">
          <ArrowClockwise size={32} className={`animate-spin ${theme.textMuted}`} />
        </div>
      ) : (
        <div>
          {/* Tabs */}
          <div className="flex items-center gap-1 mb-5 flex-wrap">
            {TABS.map(tab => {
              const active = activeTab === tab.key
              const unseen = tabCounts[tab.key] || 0
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all ${
                    active
                      ? 'bg-[#F59E0B] text-white shadow-sm'
                      : `${theme.textSecondary} hover:text-[#1E293B] hover:bg-[#F59E0B]/10`
                  }`}
                >
                  {tab.key === 'custom' && <CalendarBlank size={15} />}
                  {tab.label}
                  {unseen > 0 && (
                    <span className={`flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full ${
                      active ? 'bg-white/25 text-white' : 'bg-red-500 text-white'
                    }`}>
                      {unseen}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* === Tab: Heute === */}
          {activeTab === 'today' && (
            todayOrders.length === 0 ? (
              <div className={`${theme.panel} rounded-xl border ${theme.border} flex flex-col items-center justify-center py-10 gap-2`}>
                <ShoppingCart size={32} className={theme.textMuted} />
                <p className={`text-sm ${theme.textMuted}`}>Heute noch keine Bestellungen</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {todayOrders.map(order => (
                  <TodayCard key={order.id} order={order} theme={theme} onOpen={handleOpenOrder} printFile={printFile} />
                ))}
              </div>
            )
          )}

          {/* === Tabs: Gestern / Woche / Vorwoche === */}
          {(activeTab === 'yesterday' || activeTab === 'this-week' || activeTab === 'last-week') && (
            <div className={`${theme.panel} rounded-xl border ${theme.border} overflow-hidden`}>
              {tabData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 gap-2">
                  <ShoppingCart size={28} className={theme.textMuted} />
                  <p className={`text-sm ${theme.textMuted}`}>Keine Bestellungen in diesem Zeitraum</p>
                </div>
              ) : (
                tabData.map(({ date, orders }, di) => (
                  <div key={date} className={di > 0 ? `border-t ${theme.border}` : ''}>
                    {tabData.length > 1 && (
                      <div className={`px-4 py-1.5 text-xs font-medium ${theme.textMuted} bg-gray-50/60 border-b ${theme.border}`}>
                        {formatDaySubheader(date)}
                      </div>
                    )}
                    {orders.map(order => (
                      <OrderRow key={order.id} order={order} theme={theme} onOpen={handleOpenOrder} printFile={printFile} />
                    ))}
                  </div>
                ))
              )}
            </div>
          )}

          {/* === Tab: Freie Eingabe === */}
          {activeTab === 'custom' && (
            <div>
              <div className="mb-4">
                <input
                  type="date"
                  value={customDate}
                  max={getTodayKey()}
                  onChange={(e) => handleCustomDateChange(e.target.value)}
                  className={`text-sm rounded-lg px-3 py-2 border ${theme.border} ${theme.panel} ${theme.text} focus:outline-none focus:ring-1 focus:ring-[#0D9488] focus:border-[#0D9488]`}
                />
              </div>

              {!customDate ? (
                <div className={`${theme.panel} rounded-xl border ${theme.border} flex flex-col items-center justify-center py-10 gap-2`}>
                  <CalendarBlank size={32} className={theme.textMuted} />
                  <p className={`text-sm ${theme.textMuted}`}>Datum auswählen</p>
                </div>
              ) : customLoading ? (
                <div className={`${theme.panel} rounded-xl border ${theme.border} flex items-center justify-center py-8`}>
                  <ArrowClockwise size={20} className={`animate-spin ${theme.textMuted}`} />
                </div>
              ) : customOrders && customOrders.length === 0 ? (
                <div className={`${theme.panel} rounded-xl border ${theme.border} flex flex-col items-center justify-center py-8 gap-2`}>
                  <ShoppingCart size={28} className={theme.textMuted} />
                  <p className={`text-sm ${theme.textMuted}`}>Keine Bestellungen am {formatDaySubheader(customDate)}</p>
                </div>
              ) : customOrders ? (
                <div className={`${theme.panel} rounded-xl border ${theme.border} overflow-hidden`}>
                  {customOrders.map(order => (
                    <OrderRow key={order.id} order={order} theme={theme} onOpen={handleOpenOrder} printFile={printFile} />
                  ))}
                </div>
              ) : null}
            </div>
          )}
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

function TodayCard({ order, theme, onOpen, printFile }) {
  const unseen = isUnseen(order)
  return (
    <div
      className={`flex flex-col rounded-2xl border-2 ${unseen ? 'border-red-400 ring-1 ring-red-200' : theme.border} ${theme.cardShadow} ${theme.cardHoverShadow} transition-all cursor-pointer overflow-hidden`}
      onClick={() => onOpen(order)}
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
            onClick={(e) => { e.stopPropagation(); onOpen(order) }}
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

function formatShortDate(isoStr) {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  return `${String(d.getUTCDate()).padStart(2, '0')}.${String(d.getUTCMonth() + 1).padStart(2, '0')}.`
}

function SearchResultRow({ order, theme, onOpen, printFile }) {
  const unseen = isUnseen(order)
  return (
    <div
      className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors border-l-2 ${unseen ? 'border-l-red-400 bg-red-50/30' : 'border-l-transparent'}`}
      onClick={() => onOpen(order)}
    >
      <span className={`text-xs tabular-nums ${theme.textMuted} w-16 shrink-0`}>
        {formatShortDate(order.order_date)} {formatTime(order.order_date)}
      </span>
      <span className={`text-sm truncate min-w-0 ${unseen ? 'font-semibold' : ''} ${theme.text}`}>
        {order.customer_name || 'Unbekannt'}
      </span>
      {order.matched_product && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-50 text-indigo-600 shrink-0 max-w-[180px] truncate" title={order.matched_product}>
          {order.matched_product}
        </span>
      )}
      <div className="flex-1" />
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
