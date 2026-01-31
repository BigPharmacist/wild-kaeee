import { useRef, useState, useCallback } from 'react'

/**
 * Custom hook for signature canvas functionality
 * Extracted from App.jsx to reduce its complexity
 */
export function useSignatureCanvas({ onSignatureChange }) {
  const signatureCanvasRef = useRef(null)
  const signatureCtxRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)

  const initSignatureCanvas = useCallback(() => {
    const canvas = signatureCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.strokeStyle = '#1E293B'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    signatureCtxRef.current = ctx
    // Canvas leeren
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }, [])

  const startDrawing = useCallback((e) => {
    const canvas = signatureCanvasRef.current
    const ctx = signatureCtxRef.current
    if (!canvas || !ctx) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    let x, y
    if (e.touches) {
      x = (e.touches[0].clientX - rect.left) * scaleX
      y = (e.touches[0].clientY - rect.top) * scaleY
    } else {
      x = (e.clientX - rect.left) * scaleX
      y = (e.clientY - rect.top) * scaleY
    }

    ctx.beginPath()
    ctx.moveTo(x, y)
    setIsDrawing(true)
  }, [])

  const draw = useCallback((e) => {
    if (!isDrawing) return
    const canvas = signatureCanvasRef.current
    const ctx = signatureCtxRef.current
    if (!canvas || !ctx) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    let x, y
    if (e.touches) {
      e.preventDefault()
      x = (e.touches[0].clientX - rect.left) * scaleX
      y = (e.touches[0].clientY - rect.top) * scaleY
    } else {
      x = (e.clientX - rect.left) * scaleX
      y = (e.clientY - rect.top) * scaleY
    }

    ctx.lineTo(x, y)
    ctx.stroke()
  }, [isDrawing])

  const stopDrawing = useCallback(() => {
    if (isDrawing) {
      signatureCtxRef.current?.closePath()
      setIsDrawing(false)
      // Signatur als Base64 speichern
      const canvas = signatureCanvasRef.current
      if (canvas && onSignatureChange) {
        onSignatureChange(canvas.toDataURL('image/png'))
      }
    }
  }, [isDrawing, onSignatureChange])

  const clearSignature = useCallback(() => {
    const canvas = signatureCanvasRef.current
    const ctx = signatureCtxRef.current
    if (canvas && ctx) {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      if (onSignatureChange) {
        onSignatureChange(null)
      }
    }
  }, [onSignatureChange])

  return {
    signatureCanvasRef,
    isDrawing,
    initSignatureCanvas,
    startDrawing,
    draw,
    stopDrawing,
    clearSignature,
  }
}

export default useSignatureCanvas
