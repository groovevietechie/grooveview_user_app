"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { isMenuPage, getBusinessSlugFromPath } from "@/lib/navigation-utils"

interface BackButtonHandlerProps {
  onBack?: () => void
  children: React.ReactNode
}

export default function BackButtonHandler({ onBack, children }: BackButtonHandlerProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Handle Escape key as back button
      if (event.key === 'Escape' && onBack) {
        event.preventDefault()
        onBack()
      }
    }

    const handlePopState = (event: PopStateEvent) => {
      // Only handle if we're on a menu page and have a custom back handler
      if (isMenuPage(pathname) && onBack) {
        const currentView = searchParams.get("view")
        
        // If we're in items or services view, use the custom back handler
        if (currentView === "items" || currentView === "services") {
          event.preventDefault()
          onBack()
          return
        }
      }
    }

    // Add event listeners
    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('popstate', handlePopState)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [onBack, searchParams, pathname])

  return <>{children}</>
}