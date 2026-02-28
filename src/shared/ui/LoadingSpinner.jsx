import { CircleNotch } from '@phosphor-icons/react'

/**
 * Loading-Spinner für Suspense-Fallbacks beim Lazy Loading
 */
export default function LoadingSpinner({ message = 'Lädt...' }) {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[200px]">
      <div className="text-center">
        <CircleNotch
          size={32}
          className="animate-spin text-[#DC2626] mx-auto mb-3"
        />
        <p className="text-sm text-[#64748B]">{message}</p>
      </div>
    </div>
  )
}
