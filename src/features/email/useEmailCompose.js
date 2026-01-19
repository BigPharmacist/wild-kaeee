import { useCallback, useState } from 'react'
import { jmap } from '../../lib/jmap'

export default function useEmailCompose({ selectedMailbox, loadEmails, formatDate, signature = '' }) {
  const [showCompose, setShowCompose] = useState(false)
  const [composeMode, setComposeMode] = useState('new')
  const [originalEmail, setOriginalEmail] = useState(null) // Original-E-Mail für KI-Kontext
  const [composeData, setComposeData] = useState({
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    body: ''
  })
  const [attachments, setAttachments] = useState([]) // {file, blobId, name, type, size, uploading, error}
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')
  const [sendSuccess, setSendSuccess] = useState(false)

  const closeCompose = useCallback(() => {
    setShowCompose(false)
    setOriginalEmail(null)
    setAttachments([])
    setSendSuccess(false)
    setComposeData({ to: '', cc: '', bcc: '', subject: '', body: '' })
  }, [])

  const openCompose = useCallback((mode = 'new', replyToEmail = null) => {
    setComposeMode(mode)
    setSendError('')
    setOriginalEmail(replyToEmail) // Original-E-Mail für KI-Kontext speichern

    // Signatur formatieren (mit Abstand oben für Eingabe und grauer Trennlinie)
    const signatureBlock = signature ? `<br><br><br><hr style="border:none;border-top:1px solid #ccc;margin:8px 0">${signature}` : ''

    if (mode === 'new') {
      setComposeData({ to: '', cc: '', bcc: '', subject: '', body: signatureBlock })
    } else if (mode === 'reply' && replyToEmail) {
      const from = replyToEmail.from?.[0]
      setComposeData({
        to: from?.email || '',
        cc: '',
        bcc: '',
        subject: `Re: ${replyToEmail.subject || ''}`,
        body: `${signatureBlock}\n\n---\nAm ${formatDate(replyToEmail.receivedAt)} schrieb ${from?.name || from?.email}:\n> ${replyToEmail.preview || ''}`
      })
    } else if (mode === 'forward' && replyToEmail) {
      setComposeData({
        to: '',
        cc: '',
        bcc: '',
        subject: `Fwd: ${replyToEmail.subject || ''}`,
        body: `${signatureBlock}\n\n---\nWeitergeleitete Nachricht:\nVon: ${replyToEmail.from?.[0]?.email}\nDatum: ${formatDate(replyToEmail.receivedAt)}\nBetreff: ${replyToEmail.subject}\n\n${replyToEmail.preview || ''}`
      })
    }

    setShowCompose(true)
    setAttachments([])
  }, [formatDate, signature])

  const addAttachment = useCallback(async (file) => {
    const tempId = Date.now()
    setAttachments(prev => [...prev, {
      id: tempId,
      file,
      name: file.name,
      type: file.type,
      size: file.size,
      uploading: true,
      error: null,
      blobId: null
    }])

    try {
      const result = await jmap.uploadBlob(file)
      setAttachments(prev => prev.map(att =>
        att.id === tempId
          ? { ...att, blobId: result.blobId, uploading: false }
          : att
      ))
    } catch (err) {
      setAttachments(prev => prev.map(att =>
        att.id === tempId
          ? { ...att, uploading: false, error: err.message }
          : att
      ))
    }
  }, [])

  const removeAttachment = useCallback((id) => {
    setAttachments(prev => prev.filter(att => att.id !== id))
  }, [])

  const handleSend = useCallback(async () => {
    if (!composeData.to.trim()) {
      setSendError('Bitte Empfänger angeben')
      return
    }

    // Prüfen ob noch Anhänge hochgeladen werden
    if (attachments.some(att => att.uploading)) {
      setSendError('Bitte warten, Anhänge werden noch hochgeladen...')
      return
    }

    // Prüfen ob Anhänge Fehler haben
    if (attachments.some(att => att.error)) {
      setSendError('Einige Anhänge konnten nicht hochgeladen werden')
      return
    }

    setSending(true)
    setSendError('')

    try {
      const toAddresses = composeData.to.split(',').map(e => e.trim()).filter(Boolean)
      const ccAddresses = composeData.cc ? composeData.cc.split(',').map(e => e.trim()).filter(Boolean) : undefined
      const bccAddresses = composeData.bcc ? composeData.bcc.split(',').map(e => e.trim()).filter(Boolean) : undefined

      // Anhänge für JMAP vorbereiten
      const jmapAttachments = attachments
        .filter(att => att.blobId)
        .map(att => ({
          blobId: att.blobId,
          type: att.type,
          name: att.name,
          size: att.size
        }))

      // Plain-Text-Version erstellen (HTML-Tags entfernen, Zeilenumbrüche erhalten)
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = composeData.body
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<\/div>/gi, '\n')
        .replace(/<hr[^>]*>/gi, '\n---\n')
      const textVersion = tempDiv.textContent || tempDiv.innerText || ''

      // HTML-Version als vollständiges Dokument
      const htmlVersion = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 1.5; color: #1f2937; }
</style>
</head>
<body>
${composeData.body}
</body>
</html>`

      await jmap.sendEmail({
        to: toAddresses,
        cc: ccAddresses,
        bcc: bccAddresses,
        subject: composeData.subject,
        textBody: textVersion,
        htmlBody: htmlVersion,
        attachments: jmapAttachments.length > 0 ? jmapAttachments : undefined
      })

      // Erfolgsmeldung anzeigen (Modal schließt sich nach kurzer Verzögerung)
      setSendSuccess(true)

      if (selectedMailbox?.role === 'sent') {
        loadEmails(selectedMailbox.id)
      }
    } catch (e) {
      setSendError(e.message || 'Senden fehlgeschlagen')
    } finally {
      setSending(false)
    }
  }, [composeData, attachments, loadEmails, selectedMailbox?.id, selectedMailbox?.role])

  return {
    showCompose,
    composeMode,
    composeData,
    originalEmail,
    attachments,
    sending,
    sendError,
    sendSuccess,
    openCompose,
    closeCompose,
    handleSend,
    setComposeData,
    addAttachment,
    removeAttachment,
  }
}
