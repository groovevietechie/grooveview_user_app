"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useCallback, useEffect } from "react"
import { isMenuPage, getBusinessSlugFromPath, getParentRoute } from "@/lib/navigation-utils"

/**
 * Global navigation hook that coordinates all navigation behavior
 * including device back button handling
 */
export function useGlobalNavigation() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  /**
   * Handle device/browser back button behavior
   */
  const handleDeviceBack = useCallback(() => {
    // Special handling for menu pages with internal navigation
    if (isMenuPage(pathname)) {
      const currentView = searchParams.get("view")
      const businessSlug = getBusinessSlugFromPath(pathname)
      
      // If we're in items or services view, go back to menus view
      if (currentView === "items" || currentView === "services") {
        const activeTab = searchParams.get("tab")
        const newUrl = activeTab ? `${pathname}?tab=${activeTab}` : pathname
        router.push(newUrl)
        return true // Handled
      }
      
      // If we're in menus view or no view specified, go to home
      if (!currentView || currentView === "menus") {
        router.push('/')
        return true // Handled
      }
    }

    // For other pages, use the standard parent route logic
    const businessSlug = getBusinessSlugFromPath(pathname)
    const parentRoute = getParentRoute(pathname, businessSlug || undefined)
    
    // If we're already at the root, let the system handle it (app close)
    if (pathname === '/' || parentRoute === pathname) {
      return false // Not handled, let system handle
    }
    
    router.push(parentRoute)
    return true // Handled
  }, [pathname, searchParams, router])

  /**
   * Navigate to a specific route with proper history management
   */
  const navigateTo = useCallback((route: string, options?: { replace?: boolean }) => {
    if (options?.replace) {
      router.replace(route)
    } else {
      router.push(route)
    }
  }, [router])

  /**
   * Check if we can go back (i.e., not at root level)
   */
  const canGoBack = useCallback(() => {
    if (pathname === '/') return false
    
    if (isMenuPage(pathname)) {
      const currentView = searchParams.get("view")
      return currentView === "items" || currentView === "services" || !currentView || currentView === "menus"
    }
    
    return true
  }, [pathname, searchParams])

  return {
    handleDeviceBack,
    navigateTo,
    canGoBack,
    currentPath: pathname,
    searchParams
  }
}