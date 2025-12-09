"use client"

import type React from "react"
import { useState, useMemo } from "react"
import Image from "next/image"
import type { Menu, MenuCategory } from "@/types/database"
import { ChevronLeftIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline"
import { getContrastColor, lightenColor } from "@/lib/color-utils"

interface CategorySelectionProps {
  menu: Menu
  categories: MenuCategory[]
  onSelectCategory: (category: MenuCategory) => void
  onBack: () => void
  themeColor: string
}

export default function CategorySelection({
  menu,
  categories,
  onSelectCategory,
  onBack,
  themeColor,
}: CategorySelectionProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories
    const query = searchQuery.toLowerCase()
    return categories.filter(
      (category) =>
        category.name.toLowerCase().includes(query) ||
        (category.description && category.description.toLowerCase().includes(query)),
    )
  }, [categories, searchQuery])

  const textColor = getContrastColor(themeColor)
  const bgColor = lightenColor(themeColor, 90)
  const inputBgColor = lightenColor(themeColor, 95)

  return (
    <div className="w-full space-y-4">
      {/* Header with back button */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Go back to menus"
        >
          <ChevronLeftIcon className="w-6 h-6 text-gray-700" />
        </button>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: themeColor }}>
            {menu.name}
          </h1>
          {menu.description && <p className="text-gray-600 text-sm mt-1">{menu.description}</p>}
        </div>
      </div>

      <div className="relative mb-6" style={{ backgroundColor: inputBgColor }}>
        <MagnifyingGlassIcon
          style={{ color: themeColor }}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none"
        />
        <input
          type="text"
          placeholder="Search categories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-lg border-2 outline-none transition-colors"
          style={{
            borderColor: themeColor,
            backgroundColor: "rgba(255, 255, 255, 0.6)",
          }}
        />
      </div>

      {filteredCategories.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <MagnifyingGlassIcon className="w-8 h-8 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No categories match "{searchQuery}"</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category)}
              className="group text-left transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={
                {
                  "--tw-ring-color": themeColor,
                } as React.CSSProperties
              }
            >
              <div className="bg-white border-2 rounded-lg overflow-hidden" style={{ borderColor: themeColor }}>
                {category.image_url && (
                  <div className="relative h-36 overflow-hidden" style={{ backgroundColor: bgColor }}>
                    <Image
                      src={category.image_url || "/placeholder.svg"}
                      alt={category.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                )}

                <div className="p-4">
                  <h3 className="font-bold text-lg" style={{ color: themeColor }}>
                    {category.name}
                  </h3>
                  {category.description && (
                    <p className="text-gray-600 text-sm mt-2 line-clamp-2">{category.description}</p>
                  )}
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
