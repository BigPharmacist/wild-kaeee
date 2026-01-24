import { useState, useRef } from 'react'
import { X, Camera, FileArrowUp, Trash, CheckCircle, Image, File } from '@phosphor-icons/react'
import { supabase } from '../../lib/supabase'

const TaskCompleteModal = ({
  task,
  currentStaff,
  onConfirm,
  onCancel,
}) => {
  const [note, setNote] = useState('')
  const [attachments, setAttachments] = useState([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)

  if (!task) return null

  // Handle file selection (from file picker or camera)
  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    setUploading(true)
    setError('')

    for (const file of files) {
      try {
        // Generate unique filename
        const ext = file.name.split('.').pop()
        const fileName = `${task.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('task-attachments')
          .upload(fileName, file)

        if (uploadError) throw uploadError

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('task-attachments')
          .getPublicUrl(fileName)

        // Add to local state
        setAttachments(prev => [...prev, {
          file_url: publicUrl,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          storage_path: fileName,
        }])
      } catch (err) {
        setError(`Fehler beim Hochladen: ${err.message}`)
      }
    }

    setUploading(false)
    // Reset input
    e.target.value = ''
  }

  // Remove attachment
  const removeAttachment = async (index) => {
    const attachment = attachments[index]

    // Delete from storage
    if (attachment.storage_path) {
      await supabase.storage
        .from('task-attachments')
        .remove([attachment.storage_path])
    }

    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  // Confirm completion
  const handleConfirm = async () => {
    if (!note.trim()) {
      setError('Bitte eine Bemerkung eingeben')
      return
    }

    setUploading(true)
    setError('')

    try {
      // Save attachments to database
      if (attachments.length > 0) {
        const attachmentRecords = attachments.map(att => ({
          task_id: task.id,
          file_url: att.file_url,
          file_name: att.file_name,
          file_type: att.file_type,
          file_size: att.file_size,
          uploaded_by: currentStaff?.id,
        }))

        const { error: dbError } = await supabase
          .from('task_attachments')
          .insert(attachmentRecords)

        if (dbError) throw dbError
      }

      // Call the confirm callback with note
      await onConfirm(note.trim())
    } catch (err) {
      setError(`Fehler: ${err.message}`)
      setUploading(false)
    }
  }

  // Format file size
  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // Check if file is image
  const isImage = (type) => type?.startsWith('image/')

  return (
    <div
      className="fixed inset-0 z-50 bg-[#2d2d2d]/40 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-[0.65em] shadow-xl w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-[#ebebeb] flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[#5a5a5a]">Aufgabe abschließen</h3>
          <button
            type="button"
            onClick={onCancel}
            className="p-1 rounded hover:bg-[#f0f0f0] text-[#ccc] hover:text-[#5a5a5a]"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Task info */}
          <div className="bg-[#f0f0f0] rounded-[0.65em] p-3">
            <p className="text-sm text-[#5a5a5a]">{task.text}</p>
            {task.project && (
              <span className="inline-block mt-2 px-2 py-0.5 bg-[#f1d6f1] text-[#6f266f] text-xs rounded-[0.65em]">
                +{task.project}
              </span>
            )}
          </div>

          {/* Note input (required) */}
          <div>
            <label className="block text-xs text-[#ccc] uppercase tracking-wide mb-1">
              Bemerkung <span className="text-[#ff0000]">*</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Was wurde gemacht? Kurze Beschreibung..."
              rows={3}
              className="w-full px-3 py-2 bg-[#f0f0f0] rounded-[0.65em] text-sm text-[#5a5a5a] placeholder:text-[#ccc] border-0 outline-none focus:ring-2 focus:ring-[#1976d2] resize-none"
            />
          </div>

          {/* Upload buttons */}
          <div className="flex gap-2">
            {/* Camera button */}
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              disabled={uploading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#1976d2] text-white rounded-[0.65em] hover:bg-[#1565c0] transition-colors disabled:opacity-50"
            >
              <Camera size={20} weight="bold" />
              <span>Foto aufnehmen</span>
            </button>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* File upload button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#f0f0f0] text-[#5a5a5a] rounded-[0.65em] hover:bg-[#ebebeb] transition-colors disabled:opacity-50"
            >
              <FileArrowUp size={20} weight="bold" />
              <span>Datei hochladen</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Uploading indicator */}
          {uploading && (
            <div className="text-center text-sm text-[#5a5a5a]">
              Wird hochgeladen...
            </div>
          )}

          {/* Attachments list */}
          {attachments.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-[#ccc] uppercase tracking-wide">Anhänge ({attachments.length})</p>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {attachments.map((att, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-2 bg-[#f0f0f0] rounded-[0.65em]"
                  >
                    {/* Thumbnail or icon */}
                    {isImage(att.file_type) ? (
                      <img
                        src={att.file_url}
                        alt={att.file_name}
                        className="w-10 h-10 object-cover rounded"
                      />
                    ) : (
                      <div className="w-10 h-10 flex items-center justify-center bg-[#ebebeb] rounded">
                        <File size={20} className="text-[#5a5a5a]" />
                      </div>
                    )}

                    {/* File info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#5a5a5a] truncate">{att.file_name}</p>
                      <p className="text-xs text-[#ccc]">{formatSize(att.file_size)}</p>
                    </div>

                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="p-1.5 rounded hover:bg-[#ff0000]/10 text-[#ccc] hover:text-[#ff0000]"
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="bg-[#ff0000]/10 border border-[#ff0000]/20 rounded-[0.65em] px-3 py-2">
              <p className="text-[#ff0000] text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex border-t border-[#ebebeb]">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-3 text-sm font-medium text-[#5a5a5a] hover:bg-[#f0f0f0] transition-colors"
          >
            Abbrechen
          </button>
          <div className="w-px bg-[#ebebeb]" />
          <button
            type="button"
            onClick={handleConfirm}
            disabled={uploading || !note.trim()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-[#1976d2] hover:bg-[#f0f0f0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle size={18} weight="bold" />
            <span>Erledigt</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default TaskCompleteModal
