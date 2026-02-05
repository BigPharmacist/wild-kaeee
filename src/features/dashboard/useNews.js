import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

/**
 * Hook für News-Verwaltung
 * - Lädt aktive News (nicht abgelaufen)
 * - CRUD-Operationen für Admins
 * - Realtime-Updates
 */
export default function useNews({ session, currentStaff } = {}) {
  const [news, setNews] = useState([])
  const [allNews, setAllNews] = useState([]) // Alle News inkl. abgelaufene (für Admin)
  const [newsLoading, setNewsLoading] = useState(false)
  const [newsError, setNewsError] = useState('')
  const [newsSaving, setNewsSaving] = useState(false)
  const [newsSaveError, setNewsSaveError] = useState('')

  const isAdmin = currentStaff?.is_admin === true

  // Aktive News laden (für Dashboard)
  const fetchNews = useCallback(async () => {
    if (!session?.user?.id) return

    setNewsLoading(true)
    setNewsError('')

    try {
      const now = new Date().toISOString()

      const { data, error } = await supabase
        .from('news')
        .select('*')
        .or(`gueltig_bis.is.null,gueltig_bis.gt.${now}`)
        .order('prioritaet', { ascending: true }) // hoch zuerst (alphabetisch: hoch < niedrig < normal)
        .order('erstellt_am', { ascending: false })

      if (error) throw error

      // Sortierung korrigieren: hoch > normal > niedrig
      const priorityOrder = { hoch: 0, normal: 1, niedrig: 2 }
      const sorted = (data || []).sort((a, b) => {
        const pA = priorityOrder[a.prioritaet] ?? 1
        const pB = priorityOrder[b.prioritaet] ?? 1
        if (pA !== pB) return pA - pB
        // Bei gleicher Priorität: neueste zuerst
        return new Date(b.erstellt_am) - new Date(a.erstellt_am)
      })

      setNews(sorted)
    } catch (err) {
      setNewsError(err.message)
      setNews([])
    } finally {
      setNewsLoading(false)
    }
  }, [session])

  // Alle News laden (für Admin-Bereich)
  const fetchAllNews = useCallback(async () => {
    if (!session?.user?.id || !isAdmin) return

    setNewsLoading(true)
    setNewsError('')

    try {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .order('erstellt_am', { ascending: false })

      if (error) throw error
      setAllNews(data || [])
    } catch (err) {
      setNewsError(err.message)
      setAllNews([])
    } finally {
      setNewsLoading(false)
    }
  }, [session, isAdmin])

  // News erstellen
  const createNews = useCallback(async (newsData) => {
    if (!isAdmin) {
      setNewsSaveError('Keine Berechtigung')
      return null
    }

    setNewsSaving(true)
    setNewsSaveError('')

    try {
      const { data, error } = await supabase
        .from('news')
        .insert([{
          titel: newsData.titel,
          info: newsData.info,
          autor_name: newsData.autor_name,
          kategorie: newsData.kategorie || 'Info',
          prioritaet: newsData.prioritaet || 'normal',
          gueltig_bis: newsData.gueltig_bis || null,
        }])
        .select()
        .single()

      if (error) throw error

      // Listen aktualisieren
      await fetchNews()
      await fetchAllNews()

      return data
    } catch (err) {
      setNewsSaveError(err.message)
      return null
    } finally {
      setNewsSaving(false)
    }
  }, [isAdmin, fetchNews, fetchAllNews])

  // News aktualisieren
  const updateNews = useCallback(async (id, newsData) => {
    if (!isAdmin) {
      setNewsSaveError('Keine Berechtigung')
      return null
    }

    setNewsSaving(true)
    setNewsSaveError('')

    try {
      const { data, error } = await supabase
        .from('news')
        .update({
          titel: newsData.titel,
          info: newsData.info,
          autor_name: newsData.autor_name,
          kategorie: newsData.kategorie,
          prioritaet: newsData.prioritaet,
          gueltig_bis: newsData.gueltig_bis || null,
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      // Listen aktualisieren
      await fetchNews()
      await fetchAllNews()

      return data
    } catch (err) {
      setNewsSaveError(err.message)
      return null
    } finally {
      setNewsSaving(false)
    }
  }, [isAdmin, fetchNews, fetchAllNews])

  // News löschen
  const deleteNews = useCallback(async (id) => {
    if (!isAdmin) {
      setNewsSaveError('Keine Berechtigung')
      return false
    }

    setNewsSaving(true)
    setNewsSaveError('')

    try {
      const { error } = await supabase
        .from('news')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Listen aktualisieren
      await fetchNews()
      await fetchAllNews()

      return true
    } catch (err) {
      setNewsSaveError(err.message)
      return false
    } finally {
      setNewsSaving(false)
    }
  }, [isAdmin, fetchNews, fetchAllNews])

  // Initial laden
  useEffect(() => {
    fetchNews()
  }, [fetchNews])

  // Realtime Updates abonnieren
  useEffect(() => {
    if (!session?.user?.id) return

    const channel = supabase
      .channel('news-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'news' }, () => {
        fetchNews()
        if (isAdmin) fetchAllNews()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [session, fetchNews, fetchAllNews, isAdmin])

  return {
    // Aktive News (für Dashboard)
    news,
    newsLoading,
    newsError,
    fetchNews,

    // Alle News (für Admin)
    allNews,
    fetchAllNews,

    // CRUD
    createNews,
    updateNews,
    deleteNews,
    newsSaving,
    newsSaveError,

    // Hilfsfunktionen
    isAdmin,
  }
}

// Kategorie-Konfiguration für UI
export const NEWS_KATEGORIEN = [
  { value: 'Info', label: 'Info', color: 'bg-blue-100 text-blue-700' },
  { value: 'Wichtig', label: 'Wichtig', color: 'bg-red-100 text-red-700' },
  { value: 'Update', label: 'Update', color: 'bg-green-100 text-green-700' },
  { value: 'Wartung', label: 'Wartung', color: 'bg-orange-100 text-orange-700' },
  { value: 'Event', label: 'Event', color: 'bg-purple-100 text-purple-700' },
]

// Priorität-Konfiguration für UI
export const NEWS_PRIORITAETEN = [
  { value: 'hoch', label: 'Hoch', color: 'text-red-600' },
  { value: 'normal', label: 'Normal', color: 'text-gray-600' },
  { value: 'niedrig', label: 'Niedrig', color: 'text-gray-400' },
]

// Hilfsfunktion: Kategorie-Farbe ermitteln
export function getKategorieStyle(kategorie) {
  return NEWS_KATEGORIEN.find(k => k.value === kategorie)?.color || 'bg-gray-100 text-gray-700'
}

// Hilfsfunktion: Priorität-Farbe ermitteln
export function getPrioritaetStyle(prioritaet) {
  return NEWS_PRIORITAETEN.find(p => p.value === prioritaet)?.color || 'text-gray-600'
}
