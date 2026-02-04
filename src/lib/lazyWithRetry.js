import { lazy } from 'react'

/**
 * Wrapper für lazy() mit automatischem Retry bei Chunk-Load-Fehlern
 *
 * Hilft bei:
 * - Temporären Netzwerkproblemen
 * - Cache-Problemen nach App-Updates
 *
 * @param {Function} importFn - Die Import-Funktion, z.B. () => import('./Component')
 * @param {number} retries - Anzahl der Wiederholungsversuche (default: 3)
 * @param {number} delay - Wartezeit zwischen Versuchen in ms (default: 1000)
 */
export function lazyWithRetry(importFn, retries = 3, delay = 1000) {
  return lazy(async () => {
    let lastError

    for (let i = 0; i < retries; i++) {
      try {
        return await importFn()
      } catch (error) {
        lastError = error

        // Nur bei Chunk-Fehlern retry
        const isChunkError =
          error?.name === 'ChunkLoadError' ||
          error?.message?.includes('Loading chunk') ||
          error?.message?.includes('Failed to fetch dynamically imported module') ||
          error?.message?.includes('Unable to preload CSS')

        if (!isChunkError) {
          throw error
        }

        console.warn(`Chunk-Load fehlgeschlagen, Versuch ${i + 1}/${retries}...`)

        // Warten vor dem nächsten Versuch
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    // Alle Versuche fehlgeschlagen
    throw lastError
  })
}

export default lazyWithRetry
