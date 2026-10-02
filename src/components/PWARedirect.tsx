"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"

export const PWA_LAUNCH_PATH = "/b/groovevie-serviced-lounge?tab=a03564a6-344e-471e-86c6-1581ba9ff929"

export default function PWARedirect() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Check if app is running in standalone mode (PWA installed)
    const browserNavigator = window.navigator as Navigator & { standalone?: boolean }
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      browserNavigator.standalone === true

    // If PWA is running and user is on home page, redirect to menu
    if (isStandalone && pathname === "/") {
      console.log("[PWA] Standalone app detected on root, redirecting to menu page")
      router.replace(PWA_LAUNCH_PATH)
    }
  }, [pathname, router])

  return null
}

