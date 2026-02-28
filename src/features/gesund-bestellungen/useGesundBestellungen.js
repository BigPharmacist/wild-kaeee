import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { supabase } from '../../lib/supabase'

function getMondayLastWeek() {
  const now = new Date()
  const day = now.getUTCDay() // 0=So
  const diff = day === 0 ? 13 : day + 6 // Montag Vorwoche
  const monday = new Date(now)
  monday.setUTCDate(now.getUTCDate() - diff)
  monday.setUTCHours(0, 0, 0, 0)
  return monday
}

export default function useGesundBestellungen() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const debounceRef = useRef(null)

  const fetchOrders = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    try {
      const mondayLastWeek = getMondayLastWeek()
      const { data, error } = await supabase
        .from('gesund_orders_list')
        .select('*')
        .gte('order_date', mondayLastWeek.toISOString())
        .order('order_date', { ascending: false })

      if (error) {
        console.error('Fehler beim Laden der Gesund.de-Bestellungen:', error)
        return
      }

      setOrders(data || [])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  const refresh = useCallback(() => {
    fetchOrders(true)
  }, [fetchOrders])

  // Heutiges UTC-Datum
  const todayKey = useMemo(() => {
    const now = new Date()
    return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`
  }, [])

  // Orders nach Tag gruppieren (order_date, neueste zuerst)
  // order_date ist lokale Zeit (CET/CEST), aber als UTC gespeichert → UTC-Datum verwenden
  const ordersByDay = useMemo(() => {
    const groups = {}
    for (const order of orders) {
      const date = new Date(order.order_date || order.created_at)
      const dayKey = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
      if (!groups[dayKey]) {
        groups[dayKey] = []
      }
      groups[dayKey].push(order)
    }

    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, dayOrders]) => ({ date, orders: dayOrders }))
  }, [orders])

  // Heutige Bestellungen separat
  const todayOrders = useMemo(() => {
    return orders.filter(order => {
      const date = new Date(order.order_date || order.created_at)
      const dayKey = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
      return dayKey === todayKey
    })
  }, [orders, todayKey])

  // Initial fetch
  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // Realtime auf gesund_orders — debounced refetch (300ms)
  useEffect(() => {
    const channel = supabase
      .channel('gesund-orders-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'gesund_orders',
      }, () => {
        clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => {
          fetchOrders(true)
          window.dispatchEvent(new CustomEvent('gesund-orders-changed'))
        }, 300)
      })
      .subscribe()

    return () => {
      clearTimeout(debounceRef.current)
      supabase.removeChannel(channel)
    }
  }, [fetchOrders])

  const getViewUrl = useCallback(async (pdfPath) => {
    if (!pdfPath) return null
    const { data, error } = await supabase.storage
      .from('gesund-bestellungen')
      .createSignedUrl(pdfPath, 300)

    if (error) {
      console.error('Fehler beim Erstellen der View-URL:', error)
      return null
    }
    return data.signedUrl
  }, [])

  const printFile = useCallback(async (pdfPath) => {
    const url = await getViewUrl(pdfPath)
    if (!url) return
    const printWindow = window.open(url, '_blank')
    if (printWindow) {
      printWindow.addEventListener('load', () => {
        printWindow.print()
      })
    }
  }, [getViewUrl])

  const markSeen = useCallback(async (orderId) => {
    const { error } = await supabase
      .from('gesund_orders')
      .update({ seen_at: new Date().toISOString() })
      .eq('id', orderId)

    if (!error) {
      // Optimistic update im lokalen State
      setOrders(prev => prev.map(o =>
        o.id === orderId ? { ...o, seen_at: new Date().toISOString() } : o
      ))
      window.dispatchEvent(new CustomEvent('gesund-order-seen'))
    }
  }, [])

  // Einzelnen Tag on-demand laden (für freie Datumsauswahl)
  const loadDay = useCallback(async (dateStr) => {
    const dayStart = new Date(dateStr + 'T00:00:00Z')
    const dayEnd = new Date(dayStart)
    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1)
    const { data, error } = await supabase
      .from('gesund_orders_list')
      .select('*')
      .gte('order_date', dayStart.toISOString())
      .lt('order_date', dayEnd.toISOString())
      .order('order_date', { ascending: false })

    if (error) {
      console.error('Fehler beim Laden der Bestellungen:', error)
      return []
    }
    return data || []
  }, [])

  return { ordersByDay, todayOrders, loading, refreshing, refresh, getViewUrl, printFile, markSeen, loadDay }
}
