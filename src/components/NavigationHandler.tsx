"use client"

import { useEffect } from 'react'
import { useGlobalNavigation } from '@/hooks/useGlobalNavigation'
import { getBusinessSlugFromPath } from '@/lib/navigation-utils'

/**
 * Global navigation handler for browser back button and device back button
 */
export default function NavigationHandler() {
  const { handleDeviceBack, currentPath, navigateTo } = useGlobalNavigation()

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // Extract business slug from current path
      const pathSegments = currentPath.split('/')
      const businessSlug = pathSegments[2] // /b/[slug]/...

      // For specific cases where we want custom behavior
      if (currentPath.includes('/payment') && businessSlug) {
        // Prevent going back from payment page without proper handling
        event.preventDefault()
        navigateTo(`/b/${businessSlug}/checkout`)
        return
      }
    }

    // Handle browser back button
    window.addEventListener('popstate', handlePopState)

    // Handle Android back button (if in a WebView)
    const handleAndroidBack = () => {
      const pathSegments = currentPath.split('/')
      const businessSlug = pathSegments[2]

      if (currentPath === '/' || !businessSlug) {
        // At home page, let the app close
        return false
      }

      // Use the global navigation handler
      return handleDeviceBack()
    }

    // Expose Android back handler to global scope
    if (typeof window !== 'undefined') {
      (window as any).handleAndroidBack = handleAndroidBack
    }

    // Cleanup
    return () => {
      window.removeEventListener('popstate', handlePopState)
      if (typeof window !== 'undefined') {
        delete (window as any).handleAndroidBack
      }
    }
  }, [currentPath, handleDeviceBack, navigateTo])

  // This component doesn't render anything
  return null
}