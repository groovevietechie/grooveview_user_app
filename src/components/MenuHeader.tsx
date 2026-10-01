"use client"

import Image from "next/image"
import { useRouter, usePathname } from "next/navigation"
import type { Business } from "@/types/database"
import { useBackNavigation } from "@/hooks/useBackNavigation"
import { HomeIcon, UserCircleIcon } from "@heroicons/react/24/outline"
import { useState, useEffect } from "react"

interface MenuHeaderProps {
  business: Business
  onOpenSpinWheel?: () => void
}

export default function MenuHeader({ business, onOpenSpinWheel }: MenuHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [hasNewRewardTokens, setHasNewRewardTokens] = useState(false)

  // Use the back navigation hook for the menu page
  useBackNavigation({
    fallbackRoute: '/'
  })

  const isMenuPage = pathname === `/b/${business.slug}` || pathname?.endsWith(`/b/${business.slug}`)
  const showHomeButton = !isMenuPage

  // Split business name into parts (assuming first word is main name, rest is subtitle)
  const nameParts = business.name.split(' ')
  const mainName = nameParts[0] || business.name
  const subtitle = nameParts.slice(1).join(' ')

  // Listen for reward token notifications
  useEffect(() => {
    const handleRewardClaimed = () => {
      setHasNewRewardTokens(true)
    }

    const handleDeviceSyncClosed = () => {
      // Clear the notification when device sync modal is closed
      setHasNewRewardTokens(false)
    }

    window.addEventListener('rewardTokenClaimed', handleRewardClaimed)
    window.addEventListener('closeDeviceSync', handleDeviceSyncClosed)

    return () => {
      window.removeEventListener('rewardTokenClaimed', handleRewardClaimed)
      window.removeEventListener('closeDeviceSync', handleDeviceSyncClosed)
    }
  }, [])

  return (
    <header className="lounge-header sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center min-w-0 gap-3">
          {/* Business Logo */}
          {business.logo_url ? (
            <div className="flex-shrink-0">
              <Image
                src={business.logo_url}
                alt={business.name}
                width={48}
                height={48}
                className="rounded-full object-cover lounge-logo"
              />
            </div>
          ) : ( 
            <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center lounge-logo">
              <span className="text-white text-xl font-bold">
                {business.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          {/* Business Name */}
          <div className="min-w-0">
            <h1 className="text-white text-xl sm:text-2xl font-bold leading-none truncate">
              {mainName}
            </h1>
            {subtitle && (
              <h4 className="text-yellow-400 text-xs sm:text-sm font-semibold mt-1 truncate">
                {subtitle}
              </h4>
            )}
          </div>

          </div>

          <nav className="lounge-desktop-nav flex items-center gap-4" aria-label="Primary navigation">
            <a className="is-active" href="#top"><HomeIcon /> <span>Home</span></a>
            <button
              type="button"
              aria-label="Link this device"
              onClick={() => window.dispatchEvent(new CustomEvent("openDeviceSync"))}
              className="relative flex items-center justify-center hover:text-amber-300 transition-colors"
            >
              <UserCircleIcon className="w-5 h-5" />
              {/* Red blinking notification dot */}
              {hasNewRewardTokens && (
                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse border border-red-600 shadow-lg shadow-red-500/50"></span>
              )}
            </button>
            <button
              type="button"
              aria-label="Daily Spin Wheel"
              onClick={onOpenSpinWheel}
              title="Daily Spin Wheel"
              className="px-6 py-2 rounded-lg bg-amber-400 text-slate-900 font-semibold hover:bg-amber-300 transition-colors active:scale-95 text-sm flex items-center justify-center whitespace-nowrap"
            >
              Spin
            </button>
          </nav>

          {showHomeButton && (
            <button
              onClick={() => router.push(`/b/${business.slug}`)}
              className="text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Back to menu"
              aria-label="Back to menu"
            >
              <HomeIcon className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
