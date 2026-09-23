"use client"

import Image from "next/image"
import { useRouter, usePathname } from "next/navigation"
import type { Business } from "@/types/database"
import { useBackNavigation } from "@/hooks/useBackNavigation"
import { HomeIcon, ChatBubbleOvalLeftEllipsisIcon, InformationCircleIcon, UserCircleIcon, BuildingStorefrontIcon } from "@heroicons/react/24/outline"

interface MenuHeaderProps {
  business: Business
}

export default function MenuHeader({ business }: MenuHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()

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

          <nav className="lounge-desktop-nav" aria-label="Primary navigation">
            <a className="is-active" href="#top"><HomeIcon /> Home</a>
            <a href="#lounge-menu"><BuildingStorefrontIcon /> Menu</a>
            <a href="#lounge-experience"><InformationCircleIcon /> About</a>
            <a href="#lounge-contact"><ChatBubbleOvalLeftEllipsisIcon /> Contact</a>
            <button
              type="button"
              aria-label="Link this device"
              onClick={() => window.dispatchEvent(new CustomEvent("openDeviceSync"))}
            >
              <UserCircleIcon />
            </button>
          </nav>
          </div>

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
