"use client"

import { useEffect } from 'react'
import { useGlobalNavigation } from '@/hooks/useGlobalNavigation'

/**
 * Component to handle mobile device back button behavior
 */
export default function MobileBackHandler() {
  const { handleDeviceBack } = useGlobalNavigation()

  useEffect(() => {
    // Add a history entry when the component mounts
    // This ensures there's always a history entry to go back to
    if (typeof window !== 'undefined' && window.history.length === 1) {
      window.history.pushState(null, '', window.location.href)
    }

    const handlePopState = (event: PopStateEvent) => {
      event.preventDefault()
      
      // Use the global navigation handler
      const wasHandled = handleDeviceBack()
      
      if (wasHandled) {
        // Push a new state to maintain the back button functionality
        window.history.pushState(null, '', window.location.href)
      }
      // If not handled, let the system handle it (app close)
    }

    // Listen for popstate events (back button)
    window.addEventListener('popstate', handlePopState)

    // Push initial state
    window.history.pushState(null, '', window.location.href)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [handleDeviceBack])

  return null
}