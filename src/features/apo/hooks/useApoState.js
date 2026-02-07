import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase, supabaseUrl } from '../../../lib/supabase'
import { compressImage } from '../../../lib/imageProcessing'

/**
 * Custom hook for all Apo-related state and logic
 * Extracted from App.jsx to reduce its complexity
 */
export function useApoState({ session, activeView, apoTab, staffByAuthId, pharmacies }) {
  // Year and search state
  const [apoYear, setApoYear] = useState(() => new Date().getFullYear())
  const [apoSearch, setApoSearch] = useState('')

  // Message lists
  const [amkMessages, setAmkMessages] = useState([])
  const [amkLoading, setAmkLoading] = useState(false)
  const [recallMessages, setRecallMessages] = useState([])
  const [recallLoading, setRecallLoading] = useState(false)
  const [lavAusgaben, setLavAusgaben] = useState([])
  const [lavLoading, setLavLoading] = useState(false)
  const [rhbMessages, setRhbMessages] = useState([])
  const [rhbLoading, setRhbLoading] = useState(false)

  // Selected message and documentation
  const [selectedApoMessage, setSelectedApoMessage] = useState(null)
  const [showDokumentationModal, setShowDokumentationModal] = useState(false)
  const [dokumentationBemerkung, setDokumentationBemerkung] = useState('')
  const [dokumentationSignature, setDokumentationSignature] = useState(null)
  const [showSignatureCanvas, setShowSignatureCanvas] = useState(false)
  const [dokumentationLoading, setDokumentationLoading] = useState(false)
  const [existingDokumentationen, setExistingDokumentationen] = useState([])

  // PZN photos
  const [savedPznFotos, setSavedPznFotos] = useState({})
  const [pznFotoUploading, setPznFotoUploading] = useState(false)
  const [activePzn, setActivePzn] = useState(null)
  const pznCameraInputRef = useRef(null)

  // Unread counts
  const [unreadCounts, setUnreadCounts] = useState({ amk: 0, recall: 0, lav: 0, rhb: 0 })
  const [readMessageIds, setReadMessageIds] = useState({ amk: new Set(), recall: new Set(), lav: new Set(), rhb: new Set() })

  const monthNames = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']

  // Fetch functions
  const fetchAmkMessages = useCallback(async (year) => {
    setAmkLoading(true)
    const startDate = `${year}-01-01`
    const endDate = `${year}-12-31`
    const { data, error } = await supabase
      .from('abda_amk_messages')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false })
    if (!error && data) {
      // Dokumentationen für alle AMK-Meldungen laden
      const amkIds = data.map(m => m.id)
      const { data: allDoks } = await supabase
        .from('amk_dokumentationen')
        .select('*')
        .in('amk_message_id', amkIds)
        .order('erstellt_am', { ascending: false })

      // Dokumentationen den Meldungen zuordnen
      const doksById = {}
      if (allDoks) {
        for (const dok of allDoks) {
          if (!doksById[dok.amk_message_id]) {
            doksById[dok.amk_message_id] = []
          }
          doksById[dok.amk_message_id].push(dok)
        }
      }

      // Meldungen mit Dokumentationen anreichern
      const enrichedData = data.map(msg => ({
        ...msg,
        dokumentationen: doksById[msg.id] || []
      }))
      setAmkMessages(enrichedData)
    } else {
      setAmkMessages([])
    }
    setAmkLoading(false)
  }, [])

  const fetchRecallMessages = useCallback(async (year) => {
    setRecallLoading(true)
    const startDate = `${year}-01-01`
    const endDate = `${year}-12-31`
    const { data, error } = await supabase
      .from('abda_recall')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false })
    if (!error && data) {
      // Dokumentationen für alle Rückrufe laden
      const recallIds = data.map(m => m.id)
      const { data: allDoks } = await supabase
        .from('recall_dokumentationen')
        .select('*')
        .in('recall_message_id', recallIds)
        .order('erstellt_am', { ascending: false })

      // Dokumentationen den Rückrufen zuordnen
      const doksById = {}
      if (allDoks) {
        for (const dok of allDoks) {
          if (!doksById[dok.recall_message_id]) {
            doksById[dok.recall_message_id] = []
          }
          doksById[dok.recall_message_id].push(dok)
        }
      }

      // Rückrufe mit Dokumentationen anreichern
      const enrichedData = data.map(msg => ({
        ...msg,
        dokumentationen: doksById[msg.id] || []
      }))
      setRecallMessages(enrichedData)
    } else {
      setRecallMessages([])
    }
    setRecallLoading(false)
  }, [])

  const fetchLavAusgaben = useCallback(async (year) => {
    setLavLoading(true)
    const startDate = `${year}-01-01`
    const endDate = `${year}-12-31`
    const { data, error } = await supabase
      .from('lav_ausgaben')
      .select(`
        *,
        lav_themes (*)
      `)
      .gte('datum', startDate)
      .lte('datum', endDate)
      .order('datum', { ascending: false })
    if (!error && data) {
      setLavAusgaben(data)
    } else {
      setLavAusgaben([])
    }
    setLavLoading(false)
  }, [])

  const fetchRhbMessages = useCallback(async (year) => {
    setRhbLoading(true)
    const startDate = `${year}-01-01`
    const endDate = `${year}-12-31`
    const { data, error } = await supabase
      .from('rote_hand_briefe')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false })
    if (!error && data) {
      setRhbMessages(data)
    } else {
      setRhbMessages([])
    }
    setRhbLoading(false)
  }, [])

  // Unread counts
  const fetchUnreadCounts = useCallback(async (year) => {
    if (!session?.user?.id) return
    const { data, error } = await supabase.rpc('get_unread_counts', {
      p_user_id: session.user.id,
      p_year: year,
    })
    if (!error && data) {
      const counts = { amk: 0, recall: 0, lav: 0, rhb: 0 }
      data.forEach((row) => {
        counts[row.message_type] = Number(row.unread_count)
      })
      setUnreadCounts(counts)
    }
  }, [session?.user?.id])

  const fetchReadMessageIds = useCallback(async () => {
    if (!session?.user?.id) return
    const { data, error } = await supabase
      .from('message_read_status')
      .select('message_type, message_id')
      .eq('user_id', session.user.id)
    if (!error && data) {
      const ids = { amk: new Set(), recall: new Set(), lav: new Set(), rhb: new Set() }
      data.forEach((row) => {
        if (ids[row.message_type]) {
          ids[row.message_type].add(row.message_id)
        }
      })
      setReadMessageIds(ids)
    }
  }, [session?.user?.id])

  const markAsRead = useCallback(async (messageType, messageId) => {
    if (!session?.user?.id) return
    const idStr = String(messageId)
    // Prüfen ob bereits gelesen
    if (readMessageIds[messageType].has(idStr)) return
    const { error } = await supabase.from('message_read_status').insert({
      user_id: session.user.id,
      message_type: messageType,
      message_id: idStr,
    })
    if (error) {
      // Duplikat-Fehler ignorieren (bereits gelesen)
      if (error.code !== '23505') {
        console.error('markAsRead error:', error)
      }
      return
    }
    // Lokalen State aktualisieren
    setUnreadCounts((prev) => ({
      ...prev,
      [messageType]: Math.max(0, prev[messageType] - 1),
    }))
    setReadMessageIds((prev) => {
      const newIds = { ...prev }
      newIds[messageType] = new Set(prev[messageType])
      newIds[messageType].add(idStr)
      return newIds
    })
  }, [session?.user?.id, readMessageIds])

  // Documentation functions
  const loadDokumentationen = useCallback(async (messageId, messageType = 'amk') => {
    setDokumentationLoading(true)
    const tableName = messageType === 'recall' ? 'recall_dokumentationen' : 'amk_dokumentationen'
    const idColumn = messageType === 'recall' ? 'recall_message_id' : 'amk_message_id'

    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq(idColumn, messageId)
      .order('erstellt_am', { ascending: false })

    if (!error && data) {
      setExistingDokumentationen(data)
    } else {
      setExistingDokumentationen([])
    }
    setDokumentationLoading(false)
  }, [])

  const saveDokumentation = useCallback(async () => {
    const hasSavedPznFotos = Object.keys(savedPznFotos).length > 0
    if (!selectedApoMessage?.id || (!dokumentationBemerkung.trim() && !dokumentationSignature && !hasSavedPznFotos)) return

    const messageType = selectedApoMessage.type
    const tableName = messageType === 'recall' ? 'recall_dokumentationen' : 'amk_dokumentationen'
    const idColumn = messageType === 'recall' ? 'recall_message_id' : 'amk_message_id'

    // Name des eingeloggten Nutzers ermitteln
    const currentStaffMember = staffByAuthId[session?.user?.id]
    const userName = currentStaffMember
      ? `${currentStaffMember.first_name || ''} ${currentStaffMember.last_name || ''}`.trim()
      : session?.user?.email || 'Unbekannt'

    setDokumentationLoading(true)

    // PZN-Fotos aus der recall_pzn_fotos Tabelle in die Dokumentation kopieren
    const pznFotoPaths = messageType === 'recall' && hasSavedPznFotos ? savedPznFotos : null

    const { error } = await supabase
      .from(tableName)
      .insert({
        [idColumn]: selectedApoMessage.id,
        bemerkung: dokumentationBemerkung.trim() || null,
        unterschrift_data: dokumentationSignature || null,
        erstellt_von: session?.user?.id || null,
        erstellt_von_name: userName,
        pharmacy_id: pharmacies[0]?.id || null,
        ...(pznFotoPaths ? { pzn_fotos: pznFotoPaths } : {})
      })

    if (!error) {
      // Dokumentationen neu laden (für Button-Status)
      await loadDokumentationen(selectedApoMessage.id, messageType)
      // Liste aktualisieren (für Karten-Status)
      if (messageType === 'recall') {
        fetchRecallMessages(apoYear)
      } else {
        fetchAmkMessages(apoYear)
      }
      // Modal schließen nach erfolgreichem Speichern
      setShowDokumentationModal(false)
      setShowSignatureCanvas(false)
      setDokumentationBemerkung('')
      setDokumentationSignature(null)
    }
    setDokumentationLoading(false)
  }, [
    selectedApoMessage, dokumentationBemerkung, dokumentationSignature, savedPznFotos,
    session?.user?.id, staffByAuthId, pharmacies, apoYear,
    loadDokumentationen, fetchRecallMessages, fetchAmkMessages
  ])

  // PZN photo functions
  const loadSavedPznFotos = useCallback(async (recallMessageId) => {
    const { data, error } = await supabase
      .from('recall_pzn_fotos')
      .select('pzn, foto_path')
      .eq('recall_message_id', recallMessageId)

    if (!error && data) {
      const fotosMap = {}
      data.forEach(item => {
        fotosMap[item.pzn] = item.foto_path
      })
      setSavedPznFotos(fotosMap)
    } else {
      setSavedPznFotos({})
    }
  }, [])

  const handlePznClick = useCallback((pzn) => {
    if (pznFotoUploading) return
    setActivePzn(pzn)
    pznCameraInputRef.current?.click()
  }, [pznFotoUploading])

  const handlePznCameraCapture = useCallback(async (event) => {
    const file = event.target.files?.[0]
    if (!file || !activePzn || !selectedApoMessage?.id) return

    setPznFotoUploading(true)

    try {
      // Bestehende compressImage Funktion nutzen (max 800px, 0.7 quality)
      const compressed = await compressImage(file, 800, 0.7)

      // Foto sofort nach Storage hochladen
      const fileName = `${Date.now()}-${activePzn}.jpg`
      const { error: uploadError } = await supabase.storage
        .from('recall-fotos')
        .upload(fileName, compressed)

      if (uploadError) {
        console.error('Foto-Upload fehlgeschlagen:', uploadError.message)
        return
      }

      // Name des eingeloggten Nutzers ermitteln
      const currentStaffMember = staffByAuthId[session?.user?.id]
      const userName = currentStaffMember
        ? `${currentStaffMember.first_name || ''} ${currentStaffMember.last_name || ''}`.trim()
        : session?.user?.email || 'Unbekannt'

      // In Datenbank speichern (upsert - ersetzt bestehendes Foto für diese PZN)
      const { error: dbError } = await supabase
        .from('recall_pzn_fotos')
        .upsert({
          recall_message_id: selectedApoMessage.id,
          pzn: activePzn,
          foto_path: fileName,
          erstellt_von: session?.user?.id || null,
          erstellt_von_name: userName
        }, {
          onConflict: 'recall_message_id,pzn'
        })

      if (!dbError) {
        // State aktualisieren
        setSavedPznFotos(prev => ({
          ...prev,
          [activePzn]: fileName
        }))
      }
    } catch (e) {
      console.error('Fehler beim Speichern des PZN-Fotos:', e)
    } finally {
      setPznFotoUploading(false)
      setActivePzn(null)
      event.target.value = ''  // Reset für erneute Auswahl
    }
  }, [activePzn, selectedApoMessage?.id, session?.user?.id, staffByAuthId])

  // Helper functions
  const changeApoYear = useCallback((delta) => {
    setApoYear((prev) => prev + delta)
  }, [])

  const groupByMonth = useCallback((items, dateField) => {
    const groups = {}
    items.forEach((item) => {
      const dateValue = item[dateField]
      if (dateValue) {
        const month = new Date(dateValue).getMonth()
        if (!groups[month]) groups[month] = []
        groups[month].push(item)
      }
    })
    return [11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
      .filter((m) => groups[m] && groups[m].length > 0)
      .map((m) => ({ month: m, items: groups[m] }))
  }, [])

  const filterApoItems = useCallback((items, searchTerm, type) => {
    if (!searchTerm.trim()) return items
    const term = searchTerm.toLowerCase()
    return items.filter((item) => {
      if (type === 'amk' || type === 'recall') {
        return (
          item.title?.toLowerCase().includes(term) ||
          item.description?.toLowerCase().includes(term) ||
          item.full_text?.toLowerCase().includes(term) ||
          item.category?.toLowerCase().includes(term) ||
          item.product_name?.toLowerCase().includes(term)
        )
      } else if (type === 'lav') {
        const themeMatch = item.lav_themes?.some((t) => t.titel?.toLowerCase().includes(term))
        return (
          item.subject?.toLowerCase().includes(term) ||
          themeMatch
        )
      } else if (type === 'rhb') {
        return (
          item.title?.toLowerCase().includes(term) ||
          item.description?.toLowerCase().includes(term) ||
          item.wirkstoff?.toLowerCase().includes(term) ||
          item.sources?.some(s => s?.toLowerCase().includes(term))
        )
      }
      return false
    })
  }, [])

  // Effects
  useEffect(() => {
    if (session && activeView === 'pharma') {
      if (apoTab === 'amk') {
        fetchAmkMessages(apoYear)
      } else if (apoTab === 'recall') {
        fetchRecallMessages(apoYear)
      } else if (apoTab === 'lav') {
        fetchLavAusgaben(apoYear)
      } else if (apoTab === 'rhb') {
        fetchRhbMessages(apoYear)
      }
    }
  }, [session, activeView, apoTab, apoYear, fetchAmkMessages, fetchRecallMessages, fetchLavAusgaben, fetchRhbMessages])

  useEffect(() => {
    if (session?.user?.id) {
      fetchUnreadCounts(apoYear)
      fetchReadMessageIds()
    }
  }, [session?.user?.id, apoYear, fetchUnreadCounts, fetchReadMessageIds])

  useEffect(() => {
    if (selectedApoMessage?.id && selectedApoMessage?.type === 'recall') {
      loadSavedPznFotos(selectedApoMessage.id)
    } else {
      setSavedPznFotos({})
    }
  }, [selectedApoMessage?.id, selectedApoMessage?.type, loadSavedPznFotos])

  return {
    // Year and search
    apoYear,
    setApoYear,
    apoSearch,
    setApoSearch,
    changeApoYear,

    // Messages
    amkMessages,
    amkLoading,
    recallMessages,
    recallLoading,
    lavAusgaben,
    lavLoading,
    rhbMessages,
    rhbLoading,
    fetchAmkMessages,
    fetchRecallMessages,
    fetchLavAusgaben,
    fetchRhbMessages,

    // Selected message
    selectedApoMessage,
    setSelectedApoMessage,

    // Documentation
    showDokumentationModal,
    setShowDokumentationModal,
    dokumentationBemerkung,
    setDokumentationBemerkung,
    dokumentationSignature,
    setDokumentationSignature,
    showSignatureCanvas,
    setShowSignatureCanvas,
    dokumentationLoading,
    existingDokumentationen,
    loadDokumentationen,
    saveDokumentation,

    // PZN photos
    savedPznFotos,
    pznFotoUploading,
    activePzn,
    pznCameraInputRef,
    handlePznClick,
    handlePznCameraCapture,

    // Unread
    unreadCounts,
    readMessageIds,
    markAsRead,

    // Helpers
    monthNames,
    groupByMonth,
    filterApoItems,

    // Constants
    supabaseUrl,
  }
}

export default useApoState
