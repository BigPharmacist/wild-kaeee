export const formatEmailDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()

  if (isToday) {
    return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  }
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

export const getEmailBodyHtml = (email) => {
  if (!email) return ''

  if (email.htmlBody?.length > 0) {
    const partId = email.htmlBody[0].partId
    return email.bodyValues?.[partId]?.value || ''
  }
  if (email.textBody?.length > 0) {
    const partId = email.textBody[0].partId
    const text = email.bodyValues?.[partId]?.value || ''
    return text.replace(/\n/g, '<br>')
  }
  return email.preview || ''
}
