'use client'

import { WifiOff, RefreshCw } from 'lucide-react'
import { useServiceWorker } from '@/lib/hooks/useServiceWorker'

export function OfflineIndicator() {
  const { isOnline, updateAvailable, update } = useServiceWorker()

  // Show nothing if online and no update available
  if (isOnline && !updateAvailable) return null

  return (
    <>
      {/* Offline indicator */}
      {!isOnline && (
        <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-500/20 border border-amber-200 dark:border-amber-500/30 rounded-lg shadow-lg">
            <WifiOff className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                You&apos;re offline
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Some features may be unavailable
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Update available indicator */}
      {updateAvailable && (
        <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 dark:bg-blue-500/20 border border-blue-200 dark:border-blue-500/30 rounded-lg shadow-lg">
            <RefreshCw className="w-5 h-5 text-blue-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                Update available
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                A new version is ready
              </p>
            </div>
            <button
              onClick={update}
              className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 rounded text-white text-sm font-medium transition-colors"
            >
              Update
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default OfflineIndicator
