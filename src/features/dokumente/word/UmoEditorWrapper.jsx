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
    let initialContent = ''
    if (content !== undefined && content !== null) {
      if (typeof content === 'string') {
        try {
          initialContent = JSON.parse(content)
        } catch (e) {
          initialContent = content
        }
      } else {
        initialContent = content
      }
    }

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

      const toolbar = containerRef.current?.querySelector('.umo-toolbar')
      const editorSurface = containerRef.current?.querySelector('.ProseMirror')
      const isToolbarButton = (target) => {
        if (!target) return false
        if (target.closest('input, textarea, select, [contenteditable="true"]')) return false
        return !!target.closest('button, [role="button"], .t-button, .umo-toolbar-actions-button')
      }
      const handleToolbarMouseDown = (event) => {
        if (isToolbarButton(event.target)) {
          event.preventDefault()
        }
      }
      const handleToolbarClick = (event) => {
        if (isToolbarButton(event.target)) {
          editorSurface?.focus()
        }
      }
      if (toolbar) {
        toolbar.addEventListener('mousedown', handleToolbarMouseDown)
        toolbar.addEventListener('click', handleToolbarClick)
      }
      const cleanupToolbarHandlers = () => {
        if (toolbar) {
          toolbar.removeEventListener('mousedown', handleToolbarMouseDown)
          toolbar.removeEventListener('click', handleToolbarClick)
        }
      }
      appRef.current.__umoCleanup = cleanupToolbarHandlers
    }, 100)

    return () => {
      clearTimeout(timeoutId)
      if (appRef.current?.__umoCleanup) {
        appRef.current.__umoCleanup()
        delete appRef.current.__umoCleanup
      }
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
