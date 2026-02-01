import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../../lib/supabase'

export const useWordDocuments = (pharmacyId) => {
  const [documents, setDocuments] = useState([])
  const [currentDoc, setCurrentDoc] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // Dokumente laden
  const fetchDocuments = useCallback(async () => {
    if (!pharmacyId) return

    setIsLoading(true)
    const { data, error } = await supabase
      .from('documents')
      .select('id, title, updated_at')
      .eq('pharmacy_id', pharmacyId)
      .eq('document_type', 'word')
      .order('updated_at', { ascending: false })

    if (!error) setDocuments(data || [])
    setIsLoading(false)
  }, [pharmacyId])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  // Einzelnes Dokument laden
  const loadDocument = async (id) => {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .single()

    if (!error) setCurrentDoc(data)
  }

  // Dokument speichern
  const saveDocument = async (id, content, title) => {
    const updateData = {
      content,
      updated_at: new Date().toISOString()
    }
    if (title !== undefined) {
      updateData.title = title
    }

    const { error } = await supabase
      .from('documents')
      .update(updateData)
      .eq('id', id)

    if (!error) {
      await fetchDocuments()
      // Update currentDoc with new values
      if (currentDoc?.id === id) {
        setCurrentDoc(prev => ({ ...prev, ...updateData }))
      }
    }
    return !error
  }

  // Neues Dokument erstellen
  const createDocument = async () => {
    const { data, error } = await supabase
      .from('documents')
      .insert({
        pharmacy_id: pharmacyId,
        title: 'Neues Dokument',
        document_type: 'word',
        content: null,
      })
      .select()
      .single()

    if (!error) {
      await fetchDocuments()
      setCurrentDoc(data)
    }
    return data
  }

  // Dokument löschen
  const deleteDocument = async (id) => {
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id)

    if (!error) {
      await fetchDocuments()
      if (currentDoc?.id === id) setCurrentDoc(null)
    }
    return !error
  }

  return {
    documents,
    currentDoc,
    isLoading,
    loadDocument,
    saveDocument,
    createDocument,
    deleteDocument,
    setCurrentDoc,
  }
}

export default useWordDocuments
