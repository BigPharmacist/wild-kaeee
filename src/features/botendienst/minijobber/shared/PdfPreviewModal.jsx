import { useState, useEffect } from 'react'
import { X, DownloadSimple } from '@phosphor-icons/react'

export function PdfPreviewModal({ theme, blob, fileName, onClose }) {
  const [url, setUrl] = useState(null)

  useEffect(() => {
    if (!blob) return
    const objectUrl = URL.createObjectURL(blob)
    setUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [blob])

  const handleDownload = () => {
    if (!url) return
    const a = document.createElement('a')
    a.href = url
    a.download = fileName || 'dokument.pdf'
    a.click()
  }

  if (!blob) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative ${theme.surface} rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 shrink-0">
          <h2 className={`text-sm font-semibold ${theme.textPrimary} truncate`}>{fileName}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-[#F59E0B] hover:bg-[#D97706]"
            >
              <DownloadSimple size={14} weight="bold" />
              Herunterladen
            </button>
            <button onClick={onClose} className={`p-1.5 rounded-lg ${theme.textSecondary} hover:bg-gray-100`}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 min-h-0 bg-gray-100 rounded-b-2xl overflow-hidden">
          {url ? (
            <iframe
              src={url}
              className="w-full h-full border-0"
              title="PDF Vorschau"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F59E0B]" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
