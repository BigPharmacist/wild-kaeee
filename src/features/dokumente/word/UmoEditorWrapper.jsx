import { memo, useRef, useEffect } from 'react'
import { createApp, h } from 'vue'
import { UmoEditor } from '@umoteam/editor'
import '@umoteam/editor/style'
import './wordEditor.css'

const UmoEditorWrapper = memo(({
  documentId,
  content,
  onSave,
  isDarkMode
}) => {
  const containerRef = useRef(null)
  const appRef = useRef(null)
  const currentDocIdRef = useRef(null)
  const onSaveRef = useRef(onSave)

  // Keep callback ref updated
  onSaveRef.current = onSave

  useEffect(() => {
    if (!containerRef.current) return

    // If same document, don't remount
    if (currentDocIdRef.current === documentId && appRef.current) {
      return
    }

    // Cleanup previous app
    if (appRef.current) {
      try {
        appRef.current.unmount()
      } catch (e) {
        // Ignore
      }
      appRef.current = null
    }

    currentDocIdRef.current = documentId
    const initialContent = typeof content === 'string' ? content : ''

    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      if (!containerRef.current) return

      const app = createApp({
        methods: {
          async handleSave(editorContent) {
            if (onSaveRef.current) {
              await onSaveRef.current(editorContent.json)
            }
          }
        },
        mounted() {
          // Add click handler to page content area only
          this.$nextTick(() => {
            const pageContent = this.$el?.querySelector('.ProseMirror')
            if (pageContent) {
              pageContent.addEventListener('mousedown', (e) => {
                e.stopPropagation()
              })
            }
          })
        },
        render() {
          return h(UmoEditor, {
            height: '100%',
            locale: 'en-US',
            theme: isDarkMode ? 'dark' : 'light',
            toolbar: { defaultMode: 'ribbon' },
            document: { content: initialContent, autofocus: 'start' },
            onSave: this.handleSave
          })
        }
      })

      app.mount(containerRef.current)
      appRef.current = app
    }, 100)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [documentId, content, isDarkMode])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (appRef.current) {
        try {
          appRef.current.unmount()
        } catch (e) {
          // Ignore
        }
        appRef.current = null
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="umo-editor-container h-full"
    />
  )
})

UmoEditorWrapper.displayName = 'UmoEditorWrapper'

export default UmoEditorWrapper
