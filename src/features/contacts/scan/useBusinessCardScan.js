import { useCallback } from 'react'

export default function useBusinessCardScan({
  mistralApiKey,
  googleApiKey,
  fetchMistralApiKey,
  fetchGoogleApiKey,
  detectRotationWithAI,
  rotateImageByDegrees,
  compressImage,
  getEnhancedImage,
  checkContactDuplicates,
  openContactFormWithOcrData,
  contactsApi,
}) {
  const {
    setContactSaveMessage,
    setOcrError,
    setContactCardFile,
    setContactCardEnhancedFile,
    setContactCardEnhancedPreview,
    setContactCardPreview,
    setContactCardRotation,
    setContactCardEnhancing,
    setBusinessCardScanning,
    setBusinessCardOcrResult,
    setDuplicateCheckResult,
    setDuplicateDialogOpen,
    setContactForm,
  } = contactsApi

  const handleBusinessCardScan = useCallback(async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setBusinessCardScanning(true)
    setBusinessCardOcrResult(null)
    setDuplicateCheckResult(null)
    setContactSaveMessage('')
    setOcrError('')

    try {
      let apiKey = mistralApiKey
      if (!apiKey) {
        apiKey = await fetchMistralApiKey()
      }
      if (!apiKey) {
        throw new Error('Mistral API Key nicht gefunden')
      }

      const aiRotation = await detectRotationWithAI(file, apiKey)
      const rotatedFile = await rotateImageByDegrees(file, aiRotation)

      let googleKey = googleApiKey
      if (!googleKey) {
        googleKey = await fetchGoogleApiKey()
      }
      if (!googleKey) {
        console.warn('Google Nano Banana API Key nicht gefunden - KI-Verbesserung übersprungen')
      }
      if (googleKey) {
        setContactCardEnhancing(true)
        getEnhancedImage(rotatedFile, googleKey)
          .then(({ previewUrl, enhancedFile }) => {
            setContactCardEnhancedFile(enhancedFile)
            setContactCardEnhancedPreview(previewUrl)
            setContactCardPreview(previewUrl)
            // Neues KI-Bild muss bestätigt werden
            setContactForm((prev) => ({ ...prev, businessCardEnhancedConfirmed: false }))
          })
          .catch((error) => {
            console.warn('Nano Banana Pro Enhance fehlgeschlagen:', error)
          })
          .finally(() => {
            setContactCardEnhancing(false)
          })
      }

      const compressedFile = await compressImage(rotatedFile, 1200, 0.8)
      setContactCardFile(compressedFile)
      setContactCardPreview(URL.createObjectURL(compressedFile))
      setContactCardRotation(0)

      const base64 = await new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result.split(',')[1])
        reader.readAsDataURL(rotatedFile)
      })

      const ocrResponse = await fetch('https://api.mistral.ai/v1/ocr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'mistral-ocr-latest',
          document: {
            type: 'image_url',
            image_url: `data:image/jpeg;base64,${base64}`
          }
        }),
      })

      const ocrResult = await ocrResponse.json()
      const ocrText = ocrResult.pages?.[0]?.markdown || ''

      if (!ocrText) {
        throw new Error('OCR hat keinen Text erkannt')
      }

      const structureResponse = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'mistral-small-latest',
          messages: [{
            role: 'user',
            content: `Extrahiere aus diesem Visitenkarten-Text die Kontaktdaten als JSON. Antworte NUR mit dem JSON-Objekt, ohne Erklärung:

Text von der Visitenkarte:
${ocrText}

Erwartetes Format:
{
  "firstName": "",
  "lastName": "",
  "company": "",
  "position": "",
  "email": "",
  "phone": "",
  "mobile": "",
  "fax": "",
  "website": "",
  "street": "",
  "postalCode": "",
  "city": ""
}
Fülle nur Felder aus, die im Text eindeutig erkennbar sind. Lasse unbekannte Felder leer.`
          }],
          max_tokens: 500,
        }),
      })

      const structureResult = await structureResponse.json()
      const content = structureResult.choices?.[0]?.message?.content || ''

      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        setBusinessCardOcrResult(parsed)

        const duplicates = await checkContactDuplicates(parsed)

        if (duplicates.length > 0) {
          setDuplicateCheckResult({ checks: duplicates, ocrData: parsed })
          setDuplicateDialogOpen(true)
        } else {
          openContactFormWithOcrData(parsed)
        }
      } else {
        throw new Error('Konnte keine strukturierten Daten aus OCR-Text extrahieren')
      }
    } catch (err) {
      console.error('Visitenkarten-Scan fehlgeschlagen:', err)
      setOcrError('OCR fehlgeschlagen: ' + (err.message || 'Unbekannter Fehler'))
    } finally {
      setBusinessCardScanning(false)
      event.target.value = ''
    }
  }, [
    checkContactDuplicates,
    compressImage,
    detectRotationWithAI,
    fetchGoogleApiKey,
    fetchMistralApiKey,
    getEnhancedImage,
    googleApiKey,
    mistralApiKey,
    openContactFormWithOcrData,
    rotateImageByDegrees,
    setBusinessCardOcrResult,
    setBusinessCardScanning,
    setContactCardEnhancing,
    setContactCardEnhancedFile,
    setContactCardEnhancedPreview,
    setContactCardFile,
    setContactCardPreview,
    setContactCardRotation,
    setContactForm,
    setContactSaveMessage,
    setDuplicateCheckResult,
    setDuplicateDialogOpen,
    setOcrError,
  ])

  return {
    handleBusinessCardScan,
  }
}
