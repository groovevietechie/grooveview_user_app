"use client"

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getParentRoute, getBusinessSlugFromPath, isRootPage } from '@/lib/navigation-utils'

/**
 * Component to handle mobile device back button behavior
 */
export default function MobileBackHandler() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Add a history entry when the component mounts
    // This ensures there's always a history entry to go back to
    if (typeof window !== 'undefined' && window.history.length === 1) {
      window.history.pushState(null, '', window.location.href)
    }

    const handlePopState = (event: PopStateEvent) => {
      event.preventDefault()
      
      // At home page, allow default behavior (app close)
      if (isRootPage(pathname)) {
        return
      }

      // Use navigation utilities to determine where to go
      const businessSlug = getBusinessSlugFromPath(pathname)
      const parentRoute = getParentRoute(pathname, businessSlug || undefined)
      
      router.push(parentRoute)

      // Push a new state to maintain the back button functionality
      window.history.pushState(null, '', window.location.href)
    }

    // Listen for popstate events (back button)
    window.addEventListener('popstate', handlePopState)

    // Push initial state
    window.history.pushState(null, '', window.location.href)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [pathname, router])

  return null
}