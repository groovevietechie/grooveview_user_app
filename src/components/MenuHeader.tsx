"use client"

import Image from "next/image"
import { useRouter, usePathname } from "next/navigation"
import type { Business } from "@/types/database"
import { useTheme } from "@/contexts/ThemeContext"
import { getContrastColor } from "@/lib/color-utils"
import { HomeIcon } from "@heroicons/react/24/outline"

interface MenuHeaderProps {
  business: Business
}

export default function MenuHeader({ business }: MenuHeaderProps) {
  const { primaryColor } = useTheme()
  const router = useRouter()
  const pathname = usePathname()
  const textColor = getContrastColor(primaryColor)

  const isMenuPage = pathname === `/b/${business.slug}`
  const showHomeButton = !isMenuPage

  return (
    <header style={{ backgroundColor: primaryColor }} className="shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center gap-4">
          {/* Business Logo */}
          {business.logo_url ? (
            <Image
              src={business.logo_url || "/placeholder.svg"}
              alt={business.name}
              width={48}
              height={48}
              className="rounded-lg object-cover"
            />
          ) : (
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <span style={{ color: textColor }} className="text-xl font-bold">
                {business.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          {/* Business Info */}
          <div className="flex-1">
            <h1 style={{ color: textColor }} className="text-2xl font-bold">
              {business.name}
            </h1>
            {business.address && (
              <p style={{ color: textColor, opacity: 0.9 }} className="text-sm">
                {business.address}
              </p>
            )}
          </div>

          {showHomeButton && (
            <button
              onClick={() => router.push(`/b/${business.slug}`)}
              style={{ color: textColor }}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
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
