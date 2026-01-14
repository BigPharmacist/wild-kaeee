import { useCallback, useState } from 'react'
import { jmap } from '../../lib/jmap'

export default function useEmailAttachments() {
  const [downloadingAttachmentId, setDownloadingAttachmentId] = useState(null)

  const downloadAttachment = useCallback(async (attachment) => {
    if (!attachment?.blobId) return
    setDownloadingAttachmentId(attachment.blobId)
    try {
      await jmap.downloadAttachment(attachment.blobId, attachment.name, attachment.type)
    } catch (e) {
      console.error('Download fehlgeschlagen:', e)
    } finally {
      setDownloadingAttachmentId(null)
    }
  }, [])

  return {
    downloadingAttachmentId,
    downloadAttachment,
  }
}
