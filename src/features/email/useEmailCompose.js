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
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')

  const closeCompose = useCallback(() => {
    setShowCompose(false)
    setOriginalEmail(null)
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
  }, [formatDate, signature])

  const handleSend = useCallback(async () => {
    if (!composeData.to.trim()) {
      setSendError('Bitte Empfänger angeben')
      return
    }

    setSending(true)
    setSendError('')

    try {
      const toAddresses = composeData.to.split(',').map(e => e.trim()).filter(Boolean)
      const ccAddresses = composeData.cc ? composeData.cc.split(',').map(e => e.trim()).filter(Boolean) : undefined
      const bccAddresses = composeData.bcc ? composeData.bcc.split(',').map(e => e.trim()).filter(Boolean) : undefined

      await jmap.sendEmail({
        to: toAddresses,
        cc: ccAddresses,
        bcc: bccAddresses,
        subject: composeData.subject,
        textBody: composeData.body
      })

      setShowCompose(false)
      setComposeData({ to: '', cc: '', bcc: '', subject: '', body: '' })

      if (selectedMailbox?.role === 'sent') {
        loadEmails(selectedMailbox.id)
      }
    } catch (e) {
      setSendError(e.message || 'Senden fehlgeschlagen')
    } finally {
      setSending(false)
    }
  }, [composeData, loadEmails, selectedMailbox?.id, selectedMailbox?.role])

  return {
    showCompose,
    composeMode,
    composeData,
    originalEmail,
    sending,
    sendError,
    openCompose,
    closeCompose,
    handleSend,
    setComposeData,
  }
}
