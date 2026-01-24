/**
 * Image Processing Utilities
 * Funktionen für Bildverarbeitung, Rotation, Komprimierung und KI-Enhancement
 */

/**
 * Hilfsfunktion: File zu Base64 konvertieren
 */
function fileToBase64(file) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.readAsDataURL(file)
  })
}

/**
 * Hilfsfunktion: File zu DataURL konvertieren
 */
function fileToDataUrl(file) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.readAsDataURL(file)
  })
}

/**
 * Erkennt die benötigte Rotation eines Bildes mittels KI (Mistral Pixtral)
 * @param {File} file - Die Bilddatei
 * @param {string} apiKey - Mistral API Key
 * @returns {Promise<number>} - Rotation in Grad (0, 90, 180 oder 270)
 */
export async function detectRotationWithAI(file, apiKey) {
  const base64 = await fileToBase64(file)
  const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'pixtral-12b-2409',
      messages: [{
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Analysiere dieses Bild einer Visitenkarte. Um wie viel Grad im Uhrzeigersinn muss es gedreht werden, damit der Text richtig lesbar ist (horizontal, von links nach rechts)? Antworte NUR mit einer Zahl: 0, 90, 180 oder 270'
          },
          {
            type: 'image_url',
            image_url: { url: `data:image/jpeg;base64,${base64}` }
          }
        ]
      }],
      max_tokens: 10,
    }),
  })
  const result = await response.json()
  const content = result.choices?.[0]?.message?.content || '0'
  const match = content.match(/\b(0|90|180|270)\b/)
  return match ? parseInt(match[1], 10) : 0
}

/**
 * Dreht ein Bild um die angegebene Gradzahl
 * @param {File} file - Die Bilddatei
 * @param {number} degrees - Rotation in Grad (0, 90, 180, 270)
 * @returns {Promise<File>} - Das gedrehte Bild
 */
export function rotateImageByDegrees(file, degrees) {
  if (degrees === 0) return Promise.resolve(file)
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (degrees === 90 || degrees === 270) {
          canvas.width = img.height
          canvas.height = img.width
        } else {
          canvas.width = img.width
          canvas.height = img.height
        }
        ctx.translate(canvas.width / 2, canvas.height / 2)
        ctx.rotate((degrees * Math.PI) / 180)
        ctx.drawImage(img, -img.width / 2, -img.height / 2)
        canvas.toBlob((blob) => {
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }))
        }, 'image/jpeg', 0.95)
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

/**
 * Komprimiert ein Bild auf eine maximale Breite
 * @param {File} file - Die Bilddatei
 * @param {number} maxWidth - Maximale Breite in Pixel (default: 800)
 * @param {number} quality - JPEG-Qualität 0-1 (default: 0.7)
 * @returns {Promise<File>} - Das komprimierte Bild
 */
export function compressImage(file, maxWidth = 800, quality = 0.7) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob((blob) => {
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }))
        }, 'image/jpeg', quality)
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

/**
 * Verbessert ein Visitenkarten-Bild mit Google Gemini AI
 * @param {File} file - Die Bilddatei
 * @param {string} apiKey - Google API Key
 * @returns {Promise<{previewUrl: string, enhancedFile: File}>} - Verbessertes Bild
 */
export async function getEnhancedImage(file, apiKey) {
  const base64 = await fileToBase64(file)
  const response = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              inline_data: {
                mime_type: file.type || 'image/jpeg',
                data: base64
              }
            },
            {
              text: `Enhance this business card photo:
1. Crop tightly to the card edges
2. Correct perspective distortion (make edges straight and rectangular)
3. Improve sharpness and readability
4. Keep all text, logos, and colors exactly as they are
5. Output as a clean, professional-looking scan`
            }
          ]
        }],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE'],
        }
      })
    }
  )
  const result = await response.json()
  const imagePart = result.candidates?.[0]?.content?.parts?.find(p => p.inlineData)
  if (imagePart?.inlineData?.data) {
    const binaryString = atob(imagePart.inlineData.data)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    const blob = new Blob([bytes], { type: imagePart.inlineData.mimeType || 'image/png' })
    const previewUrl = URL.createObjectURL(blob)
    const enhancedFile = new File([blob], 'enhanced.png', { type: blob.type })
    return { previewUrl, enhancedFile }
  }
  throw new Error('Keine verbesserte Bilddaten in der Antwort')
}

/**
 * Liest die EXIF-Orientation aus einem JPEG (1-8)
 * @param {File} file - Die Bilddatei
 * @returns {Promise<number>} - EXIF Orientation (1-8, default 1)
 */
export function getExifOrientation(file) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const view = new DataView(e.target.result)
      if (view.getUint16(0, false) !== 0xFFD8) {
        resolve(1) // Kein JPEG
        return
      }
      let offset = 2
      while (offset < view.byteLength) {
        const marker = view.getUint16(offset, false)
        offset += 2
        if (marker === 0xFFE1) { // APP1 (EXIF)
          if (view.getUint32(offset + 2, false) !== 0x45786966) { // "Exif"
            resolve(1)
            return
          }
          const little = view.getUint16(offset + 8, false) === 0x4949
          const tags = view.getUint16(offset + 16, little)
          for (let i = 0; i < tags; i++) {
            const tagOffset = offset + 18 + i * 12
            if (view.getUint16(tagOffset, little) === 0x0112) { // Orientation tag
              resolve(view.getUint16(tagOffset + 8, little))
              return
            }
          }
          resolve(1)
          return
        } else if ((marker & 0xFF00) !== 0xFF00) {
          break
        } else {
          offset += view.getUint16(offset, false)
        }
      }
      resolve(1)
    }
    reader.readAsArrayBuffer(file.slice(0, 65536))
  })
}

/**
 * Rotiert ein Bild automatisch basierend auf EXIF-Orientation
 * @param {File} file - Die Bilddatei
 * @returns {Promise<File>} - Das korrekt orientierte Bild
 */
export async function autoRotateImage(file) {
  const orientation = await getExifOrientation(file)
  if (orientation === 1) return file // Keine Drehung nötig

  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        // Canvas-Größe basierend auf Orientation
        if (orientation >= 5 && orientation <= 8) {
          canvas.width = img.height
          canvas.height = img.width
        } else {
          canvas.width = img.width
          canvas.height = img.height
        }

        // Transformation basierend auf Orientation
        switch (orientation) {
          case 2: ctx.transform(-1, 0, 0, 1, canvas.width, 0); break // Horizontal flip
          case 3: ctx.transform(-1, 0, 0, -1, canvas.width, canvas.height); break // 180°
          case 4: ctx.transform(1, 0, 0, -1, 0, canvas.height); break // Vertical flip
          case 5: ctx.transform(0, 1, 1, 0, 0, 0); break // 90° CW + flip
          case 6: ctx.transform(0, 1, -1, 0, canvas.width, 0); break // 90° CW
          case 7: ctx.transform(0, -1, -1, 0, canvas.width, canvas.height); break // 90° CCW + flip
          case 8: ctx.transform(0, -1, 1, 0, 0, canvas.height); break // 90° CCW
          default: break
        }

        ctx.drawImage(img, 0, 0)
        canvas.toBlob((blob) => {
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }))
        }, 'image/jpeg', 0.95)
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

/**
 * Dreht ein Bild um die angegebene Gradzahl (alternative Implementierung)
 * @param {File} file - Die Bilddatei
 * @param {number} degrees - Rotation in Grad
 * @returns {Promise<File>} - Das gedrehte Bild
 */
export function rotateImage(file, degrees) {
  return new Promise((resolve) => {
    if (degrees === 0) {
      resolve(file)
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const isRotated90or270 = degrees === 90 || degrees === 270
        canvas.width = isRotated90or270 ? img.height : img.width
        canvas.height = isRotated90or270 ? img.width : img.height
        const ctx = canvas.getContext('2d')
        ctx.translate(canvas.width / 2, canvas.height / 2)
        ctx.rotate((degrees * Math.PI) / 180)
        ctx.drawImage(img, -img.width / 2, -img.height / 2)
        canvas.toBlob((blob) => {
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }))
        }, 'image/jpeg', 0.9)
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}
