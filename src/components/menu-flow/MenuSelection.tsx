"use client"

import type React from "react"
import { useState, useMemo } from "react"
import Image from "next/image"
import type { Menu } from "@/types/database"
import { MagnifyingGlassIcon, SparklesIcon } from "@heroicons/react/24/outline"
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
  const bgColor = lightenColor(themeColor, 97)
  const inputBgColor = lightenColor(themeColor, 98)

  return (
    <div className="w-full space-y-6 pb-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <SparklesIcon className="w-4 h-4" style={{ color: themeColor }} />
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Discover Our Menus</h1>
        </div>
        <p className="text-gray-500 text-base mt-2 leading-relaxed">Explore our carefully curated collections</p>
      </div>

      <div className="relative mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-gray-50 rounded-full blur-sm opacity-60"></div>
        <div className="relative">
          <MagnifyingGlassIcon
            style={{ color: themeColor }}
            className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search for a menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-14 pr-6 py-3.5 rounded-full border-2 outline-none transition-all text-sm font-medium bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md focus:shadow-lg"
            style={{
              borderColor: searchQuery ? themeColor : "#E5E7EB",
            }}
          />
        </div>
      </div>

      {filteredMenus.length === 0 ? (
        <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MagnifyingGlassIcon className="w-10 h-10 text-gray-400" />
          </div>
          <p className="text-gray-600 font-medium text-lg">No menus found</p>
          <p className="text-gray-400 text-sm mt-1">Try adjusting your search</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-5">
          {filteredMenus.map((menu) => (
            <button
              key={menu.id}
              onClick={() => onSelectMenu(menu)}
              className="group text-left transition-all duration-300 hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-offset-2 active:scale-[0.98]"
              style={
                {
                  "--tw-ring-color": `${themeColor}40`,
                } as React.CSSProperties
              }
            >
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
                {menu.image_url ? (
                  <div className="relative h-44 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50">
                    <Image
                      src={menu.image_url || "/placeholder.svg"}
                      alt={menu.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                ) : (
                  <div
                    className="h-44 flex items-center justify-center"
                    style={{ backgroundColor: lightenColor(themeColor, 95) }}
                  >
                    <SparklesIcon className="w-12 h-12 opacity-20" style={{ color: themeColor }} />
                  </div>
                )}

                <div className="p-5">
                  <h3
                    className="font-bold text-lg leading-tight mb-2 group-hover:translate-x-1 transition-transform duration-300"
                    style={{ color: themeColor }}
                  >
                    {menu.name}
                  </h3>
                  {menu.description && (
                    <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">{menu.description}</p>
                  )}
                </div>

                <div
                  className="h-1.5 w-0 group-hover:w-full transition-all duration-500 ease-out"
                  style={{ backgroundColor: themeColor }}
                />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
