import { useState, useCallback, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { parseDataMatrixCode, extractPznFromBarcode } from './scanUtils'

// Cache für PZN-Lookups (vermeidet wiederholte API-Calls)
const pznCache = new Map()

const DEFAULT_SESSION = {
  id: null,
  name: '',
  scans: [],
  createdAt: null,
}

export function useScan({ sessionUserId, pharmacyId }) {
  // Session state
  const [currentSession, setCurrentSession] = useState(DEFAULT_SESSION)
  const [sessions, setSessions] = useState([])
  const [sessionsLoading, setSessionsLoading] = useState(false)

  // Scan state
  const [scans, setScans] = useState([])
  const [scansLoading, setScansLoading] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [lastScan, setLastScan] = useState(null)

  // Settings
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('scan_sound_enabled')
    return saved !== null ? saved === 'true' : true
  })
  const [vibrationEnabled, setVibrationEnabled] = useState(() => {
    const saved = localStorage.getItem('scan_vibration_enabled')
    return saved !== null ? saved === 'true' : true
  })
  const [resetQuantityAfterScan, setResetQuantityAfterScan] = useState(() => {
    const saved = localStorage.getItem('scan_reset_quantity')
    return saved !== null ? saved === 'true' : true
  })

  // Persist settings
  useEffect(() => {
    localStorage.setItem('scan_sound_enabled', soundEnabled)
  }, [soundEnabled])

  useEffect(() => {
    localStorage.setItem('scan_vibration_enabled', vibrationEnabled)
  }, [vibrationEnabled])

  useEffect(() => {
    localStorage.setItem('scan_reset_quantity', resetQuantityAfterScan)
  }, [resetQuantityAfterScan])

  // Reset state when user changes
  useEffect(() => {
    if (!sessionUserId) {
      setCurrentSession(DEFAULT_SESSION)
      setSessions([])
      setScans([])
    }
  }, [sessionUserId])

  // Generate a new session ID
  const generateSessionId = useCallback(() => {
    return crypto.randomUUID()
  }, [])

  // Lookup PZN in catalog
  const lookupPzn = useCallback(async (pzn) => {
    if (!pzn) return null

    const cleanPzn = pzn.replace(/\D/g, '')
    console.log('PZN Lookup für:', cleanPzn)

    // Check cache first
    if (pznCache.has(cleanPzn)) {
      console.log('PZN aus Cache:', pznCache.get(cleanPzn))
      return pznCache.get(cleanPzn)
    }

    // Verschiedene Formate probieren
    const variants = [
      cleanPzn,                          // Original
      cleanPzn.padStart(8, '0'),         // Mit führenden Nullen auf 8 Stellen
      cleanPzn.replace(/^0+/, ''),       // Ohne führende Nullen
      cleanPzn.substring(0, 7),          // Erste 7 Stellen
      cleanPzn.substring(0, 8),          // Erste 8 Stellen
    ]

    // Eindeutige Varianten
    const uniqueVariants = [...new Set(variants)].filter(v => v.length >= 7)
    console.log('Probiere PZN-Varianten:', uniqueVariants)

    for (const variant of uniqueVariants) {
      const { data, error } = await supabase
        .from('pzn_catalog')
        .select('pzn, article_name, quantity, unit, manufacturer')
        .eq('pzn', variant)
        .single()

      if (!error && data) {
        console.log('PZN gefunden:', data)
        pznCache.set(cleanPzn, data)
        return data
      }
    }

    console.log('PZN nicht gefunden')
    pznCache.set(cleanPzn, null)
    return null
  }, [])

  // Fetch all sessions for this user/pharmacy
  const fetchSessions = useCallback(async () => {
    if (!sessionUserId) return

    setSessionsLoading(true)
    const { data, error } = await supabase
      .from('inventory_scans')
      .select('session_id, session_name, scanned_at')
      .eq('user_id', sessionUserId)
      .order('scanned_at', { ascending: false })

    if (error) {
      console.error('Fehler beim Laden der Sessions:', error)
      setSessionsLoading(false)
      return
    }

    // Group by session_id and get latest scan time
    const sessionMap = new Map()
    data?.forEach((scan) => {
      if (!sessionMap.has(scan.session_id)) {
        sessionMap.set(scan.session_id, {
          id: scan.session_id,
          name: scan.session_name || 'Unbenannte Session',
          lastScan: scan.scanned_at,
        })
      }
    })

    setSessions(Array.from(sessionMap.values()))
    setSessionsLoading(false)
  }, [sessionUserId])

  // Fetch scans for current session
  const fetchScansForSession = useCallback(async (sessionId) => {
    if (!sessionId) return

    setScansLoading(true)
    const { data, error } = await supabase
      .from('inventory_scans')
      .select('*')
      .eq('session_id', sessionId)
      .order('scanned_at', { ascending: false })

    if (error) {
      console.error('Fehler beim Laden der Scans:', error)
      setScansLoading(false)
      return
    }

    setScans(data || [])
    setScansLoading(false)
  }, [])

  // Start a new session
  const startNewSession = useCallback((name) => {
    const sessionId = generateSessionId()
    const session = {
      id: sessionId,
      name: name || `Inventur ${new Date().toLocaleDateString('de-DE')}`,
      scans: [],
      createdAt: new Date().toISOString(),
    }
    setCurrentSession(session)
    setScans([])
    return session
  }, [generateSessionId])

  // Load existing session
  const loadSession = useCallback(async (sessionId) => {
    const session = sessions.find((s) => s.id === sessionId)
    if (session) {
      setCurrentSession({
        id: session.id,
        name: session.name,
        scans: [],
        createdAt: session.lastScan,
      })
      await fetchScansForSession(sessionId)
    }
  }, [sessions, fetchScansForSession])

  // Handle a successful scan
  const handleScan = useCallback(async (code, codeType) => {
    if (!currentSession.id || !sessionUserId) return

    // Parse pharmaceutical code and lookup article name
    const pharmaData = parseDataMatrixCode(code)
    let pzn = pharmaData?.pzn

    // Falls kein DataMatrix, versuche EAN/Barcode zu parsen
    if (!pzn) {
      const barcodeData = extractPznFromBarcode(code)
      if (barcodeData?.pzn) {
        pzn = barcodeData.pzn
        console.log('PZN aus Barcode extrahiert:', pzn, 'Quelle:', barcodeData.source)
      }
    }

    let articleInfo = null
    if (pzn) {
      articleInfo = await lookupPzn(pzn)
    }

    // Check if this code was already scanned in this session
    const existingScan = scans.find((s) => s.code === code)

    if (existingScan) {
      // Update quantity of existing scan
      const newQuantity = existingScan.quantity + quantity
      const { error } = await supabase
        .from('inventory_scans')
        .update({ quantity: newQuantity, scanned_at: new Date().toISOString() })
        .eq('id', existingScan.id)

      if (!error) {
        setScans((prev) =>
          prev.map((s) =>
            s.id === existingScan.id
              ? { ...s, quantity: newQuantity, scanned_at: new Date().toISOString() }
              : s
          )
        )
        setLastScan({
          code,
          codeType,
          quantity,
          action: 'added',
          total: newQuantity,
          articleName: articleInfo?.article_name || existingScan.article_name,
          pzn
        })
      }
    } else {
      // Create new scan entry
      const newScan = {
        pharmacy_id: pharmacyId || null,
        user_id: sessionUserId,
        session_id: currentSession.id,
        session_name: currentSession.name,
        code,
        code_type: codeType,
        quantity,
        scanned_at: new Date().toISOString(),
        notes: articleInfo?.article_name || null, // Store article name in notes for now
      }

      const { data, error } = await supabase
        .from('inventory_scans')
        .insert(newScan)
        .select()
        .single()

      if (!error && data) {
        // Add article info to the scan data for display
        const enrichedData = { ...data, article_name: articleInfo?.article_name }
        setScans((prev) => [enrichedData, ...prev])
        setLastScan({
          code,
          codeType,
          quantity,
          action: 'new',
          total: quantity,
          articleName: articleInfo?.article_name,
          pzn
        })
      }
    }

    // Reset quantity if setting is enabled
    if (resetQuantityAfterScan) {
      setQuantity(1)
    }
  }, [currentSession, sessionUserId, pharmacyId, scans, quantity, resetQuantityAfterScan, lookupPzn])

  // Delete a scan
  const deleteScan = useCallback(async (scanId) => {
    const { error } = await supabase
      .from('inventory_scans')
      .delete()
      .eq('id', scanId)

    if (!error) {
      setScans((prev) => prev.filter((s) => s.id !== scanId))
    }
  }, [])

  // Update scan quantity
  const updateScanQuantity = useCallback(async (scanId, newQuantity) => {
    if (newQuantity < 1) return

    const { error } = await supabase
      .from('inventory_scans')
      .update({ quantity: newQuantity })
      .eq('id', scanId)

    if (!error) {
      setScans((prev) =>
        prev.map((s) => (s.id === scanId ? { ...s, quantity: newQuantity } : s))
      )
    }
  }, [])

  // Delete entire session
  const deleteSession = useCallback(async (sessionId) => {
    const { error } = await supabase
      .from('inventory_scans')
      .delete()
      .eq('session_id', sessionId)

    if (!error) {
      setSessions((prev) => prev.filter((s) => s.id !== sessionId))
      if (currentSession.id === sessionId) {
        setCurrentSession(DEFAULT_SESSION)
        setScans([])
      }
    }
  }, [currentSession.id])

  // Export session as CSV
  const exportSessionAsCsv = useCallback(() => {
    if (scans.length === 0) return

    const headers = ['PZN', 'Artikelname', 'Code', 'Typ', 'Menge', 'Gescannt am']
    const rows = scans.map((s) => {
      const pharmaData = parseDataMatrixCode(s.code)
      return [
        pharmaData?.pzn || '',
        s.article_name || s.notes || '',
        s.code,
        s.code_type || '',
        s.quantity,
        new Date(s.scanned_at).toLocaleString('de-DE'),
      ]
    })

    const csvContent = [
      headers.join(';'),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(';')),
    ].join('\n')

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${currentSession.name || 'inventur'}_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }, [scans, currentSession.name])

  // Calculate totals
  const totalItems = scans.reduce((sum, s) => sum + s.quantity, 0)
  const uniqueCodes = scans.length

  return {
    // Session state
    currentSession,
    sessions,
    sessionsLoading,

    // Scan state
    scans,
    scansLoading,
    quantity,
    lastScan,

    // Settings
    soundEnabled,
    vibrationEnabled,
    resetQuantityAfterScan,

    // Setters
    setQuantity,
    setSoundEnabled,
    setVibrationEnabled,
    setResetQuantityAfterScan,

    // Actions
    fetchSessions,
    startNewSession,
    loadSession,
    handleScan,
    deleteScan,
    updateScanQuantity,
    deleteSession,
    exportSessionAsCsv,
    lookupPzn,

    // Computed
    totalItems,
    uniqueCodes,
  }
}
