"use client"

import Image from "next/image"
import { useRouter, usePathname } from "next/navigation"
import type { Business } from "@/types/database"
import { HomeIcon } from "@heroicons/react/24/outline"

interface MenuHeaderProps {
  business: Business
}

export default function MenuHeader({ business }: MenuHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()

  const isMenuPage = pathname === `/b/${business.slug}` || pathname?.endsWith(`/b/${business.slug}`)
  const showHomeButton = !isMenuPage

  // Split business name into parts (assuming first word is main name, rest is subtitle)
  const nameParts = business.name.split(' ')
  const mainName = nameParts[0] || business.name
  const subtitle = nameParts.slice(1).join(' ')

  return (
    <header className="bg-black shadow-lg">
      <div className="max-w-5xl mx-auto px-2 py-4">
        <div className="flex flex-col items-center text-center">
          {/* Business Logo */}
          {business.logo_url ? (
            <div className="mb-1">
              <Image
                src={business.logo_url}
                alt={business.name}
                width={40}
                height={40}
                className="rounded-full object-cover"
              />
            </div>
          ) : ( 
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mb-1">
              <span className="text-white text-xl font-bold">
                {business.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          {/* Business Name */}
          <div className="mb-2">
            <h1 className="text-white text-2xl font-bold mb-1">
              {mainName}
            </h1>
            {subtitle && (
              <h4 className="text-yellow-400 text-sm font-semibold">
                {subtitle}
              </h4>
            )}
          </div>

          {/* Thick Yellow Divider */}
          <div className="w-full max-w-xl h-1 bg-yellow-400 mb-2"></div>

          {/* Business Address */}
          {business.address && (
            <p className="text-gray-300 text-sm">
              {business.address}
            </p>
          )}

          {/* Home Button (if not on menu page) */}
          {showHomeButton && (
            <button
              onClick={() => router.push(`/b/${business.slug}`)}
              className="mt-4 text-white p-2 hover:bg-gray-800 rounded-lg transition-colors"
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
