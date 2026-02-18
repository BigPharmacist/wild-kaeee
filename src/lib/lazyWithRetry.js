import { lazy } from 'react'

const RELOAD_KEY = 'chunk-reload-attempted'

/**
 * Prüft ob ein Fehler ein Chunk-Load-Fehler ist (lazy import fehlgeschlagen)
 */
export function isChunkError(error) {
  return (
    error?.name === 'ChunkLoadError' ||
    error?.message?.includes('Loading chunk') ||
    error?.message?.includes('Failed to fetch dynamically imported module') ||
    error?.message?.includes('Unable to preload CSS') ||
    error?.message?.includes('is not a valid JavaScript MIME type')
  )
}

/**
 * Wrapper für lazy() mit automatischem Retry bei Chunk-Load-Fehlern
 *
 * Strategie:
 * 1. Bis zu 3 Retry-Versuche mit Cache-Busting
 * 2. Falls alle fehlschlagen: automatischer Page-Reload (einmalig)
 * 3. Falls auch Reload nicht hilft: Fehler wird an ErrorBoundary weitergegeben
 *
 * @param {Function} importFn - Die Import-Funktion, z.B. () => import('./Component')
 * @param {number} retries - Anzahl der Wiederholungsversuche (default: 3)
 * @param {number} delay - Wartezeit zwischen Versuchen in ms (default: 1000)
 */
export function lazyWithRetry(importFn, retries = 3, delay = 1000) {
  return lazy(async () => {
    // Prüfen ob wir bereits nach einem Reload sind — wenn ja, nicht nochmal reloaden
    const hasReloaded = sessionStorage.getItem(RELOAD_KEY)

    let lastError

    for (let i = 0; i < retries; i++) {
      try {
        const module = await importFn()
        // Erfolg → Reload-Flag zurücksetzen
        sessionStorage.removeItem(RELOAD_KEY)
        return module
      } catch (error) {
        lastError = error

        if (!isChunkError(error)) {
          throw error
        }

        console.warn(`Chunk-Load fehlgeschlagen, Versuch ${i + 1}/${retries}...`)

        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    // Alle Retries fehlgeschlagen → automatischer Reload (einmalig)
    if (!hasReloaded) {
      console.warn('Alle Chunk-Load-Versuche fehlgeschlagen, lade Seite neu...')
      sessionStorage.setItem(RELOAD_KEY, 'true')

      if ('caches' in window) {
        const names = await caches.keys()
        await Promise.all(names.map(name => caches.delete(name)))
      }

      window.location.reload()
      // Nie erreicht, aber TypeScript/React braucht einen Return
      return { default: () => null }
    }

    // Auch nach Reload fehlgeschlagen → Fehler an ErrorBoundary weitergeben
    sessionStorage.removeItem(RELOAD_KEY)
    throw lastError
  })
}

export default lazyWithRetry
