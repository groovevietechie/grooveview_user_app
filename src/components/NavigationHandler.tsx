"use client"

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

/**
 * Global navigation handler for browser back button and device back button
 */
export default function NavigationHandler() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // Let the default browser behavior handle most cases
      // This component mainly ensures the history state is properly managed
      
      // Extract business slug from current path
      const pathSegments = pathname.split('/')
      const businessSlug = pathSegments[2] // /b/[slug]/...

      // For specific cases where we want custom behavior
      if (pathname.includes('/payment') && businessSlug) {
        // Prevent going back from payment page without proper handling
        event.preventDefault()
        router.push(`/b/${businessSlug}/checkout`)
        return
      }
    }

    // Handle browser back button
    window.addEventListener('popstate', handlePopState)

    // Handle Android back button (if in a WebView)
    const handleAndroidBack = () => {
      const pathSegments = pathname.split('/')
      const businessSlug = pathSegments[2]

      if (pathname === '/' || !businessSlug) {
        // At home page, let the app close
        return false
      }

      // Navigate based on current page
      if (pathname.includes('/payment')) {
        router.push(`/b/${businessSlug}/checkout`)
      } else if (pathname.includes('/checkout')) {
        router.push(`/b/${businessSlug}`)
      } else if (pathname.includes('/order/')) {
        router.push(`/b/${businessSlug}`)
      } else if (pathname.includes('/orders')) {
        router.push(`/b/${businessSlug}`)
      } else if (pathname === `/b/${businessSlug}`) {
        router.push('/')
      } else {
        router.back()
      }
      
      return true // Prevent default back behavior
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
  }, [pathname, router])

  // This component doesn't render anything
  return null
}