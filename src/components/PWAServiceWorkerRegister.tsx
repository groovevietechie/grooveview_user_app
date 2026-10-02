"use client"

import { useEffect } from "react"

export default function PWAServiceWorkerRegister() {
  useEffect(() => {
    // Register service worker for PWA functionality
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((registration) => {
          console.log("[PWA] Service Worker registered successfully:", registration)
          
          // Listen for controller change (SW update)
          navigator.serviceWorker.addEventListener("controllerchange", () => {
            console.log("[PWA] Service Worker controller changed - app updated")
          })
          
          // Check for updates periodically (every 6 hours)
          const updateInterval = setInterval(() => {
            registration.update().catch((error) => {
              console.error("[PWA] Error checking for SW updates:", error)
            })
          }, 6 * 60 * 60 * 1000)
          
          // Return cleanup function
          return () => clearInterval(updateInterval)
        })
        .catch((error) => {
          console.error("[PWA] Service Worker registration failed:", error)
        })
    } else {
      console.warn("[PWA] Service Workers are not supported in this browser")
    }
  }, [])

  return null
}
