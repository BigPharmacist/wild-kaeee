import { useState, useRef, useEffect } from 'react'
import { X, Camera, Check, ArrowCounterClockwise, Image } from '@phosphor-icons/react'

export function PhotoCapture({
  theme,
  isOpen,
  onClose,
  onSave,
  uploading,
}) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const fileInputRef = useRef(null)
  const [stream, setStream] = useState(null)
  const [capturedImage, setCapturedImage] = useState(null)
  const [caption, setCaption] = useState('')
  const [cameraError, setCameraError] = useState(null)
  const [facingMode, setFacingMode] = useState('environment')

  // Start camera when modal opens
  useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera()
    }
    return () => {
      stopCamera()
    }
  }, [isOpen, facingMode])

  // Cleanup when closing
  useEffect(() => {
    if (!isOpen) {
      setCapturedImage(null)
      setCaption('')
      setCameraError(null)
    }
  }, [isOpen])

  const startCamera = async () => {
    try {
      setCameraError(null)
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      })

      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (err) {
      console.error('Kamera-Fehler:', err)
      if (err.name === 'NotAllowedError') {
        setCameraError('Kamerazugriff verweigert. Bitte in den Einstellungen erlauben.')
      } else if (err.name === 'NotFoundError') {
        setCameraError('Keine Kamera gefunden.')
      } else {
        setCameraError('Fehler beim Starten der Kamera.')
      }
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0)

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
    setCapturedImage(dataUrl)
    stopCamera()
  }

  const retakePhoto = () => {
    setCapturedImage(null)
    startCamera()
  }

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      setCapturedImage(event.target.result)
      stopCamera()
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    if (!capturedImage) return
    await onSave(capturedImage, caption || null)
  }

  const toggleCamera = () => {
    stopCamera()
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment')
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
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Camera size={20} className="text-blue-600" />
            </div>
            <h2 className={`text-lg font-semibold ${theme.textPrimary}`}>
              Foto aufnehmen
            </h2>
          </div>
          <button onClick={onClose} className={`p-2 rounded-lg ${theme.textSecondary} ${theme.bgHover}`}>
            <X size={20} className={theme.textMuted} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Camera/Image Preview */}
          <div className="relative aspect-[4/3] bg-black rounded-xl overflow-hidden">
            {cameraError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4">
                <Camera size={48} className="opacity-50 mb-3" />
                <p className="text-center">{cameraError}</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-4 px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30"
                >
                  Foto aus Galerie wählen
                </button>
              </div>
            ) : capturedImage ? (
              <img
                src={capturedImage}
                alt="Aufgenommenes Foto"
                className="w-full h-full object-contain"
              />
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {/* Camera controls overlay */}
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                  <button
                    onClick={toggleCamera}
                    className="p-3 rounded-full bg-white/20 hover:bg-white/30 text-white"
                    title="Kamera wechseln"
                  >
                    <ArrowCounterClockwise size={24} />
                  </button>
                  <button
                    onClick={capturePhoto}
                    className="w-16 h-16 rounded-full bg-white border-4 border-white/50 hover:scale-105 transition-transform"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 rounded-full bg-white/20 hover:bg-white/30 text-white"
                    title="Aus Galerie"
                  >
                    <Image size={24} />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Hidden canvas for capture */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Caption (only when image captured) */}
          {capturedImage && (
            <div>
              <label className={`block text-sm font-medium ${theme.textSecondary} mb-1.5`}>
                Beschreibung (optional)
              </label>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="z.B. 'Hinter Blumenkasten abgelegt'"
                className={`w-full px-4 py-2.5 rounded-lg border ${theme.input}`}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t border-gray-100">
          {capturedImage ? (
            <>
              <button
                onClick={retakePhoto}
                className={`flex-1 px-4 py-3 rounded-lg ${theme.textSecondary} hover:bg-gray-100`}
              >
                <ArrowCounterClockwise size={20} className="inline mr-2" />
                Neu aufnehmen
              </button>
              <button
                onClick={handleSave}
                disabled={uploading}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-blue-500 text-white font-medium disabled:opacity-50"
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
            </>
          ) : (
            <button
              onClick={onClose}
              className={`flex-1 px-4 py-3 rounded-lg ${theme.textSecondary} hover:bg-gray-100`}
            >
              Abbrechen
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
