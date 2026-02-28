import { useState, useRef, useEffect } from 'react'
import { CircleNotch } from '@phosphor-icons/react'

export function TokenSignatureModal({ driverName, onClose, onSave, loading }) {
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)
  const [signerName, setSignerName] = useState('')

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.strokeStyle = '#1E293B'
      ctx.lineWidth = 2
      ctx.lineCap = 'round'
    }
  }, [])

  const getPosition = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
    }
  }

  const startDrawing = (e) => {
    e.preventDefault()
    setIsDrawing(true)
    const pos = getPosition(e)
    const ctx = canvasRef.current.getContext('2d')
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
  }

  const draw = (e) => {
    if (!isDrawing) return
    e.preventDefault()
    const pos = getPosition(e)
    const ctx = canvasRef.current.getContext('2d')
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    setHasSignature(true)
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
  }

  const saveSignature = () => {
    const dataUrl = canvasRef.current.toDataURL('image/png')
    onSave(dataUrl, signerName || driverName)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Unterschrift</h3>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name des Empfängers
          </label>
          <input
            type="text"
            value={signerName}
            onChange={(e) => setSignerName(e.target.value)}
            placeholder="Name eingeben..."
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-red-500 focus:ring-1 focus:ring-red-500"
          />
        </div>

        <div className="border-2 border-gray-300 rounded-lg overflow-hidden mb-4">
          <canvas
            ref={canvasRef}
            width={400}
            height={200}
            className="w-full touch-none"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={clearSignature}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Löschen
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Abbrechen
          </button>
          <button
            onClick={saveSignature}
            disabled={!hasSignature || loading}
            className={`flex-1 px-4 py-2 rounded-lg font-medium text-white ${
              !hasSignature || loading
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {loading ? <CircleNotch size={20} className="animate-spin mx-auto" /> : 'Speichern'}
          </button>
        </div>
      </div>
    </div>
  )
}
