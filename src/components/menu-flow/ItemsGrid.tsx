"use client"

import type { MenuCategory, MenuItem } from "@/types/database"
import { ChevronLeftIcon } from "@heroicons/react/24/outline"
import MenuItemCard from "../MenuItemCard"
import { lightenColor } from "@/lib/color-utils"

interface ItemsGridProps {
  category: MenuCategory
  items: MenuItem[]
  onBack: () => void
  themeColor: string
}

export default function ItemsGrid({ category, items, onBack, themeColor }: ItemsGridProps) {
  const bgColor = lightenColor(themeColor, 95)

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

      {items.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <p className="text-gray-500">No items available in this category</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <MenuItemCard key={item.id} item={item} themeColor={themeColor} />
          ))}
        </div>
      )}
    </div>
  )
}
