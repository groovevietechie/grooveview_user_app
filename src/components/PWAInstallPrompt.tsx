"use client"

import { useState, useEffect } from "react"
import { XMarkIcon, ArrowDownTrayIcon } from "@heroicons/react/24/outline"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export default function PWAInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [userDismissed, setUserDismissed] = useState(false)

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true)
      return
    }

    // Check if user has dismissed the prompt in this session
    const sessionDismissed = sessionStorage.getItem("pwa-prompt-dismissed")
    if (sessionDismissed) {
      setUserDismissed(true)
    }

    // Prevent the mini-infobar from appearing on install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      // Always show the prompt if not dismissed in this session
      if (!userDismissed) {
        setTimeout(() => {
          setShowPrompt(true)
        }, 3000)
      }
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowPrompt(false)
      setDeferredPrompt(null)
      sessionStorage.removeItem("pwa-prompt-dismissed")
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [userDismissed])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    try {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === "accepted") {
        setDeferredPrompt(null)
        setShowPrompt(false)
      } else {
        // User dismissed the native prompt, show ours again next time
        setShowPrompt(false)
      }
    } catch (error) {
      console.error("Error installing app:", error)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    setUserDismissed(true)
    // Only dismiss for this session (cleared when user closes the app)
    sessionStorage.setItem("pwa-prompt-dismissed", "true")
  }

  // Don't show if already installed or no deferred prompt or user dismissed in this session
  if (isInstalled || !showPrompt || !deferredPrompt) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 max-w-md mx-auto">
      <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-2xl shadow-2xl border-2 border-amber-200 p-4 animate-in slide-in-from-bottom-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <ArrowDownTrayIcon className="w-6 h-6 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-amber-900 text-sm mb-1">Install GrooveVie</h3>
            <p className="text-xs text-amber-800 mb-3">
              Install the app on your device for faster access. No more scanning QR codes!
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleInstallClick}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 font-semibold rounded-lg hover:from-amber-300 hover:to-amber-400 transition-all active:scale-95 text-xs"
              >
                Install Now
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 py-2 bg-white/70 text-amber-800 rounded-lg hover:bg-white transition-all active:scale-95"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
