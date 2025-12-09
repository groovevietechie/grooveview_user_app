"use client"

import type React from "react"
import { useState, useMemo } from "react"
import Image from "next/image"
import type { Menu } from "@/types/database"
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline"
import { getContrastColor, lightenColor } from "@/lib/color-utils"

interface MenuSelectionProps {
  menus: Menu[]
  onSelectMenu: (menu: Menu) => void
  themeColor: string
}

export default function MenuSelection({ menus, onSelectMenu, themeColor }: MenuSelectionProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredMenus = useMemo(() => {
    if (!searchQuery.trim()) return menus
    const query = searchQuery.toLowerCase()
    return menus.filter(
      (menu) =>
        menu.name.toLowerCase().includes(query) || (menu.description && menu.description.toLowerCase().includes(query)),
    )
  }, [menus, searchQuery])

  const textColor = getContrastColor(themeColor)
  const bgColor = lightenColor(themeColor, 95)
  const inputBgColor = lightenColor(themeColor, 90)

  return (
    <div className="w-full space-y-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: themeColor }}>
          Select Menu
        </h1>
        <p className="text-gray-600 text-sm mt-1">Browse our available menus</p>
      </div>

      <div className="relative mb-6" style={{ backgroundColor: inputBgColor }}>
        <MagnifyingGlassIcon
          style={{ color: themeColor }}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none"
        />
        <input
          type="text"
          placeholder="Search menus..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-lg border-2 outline-none transition-colors"
          style={{
            borderColor: themeColor,
            backgroundColor: "rgba(255, 255, 255, 0.6)",
          }}
        />
      </div>

      {filteredMenus.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <MagnifyingGlassIcon className="w-8 h-8 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No menus match "{searchQuery}"</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {filteredMenus.map((menu) => (
            <button
              key={menu.id}
              onClick={() => onSelectMenu(menu)}
              className="group text-left transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={
                {
                  borderColor: themeColor,
                  "--tw-ring-color": themeColor,
                } as React.CSSProperties
              }
            >
              <div className="bg-white border-2 rounded-lg overflow-hidden">
                {menu.image_url && (
                  <div className="relative h-40 overflow-hidden" style={{ backgroundColor: bgColor }}>
                    <Image
                      src={menu.image_url || "/placeholder.svg"}
                      alt={menu.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                )}

                <div className="p-4">
                  <h3
                    className="font-bold text-lg text-gray-900 group-hover:text-opacity-90"
                    style={{ color: themeColor }}
                  >
                    {menu.name}
                  </h3>
                  {menu.description && <p className="text-gray-600 text-sm mt-2 line-clamp-2">{menu.description}</p>}
                </div>

                <div className="h-1 group-hover:h-2 transition-all" style={{ backgroundColor: themeColor }} />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
