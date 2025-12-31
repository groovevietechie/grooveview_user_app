import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getParentRoute, getBusinessSlugFromPath } from '@/lib/navigation-utils'

interface UseBackNavigationOptions {
  fallbackRoute?: string
  onBack?: () => void
  disabled?: boolean
}

/**
 * Custom hook to handle browser back button and provide consistent navigation
 */
export function useBackNavigation(options: UseBackNavigationOptions = {}) {
  const router = useRouter()
  const pathname = usePathname()
  const { fallbackRoute, onBack, disabled = false } = options

  useEffect(() => {
    if (disabled) return

    const handlePopState = (event: PopStateEvent) => {
      // Prevent default browser back behavior
      event.preventDefault()
      
      if (onBack) {
        onBack()
      } else {
        // Default back navigation logic
        handleBackNavigation()
      }
    }

    // Add event listener for browser back button
    window.addEventListener('popstate', handlePopState)

    // Cleanup
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [pathname, onBack, disabled])

  const handleBackNavigation = () => {
    const businessSlug = getBusinessSlugFromPath(pathname)
    
    if (fallbackRoute) {
      router.push(fallbackRoute)
      return
    }

    // Use the navigation utilities to determine parent route
    const parentRoute = getParentRoute(pathname, businessSlug || undefined)
    router.push(parentRoute)
  }

  return {
    goBack: handleBackNavigation,
    canGoBack: pathname !== '/'
  }
}