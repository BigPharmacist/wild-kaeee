import { useState, useRef, useEffect } from 'react'
import { X, Check, ArrowCounterClockwise, PencilSimpleLine } from '@phosphor-icons/react'

export function SignatureCanvas({
  theme,
  isOpen,
  onClose,
  onSave,
  uploading,
}) {
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)
  const [signerName, setSignerName] = useState('')

  // Set canvas size on mount and resize
  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current
      const container = canvas.parentElement
      canvas.width = container.offsetWidth
      canvas.height = 200

      // Set up canvas context
      const ctx = canvas.getContext('2d')
      ctx.strokeStyle = '#1E293B'
      ctx.lineWidth = 2
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
    }
  }, [isOpen])

  // Reset when closing
  useEffect(() => {
    if (!isOpen) {
      setHasSignature(false)
      setSignerName('')
    }
  }, [isOpen])

  const getCoordinates = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()

    if (e.touches && e.touches[0]) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      }
    }

    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  const startDrawing = (e) => {
    e.preventDefault()
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const { x, y } = getCoordinates(e)

    ctx.beginPath()
    ctx.moveTo(x, y)
    setIsDrawing(true)
  }

  const draw = (e) => {
    if (!isDrawing) return
    e.preventDefault()

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const { x, y } = getCoordinates(e)

    ctx.lineTo(x, y)
    ctx.stroke()
    setHasSignature(true)
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
  }

  const handleSave = async () => {
    if (!hasSignature) return

    const canvas = canvasRef.current
    const dataUrl = canvas.toDataURL('image/png')

    await onSave(dataUrl, signerName || null)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className={`relative ${theme.surface} w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <PencilSimpleLine size={20} className="text-purple-600" />
            </div>
            <h2 className={`text-lg font-semibold ${theme.textPrimary}`}>
              Unterschrift
            </h2>
          </div>
          <button onClick={onClose} className={`p-2 rounded-lg ${theme.bgHover}`}>
            <X size={20} className={theme.textMuted} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Signer Name */}
          <div>
            <label className={`block text-sm font-medium ${theme.textSecondary} mb-1.5`}>
              Name des Empfängers (optional)
            </label>
            <input
              type="text"
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              placeholder="z.B. Max Mustermann"
              className={`w-full px-4 py-2.5 rounded-lg border ${theme.input}`}
            />
          </div>

          {/* Canvas Container */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={`text-sm font-medium ${theme.textSecondary}`}>
                Bitte hier unterschreiben
              </label>
              <button
                onClick={clearCanvas}
                className={`inline-flex items-center gap-1 text-sm ${theme.textMuted} hover:text-red-600`}
              >
                <ArrowCounterClockwise size={14} />
                Löschen
              </button>
            </div>
            <div className="border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-white">
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full touch-none cursor-crosshair"
                style={{ touchAction: 'none' }}
              />
            </div>
            <p className={`mt-1 text-xs text-center ${theme.textMuted}`}>
              Mit dem Finger oder Stift unterschreiben
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className={`flex-1 px-4 py-3 rounded-lg ${theme.textSecondary} hover:bg-gray-100`}
          >
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            disabled={!hasSignature || uploading}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-purple-500 text-white font-medium disabled:opacity-50"
          >
            {uploading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            ) : (
              <>
                <Check size={20} weight="bold" />
                Speichern
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
