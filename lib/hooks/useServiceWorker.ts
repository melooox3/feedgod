'use client'

import { useEffect, useState, useCallback } from 'react'

interface ServiceWorkerState {
  isSupported: boolean
  isRegistered: boolean
  isOnline: boolean
  updateAvailable: boolean
  registration: ServiceWorkerRegistration | null
}

export function useServiceWorker() {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: false,
    isRegistered: false,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    updateAvailable: false,
    registration: null,
  })

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => setState(prev => ({ ...prev, isOnline: true }))
    const handleOffline = () => setState(prev => ({ ...prev, isOnline: false }))

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Register service worker
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return
    }

    setState(prev => ({ ...prev, isSupported: true }))

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js')

        setState(prev => ({
          ...prev,
          isRegistered: true,
          registration,
        }))

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing

          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setState(prev => ({ ...prev, updateAvailable: true }))
              }
            })
          }
        })
      } catch (error) {
        console.error('Service worker registration failed:', error)
      }
    }

    registerSW()
  }, [])

  // Update service worker
  const update = useCallback(() => {
    if (state.registration?.waiting) {
      state.registration.waiting.postMessage('skipWaiting')
      window.location.reload()
    }
  }, [state.registration])

  return {
    ...state,
    update,
  }
}

export default useServiceWorker
