import { useState, useRef, useCallback } from 'react'
import { CHAT_CONSTANTS } from '../api'

const { ALLOWED_FILE_TYPES, MAX_FILE_SIZE } = CHAT_CONSTANTS

/**
 * Hook für Chat-Input State Management
 * Verwaltet Text-Input, Datei-Auswahl und Bearbeitung
 */
export function useChatInput() {
  const [chatInput, setChatInput] = useState('')
  const [pendingFile, setPendingFile] = useState(null)
  const [editingMessageId, setEditingMessageId] = useState(null)
  const [fileError, setFileError] = useState('')
  const chatEndRef = useRef(null)

  // Select file for attachment
  const selectFile = useCallback((file) => {
    if (!file) {
      setPendingFile(null)
      setFileError('')
      return
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setFileError('Nur Bilder (JPG, PNG, GIF, WebP) und PDFs sind erlaubt.')
      return
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setFileError('Die Datei ist zu groß. Maximale Größe: 25MB.')
      return
    }

    setFileError('')
    setPendingFile(file)
  }, [])

  // Clear file
  const clearFile = useCallback(() => {
    setPendingFile(null)
    setFileError('')
  }, [])

  // Reset input state
  const resetInput = useCallback(() => {
    setChatInput('')
    setPendingFile(null)
    setEditingMessageId(null)
    setFileError('')
  }, [])

  // Start editing a message
  const startEditing = useCallback((messageId, currentText) => {
    setEditingMessageId(messageId)
    setChatInput(currentText || '')
  }, [])

  // Cancel editing
  const cancelEditing = useCallback(() => {
    setEditingMessageId(null)
    setChatInput('')
  }, [])

  // Scroll to bottom
  const scrollToBottom = useCallback((behavior = 'smooth') => {
    chatEndRef.current?.scrollIntoView({ behavior })
  }, [])

  return {
    // State
    chatInput,
    pendingFile,
    editingMessageId,
    fileError,
    chatEndRef,

    // Setters
    setChatInput,
    setPendingFile,
    setEditingMessageId,

    // Actions
    selectFile,
    clearFile,
    resetInput,
    startEditing,
    cancelEditing,
    scrollToBottom,
  }
}
