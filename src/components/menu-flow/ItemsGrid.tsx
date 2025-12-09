"use client"

import { useState, useMemo } from "react"
import type { MenuCategory, MenuItem } from "@/types/database"
import { ChevronLeftIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline"
import { lightenColor } from "@/lib/color-utils"
import MenuItemCard from "../MenuItemCard"

interface ItemsGridProps {
  category: MenuCategory
  items: MenuItem[]
  onBack: () => void
  themeColor: string
}

export default function ItemsGrid({ category, items, onBack, themeColor }: ItemsGridProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items
    const query = searchQuery.toLowerCase()
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(query) || (item.description && item.description.toLowerCase().includes(query)),
    )
  }, [items, searchQuery])

  const bgColor = lightenColor(themeColor, 95)
  const inputBgColor = lightenColor(themeColor, 90)

  return (
    <div className="w-full space-y-4">
      {/* Header with back button */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Go back to categories"
        >
          <ChevronLeftIcon className="w-6 h-6 text-gray-700" />
        </button>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: themeColor }}>
            {category.name}
          </h1>
          {category.description && <p className="text-gray-600 text-sm mt-1">{category.description}</p>}
        </div>
      </div>

      <div className="relative mb-6" style={{ backgroundColor: inputBgColor }}>
        <MagnifyingGlassIcon
          style={{ color: themeColor }}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
        />
        <input
          type="text"
          placeholder="Search items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-full border-2 outline-none transition-colors text-sm"
          style={{
            borderColor: themeColor,
            backgroundColor: "rgba(255, 255, 255, 0.6)",
          }}
        />
      </div>

      {filteredItems.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <MagnifyingGlassIcon className="w-8 h-8 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No items match "{searchQuery}"</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <MenuItemCard key={item.id} item={item} themeColor={themeColor} />
          ))}
        </div>
      )}
    </div>
  )
}
