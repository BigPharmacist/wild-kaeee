import { useState, useEffect, useMemo } from 'react'
import {
  ArrowClockwise,
  ShoppingCart,
  X,
  Eye,
  Printer,
  Pill,
  ChatDots,
  Envelope,
  Phone,
  MapPin,
  Truck,
  CreditCard,
  User,
  Storefront,
  FilePdf,
  ImageSquare,
  Copy,
  Check,
  Package,
  CaretRight,
} from '@phosphor-icons/react'
import useGesundBestellungen from './useGesundBestellungen'

function formatDayHeading(dateStr) {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('de-DE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// order_date von Gesund.de ist lokale Zeit (CET/CEST), aber als UTC gespeichert.
// Daher UTC-Komponenten direkt auslesen statt Timezone-Konvertierung.
function formatTime(isoStr) {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`
}

function formatDate(isoStr) {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  return `${String(d.getUTCDate()).padStart(2, '0')}.${String(d.getUTCMonth() + 1).padStart(2, '0')}.${d.getUTCFullYear()}`
}

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

const DISPATCH_LABELS = {
  COLLECT: 'Abholung',
  DELIVERY: 'Lieferung',
  SHIPPING: 'Versand',
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

function OrderDetailPopup({ order, theme, onClose, getViewUrl, printFile }) {
  const [pdfUrl, setPdfUrl] = useState(null)
  const [loadingPdf, setLoadingPdf] = useState(false)
  const [qrUrls, setQrUrls] = useState({}) // index -> signed url
  const [loadingQr, setLoadingQr] = useState(false)
  const [lightboxUrl, setLightboxUrl] = useState(null)
  const [copiedSet, setCopiedSet] = useState(new Set())

  const chatMessages = (order.chat_messages || []).filter(m => m.type === 'CHAT')
  const erezeptCodes = order.erezept_codes || []
  const prescriptionImages = order.prescription_images || []

  const handleLoadPdf = async () => {
    if (!order.pdf_path) return
    setLoadingPdf(true)
    const url = await getViewUrl(order.pdf_path)
    if (url) setPdfUrl(url)
    setLoadingPdf(false)
  }

  useEffect(() => {
    if (prescriptionImages.length === 0) return
    let cancelled = false
    setLoadingQr(true)
    Promise.all(
      prescriptionImages.map(async (path, i) => {
        const url = await getViewUrl(path)
        return url ? [i, url] : null
      })
    ).then(results => {
      if (cancelled) return
      const map = {}
      for (const r of results) if (r) map[r[0]] = r[1]
      setQrUrls(map)
      setLoadingQr(false)
    })
    return () => { cancelled = true }
  }, [prescriptionImages, getViewUrl])

  return (
    <div className={`fixed inset-0 ${theme.overlay} flex items-center justify-center z-50 p-4`} onClick={onClose}>
      <div
        className={`${theme.panel} rounded-2xl border ${theme.border} ${theme.cardShadow} w-full max-w-2xl max-h-[90vh] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-5 border-b ${theme.border}`}>
          <div className="min-w-0">
            <h3 className={`text-lg font-semibold ${theme.text} truncate`}>{order.customer_name || 'Unbekannt'}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-sm ${theme.textMuted}`}>#{order.order_number}</span>
              <TypeBadge orderType={order.order_type} partnerName={order.partner_name} />
              <StatusBadge status={order.status} />
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-lg ${theme.bgHover} ${theme.textMuted} shrink-0`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Kontaktdaten */}
          <div className="space-y-2">
            {order.email && (
              <div className="flex items-center gap-2">
                <Envelope size={16} className={theme.textMuted} />
                <span className={`text-sm ${theme.text}`}>{order.email}</span>
              </div>
            )}
            {order.phone && (
              <div className="flex items-center gap-2">
                <Phone size={16} className={theme.textMuted} />
                <span className={`text-sm ${theme.text}`}>{order.phone}</span>
              </div>
            )}
            {order.address && (
              <div className="flex items-center gap-2">
                <MapPin size={16} className={theme.textMuted} />
                <span className={`text-sm ${theme.text}`}>{order.address}</span>
              </div>
            )}
          </div>

          {/* Artikelliste (aus raw_json) */}
          {(() => {
            const raw = order.raw_json
            if (!raw) return null
            const otcItems = (raw.unmixedOrdersItemsOtc || []).flatMap(g => g.itemList || [])
            if (otcItems.length === 0) return null
            const charges = raw.charges
            return (
              <div>
                <h4 className={`text-sm font-semibold mb-2 flex items-center gap-1.5 ${theme.text}`}>
                  <Package size={16} />
                  Artikel ({otcItems.length})
                </h4>
                <div className={`rounded-xl border ${theme.border} overflow-hidden`}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className={`text-left px-3 py-2 text-xs font-medium ${theme.textMuted}`}>Artikel</th>
                        <th className={`text-center px-2 py-2 text-xs font-medium ${theme.textMuted} w-12`}>Anz.</th>
                        <th className={`text-right px-3 py-2 text-xs font-medium ${theme.textMuted} w-20`}>Preis</th>
                      </tr>
                    </thead>
                    <tbody>
                      {otcItems.map((item, i) => (
                        <tr key={i} className={`border-t ${theme.border}`}>
                          <td className={`px-3 py-2 ${theme.text}`}>
                            <p className="font-medium text-sm">{item.productName}</p>
                            <p className={`text-xs ${theme.textMuted}`}>PZN {String(item.productPzn).padStart(8, '0')} · {item.packageSize}</p>
                          </td>
                          <td className={`text-center px-2 py-2 ${theme.text}`}>{item.quantity}</td>
                          <td className={`text-right px-3 py-2 ${theme.text} tabular-nums`}>{item.priceTotal.toFixed(2)} €</td>
                        </tr>
                      ))}
                    </tbody>
                    {charges && (
                      <tfoot>
                        <tr className={`border-t-2 ${theme.border} bg-gray-50`}>
                          <td className={`px-3 py-2 text-sm font-semibold ${theme.text}`} colSpan={2}>Gesamt</td>
                          <td className={`text-right px-3 py-2 text-sm font-semibold ${theme.text} tabular-nums`}>{charges.totalAmount.toFixed(2)} €</td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            )
          })()}

          {/* Bestelldetails */}
          <div className={`grid grid-cols-2 gap-3 p-3 rounded-xl bg-gray-50 border ${theme.border}`}>
            {order.dispatch_type && (
              <div className="flex items-center gap-2">
                <Truck size={16} className={theme.textMuted} />
                <div>
                  <p className={`text-xs ${theme.textMuted}`}>Versandart</p>
                  <p className={`text-sm font-medium ${theme.text}`}>{DISPATCH_LABELS[order.dispatch_type] || order.dispatch_type}</p>
                </div>
              </div>
            )}
            {order.payment_method && (
              <div className="flex items-center gap-2">
                <CreditCard size={16} className={theme.textMuted} />
                <div>
                  <p className={`text-xs ${theme.textMuted}`}>Zahlung</p>
                  <p className={`text-sm font-medium ${theme.text}`}>{order.payment_method}</p>
                </div>
              </div>
            )}
            {order.partner_name && (
              <div className="flex items-center gap-2">
                <Storefront size={16} className={theme.textMuted} />
                <div>
                  <p className={`text-xs ${theme.textMuted}`}>Partner</p>
                  <p className={`text-sm font-medium ${theme.text}`}>{order.partner_name}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <ShoppingCart size={16} className={theme.textMuted} />
              <div>
                <p className={`text-xs ${theme.textMuted}`}>Bestellt am</p>
                <p className={`text-sm font-medium ${theme.text}`}>
                  {formatDate(order.order_date)} {formatTime(order.order_date)}
                </p>
              </div>
            </div>
          </div>

          {/* E-Rezepte (Code + QR-Bild kombiniert) */}
          {erezeptCodes.length > 0 && (
            <div>
              <h4 className={`text-sm font-semibold mb-2 flex items-center gap-1.5 ${theme.text}`}>
                <Pill size={16} />
                E-Rezepte ({erezeptCodes.length})
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {erezeptCodes.map((code, i) => {
                  const codeStr = typeof code === 'object' && code !== null
                    ? JSON.stringify(code)
                    : String(code)
                  const qrUrl = qrUrls[i]
                  const isCopied = copiedSet.has(i)
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition-colors ${isCopied ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-200 hover:bg-red-100'}`}
                      onClick={() => {
                        navigator.clipboard.writeText(codeStr)
                        setCopiedSet(prev => new Set(prev).add(i))
                      }}
                      title={isCopied ? 'Kopiert' : 'Klicken zum Kopieren'}
                    >
                      {qrUrl ? (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setLightboxUrl(qrUrl) }}
                          className="shrink-0 rounded-lg overflow-hidden border border-gray-200 hover:opacity-80 transition-opacity"
                        >
                          <img src={qrUrl} alt={`QR ${i + 1}`} className="w-10 h-10 object-contain bg-white" />
                        </button>
                      ) : prescriptionImages[i] && loadingQr ? (
                        <div className="shrink-0 w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                          <ArrowClockwise size={14} className={`animate-spin ${theme.textMuted}`} />
                        </div>
                      ) : null}
                      <p className={`text-xs font-mono ${theme.text} min-w-0 flex-1 line-clamp-2`}>{codeStr}</p>
                      <span className={`shrink-0 ${isCopied ? 'text-green-600' : 'text-red-400'}`}>
                        {isCopied ? <Check size={14} /> : <Copy size={14} />}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Rezeptfotos (nur wenn keine E-Rezept-Codes, z.B. FOTO-Bestellungen) */}
          {prescriptionImages.length > 0 && erezeptCodes.length === 0 && (
            <div>
              <h4 className={`text-sm font-semibold mb-2 flex items-center gap-1.5 ${theme.text}`}>
                <ImageSquare size={16} />
                Rezeptfotos ({prescriptionImages.length})
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {prescriptionImages.map((_, i) => {
                  const qrUrl = qrUrls[i]
                  return qrUrl ? (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setLightboxUrl(qrUrl)}
                      className={`rounded-xl overflow-hidden border ${theme.border} hover:opacity-80 transition-opacity`}
                    >
                      <img src={qrUrl} alt={`Rezeptfoto ${i + 1}`} className="w-full h-40 object-contain bg-white" />
                    </button>
                  ) : loadingQr ? (
                    <div key={i} className={`h-40 rounded-xl bg-gray-100 border ${theme.border} flex items-center justify-center`}>
                      <ArrowClockwise size={20} className={`animate-spin ${theme.textMuted}`} />
                    </div>
                  ) : null
                })}
              </div>
            </div>
          )}

          {/* Chat-Nachrichten */}
          {chatMessages.length > 0 && (
            <div>
              <h4 className={`text-sm font-semibold mb-2 flex items-center gap-1.5 ${theme.text}`}>
                <ChatDots size={16} />
                Nachrichten ({chatMessages.length})
              </h4>
              <div className="space-y-2">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`text-sm p-3 rounded-xl bg-gray-50 border ${theme.border}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-medium ${msg.author === 'SUPPLIER' ? 'text-teal-600' : theme.textMuted}`}>
                        {msg.author === 'SUPPLIER' ? 'Apotheke' : msg.author === 'CUSTOMER' ? 'Kunde' : msg.author}
                      </span>
                      <span className={`text-xs ${theme.textMuted}`}>{formatTime(msg.time)}</span>
                    </div>
                    <p className={`${theme.text} whitespace-pre-line`}>{msg.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PDF */}
          {order.pdf_path && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className={`text-sm font-semibold flex items-center gap-1.5 ${theme.text}`}>
                  <FilePdf size={16} />
                  Bestellungs-PDF
                </h4>
                <div className="flex items-center gap-1">
                  {!pdfUrl && (
                    <button
                      type="button"
                      onClick={handleLoadPdf}
                      disabled={loadingPdf}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg ${theme.bgHover} ${theme.textSecondary}`}
                    >
                      <Eye size={14} />
                      {loadingPdf ? 'Laden...' : 'Anzeigen'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => printFile(order.pdf_path)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg ${theme.bgHover} ${theme.textSecondary}`}
                  >
                    <Printer size={14} />
                    Drucken
                  </button>
                </div>
              </div>
              {pdfUrl && (
                <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-100" style={{ height: '400px' }}>
                  <iframe src={pdfUrl} className="w-full h-full border-0" title="Bestellungs-PDF" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Lightbox */}
        {lightboxUrl && (
          <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4"
            onClick={() => setLightboxUrl(null)}
          >
            <button
              type="button"
              onClick={() => setLightboxUrl(null)}
              className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"
            >
              <X size={24} />
            </button>
            <img
              src={lightboxUrl}
              alt="Rezeptfoto"
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </div>
    </div>
  )
}

function isUnseen(order) {
  return !order.seen_at
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

export default function GesundBestellungenView({ theme }) {
  const { ordersByDay, loading, refreshing, refresh, getViewUrl, printFile, markSeen } = useGesundBestellungen()
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [expandedSections, setExpandedSections] = useState(new Set(['today']))
  const sections = useMemo(() => buildSections(ordersByDay), [ordersByDay])

  const toggleSection = (key) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

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
      ) : ordersByDay.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <ShoppingCart size={48} className={theme.textMuted} />
          <p className={`text-lg ${theme.textMuted}`}>Keine Bestellungen vorhanden</p>
        </div>
      ) : (
        <div className={`${theme.panel} rounded-xl border ${theme.border} overflow-hidden`}>
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
                                {(order.erezept_codes || []).length > 0 && (
                                  <span className="flex items-center gap-1 text-xs text-teal-600">
                                    <Pill size={14} />
                                    {order.erezept_codes.length} E-Rezept{order.erezept_codes.length > 1 ? 'e' : ''}
                                  </span>
                                )}
                                {(order.chat_messages || []).filter(m => m.type === 'CHAT').length > 0 && (
                                  <span className={`flex items-center gap-1 text-xs ${theme.textMuted}`}>
                                    <ChatDots size={14} />
                                    {order.chat_messages.filter(m => m.type === 'CHAT').length}
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
                        {orders.map(order => {
                          const unseen = isUnseen(order)
                          return (
                            <div
                              key={order.id}
                              className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors border-l-2 ${unseen ? 'border-l-red-400 bg-red-50/30' : 'border-l-transparent'}`}
                              onClick={() => handleOpenOrder(order)}
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
                                  onClick={(e) => { e.stopPropagation(); handleOpenOrder(order) }}
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
                        })}
                      </div>
                    ))}
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
