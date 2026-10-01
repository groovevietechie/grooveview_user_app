"use client"

import { useEffect } from "react"

export default function PWAServiceWorkerRegister() {
  useEffect(() => {
    // Register service worker for PWA functionality
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((registration) => {
          console.log("Service Worker registered successfully:", registration)
          
          // Check for updates periodically (every 6 hours)
          setInterval(() => {
            registration.update()
          }, 6 * 60 * 60 * 1000)
        })
        .catch((error) => {
          console.error("Service Worker registration failed:", error)
        })
    }
  }, [])

  return null
}
