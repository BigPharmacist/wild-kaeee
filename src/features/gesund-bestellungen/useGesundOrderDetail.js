import { useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

export default function useGesundOrderDetail() {
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(false)

  const loadDetail = useCallback(async (orderId) => {
    setDetail(null)
    setLoading(true)
    const { data, error } = await supabase
      .from('gesund_orders')
      .select('raw_json, chat_messages, prescription_images, erezept_codes, email, phone, address, dispatch_type, payment_method')
      .eq('id', orderId)
      .single()

    if (error) {
      console.error('Fehler beim Laden der Bestelldetails:', error)
    } else {
      setDetail(data)
    }
    setLoading(false)
  }, [])

  const clearDetail = useCallback(() => {
    setDetail(null)
  }, [])

  return { detail, loading, loadDetail, clearDetail }
}
