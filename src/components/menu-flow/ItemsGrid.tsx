"use client"

import { useState, useMemo } from "react"
import type { MenuCategory, MenuItem } from "@/types/database"
import { ChevronLeftIcon, MagnifyingGlassIcon, ShoppingBagIcon } from "@heroicons/react/24/outline"
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

  return (
    <div className="w-full space-y-6 pb-8">
      <div className="flex items-start gap-4 mb-8">
        <button
          onClick={onBack}
          className="p-3 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 mt-1"
          aria-label="Go back to categories"
          style={{ color: themeColor }}
        >
          <ChevronLeftIcon className="w-6 h-6" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingBagIcon className="w-5 h-5" style={{ color: themeColor }} />
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">{category.name}</h1>
          </div>
          {category.description && (
            <p className="text-gray-500 text-sm leading-relaxed mt-2">{category.description}</p>
          )}
          <div className="mt-1">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ backgroundColor: lightenColor(themeColor, 90), color: themeColor }}
            >
              {items.length} {items.length === 1 ? "Item" : "Items"}
            </span>
          </div>
        </div>
      </div>

      <div className="relative mb-4">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-gray-50 rounded-full blur-sm opacity-60"></div>
        <div className="relative">
          <MagnifyingGlassIcon
            style={{ color: themeColor }}
            className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-6 py-3.5 rounded-full border-2 outline-none transition-all text-sm font-medium bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md focus:shadow-lg"
            style={{
              borderColor: searchQuery ? themeColor : "#E5E7EB",
            }}
          />
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MagnifyingGlassIcon className="w-10 h-10 text-gray-400" />
          </div>
          <p className="text-gray-600 font-medium text-lg">No items found</p>
          <p className="text-gray-400 text-sm mt-1">Try adjusting your search</p>
        </div>
      ) : (
        <div className="menu-grid-2col">
          {filteredItems.map((item, index) => (
            <div
              key={item.id}
              style={{ animationDelay: `${index * 50}ms` }}
              className="animate-in fade-in slide-in-from-bottom-4 duration-500"
            >
              <MenuItemCard item={item} themeColor={themeColor} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
