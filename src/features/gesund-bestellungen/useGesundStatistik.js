import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

export default function useGesundStatistik(year) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchStats = useCallback((y) => {
    setLoading(true)
    supabase.rpc('get_gesund_statistics', { p_year: y }).then(({ data: result, error }) => {
      if (error) {
        console.error('get_gesund_statistics error:', error)
        setData(null)
      } else {
        setData(result)
      }
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    fetchStats(year) // eslint-disable-line react-hooks/set-state-in-effect
  }, [year, fetchStats])

  return { data, loading }
}
