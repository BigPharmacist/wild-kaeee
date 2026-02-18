import { useState, useRef, useEffect, useCallback } from 'react'
import { X, CircleNotch } from '@phosphor-icons/react'

export function TokenPhotoModal({ onClose, onCapture, loading }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const [captured, setCaptured] = useState(null)
  const [error, setError] = useState(null)

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }, [])

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })
      streamRef.current = mediaStream
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch {
      setError('Kamera konnte nicht gestartet werden')
    }
  }, [])

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [startCamera, stopCamera])

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      canvas.getContext('2d').drawImage(video, 0, 0)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
      setCaptured(dataUrl)
      stopCamera()
    }
  }

  const retake = () => {
    setCaptured(null)
    startCamera()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      <div className="w-full h-full flex flex-col">
        {/* Header */}
        <div className="bg-black/80 text-white p-4 flex items-center justify-between">
          <h3 className="font-medium">Foto aufnehmen</h3>
          <button onClick={onClose} className="p-2">
            <X size={24} />
          </button>
        </div>

        {/* Camera / Preview */}
        <div className="flex-1 relative bg-black flex items-center justify-center">
          {error ? (
            <p className="text-white text-center p-4">{error}</p>
          ) : captured ? (
            <img src={captured} alt="Aufgenommen" className="max-w-full max-h-full object-contain" />
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="max-w-full max-h-full object-contain"
            />
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Controls */}
        <div className="bg-black/80 p-4 flex justify-center gap-4">
          {captured ? (
            <>
              <button
                onClick={retake}
                className="px-6 py-3 rounded-full bg-gray-600 text-white font-medium"
              >
                Neu aufnehmen
              </button>
              <button
                onClick={() => onCapture(captured)}
                disabled={loading}
                className="px-6 py-3 rounded-full bg-green-500 text-white font-medium"
              >
                {loading ? <CircleNotch size={20} className="animate-spin" /> : 'Speichern'}
              </button>
            </>
          ) : (
            <button
              onClick={capturePhoto}
              className="w-16 h-16 rounded-full bg-white border-4 border-gray-300"
            />
          )}
        </div>
      </div>
    </div>
  )
}
