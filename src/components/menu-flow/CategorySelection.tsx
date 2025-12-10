"use client"

import type React from "react"
import { useState, useMemo } from "react"
import Image from "next/image"
import type { Menu, MenuCategory } from "@/types/database"
import { ChevronLeftIcon, MagnifyingGlassIcon, Squares2X2Icon } from "@heroicons/react/24/outline"
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
  const bgColor = lightenColor(themeColor, 97)

  return (
    <div className="w-full space-y-6 pb-8">
      <div className="flex items-start gap-4 mb-8">
        <button
          onClick={onBack}
          className="p-3 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 mt-1"
          aria-label="Go back to menus"
          style={{ color: themeColor }}
        >
          <ChevronLeftIcon className="w-6 h-6" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Squares2X2Icon className="w-7 h-7" style={{ color: themeColor }} />
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{menu.name}</h1>
          </div>
          {menu.description && <p className="text-gray-500 text-base leading-relaxed mt-2">{menu.description}</p>}
          <div className="mt-3">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ backgroundColor: lightenColor(themeColor, 90), color: themeColor }}
            >
              {categories.length} {categories.length === 1 ? "Category" : "Categories"}
            </span>
          </div>
        </div>
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
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-14 pr-6 py-3.5 rounded-full border-2 outline-none transition-all text-sm font-medium bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md focus:shadow-lg"
            style={{
              borderColor: searchQuery ? themeColor : "#E5E7EB",
            }}
          />
        </div>
      </div>

      {filteredCategories.length === 0 ? (
        <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MagnifyingGlassIcon className="w-10 h-10 text-gray-400" />
          </div>
          <p className="text-gray-600 font-medium text-lg">No categories found</p>
          <p className="text-gray-400 text-sm mt-1">Try adjusting your search</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {filteredCategories.map((category, index) => (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category)}
              className="group text-left transition-all duration-300 hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-offset-2 active:scale-[0.98]"
              style={
                {
                  "--tw-ring-color": `${themeColor}40`,
                  animationDelay: `${index * 50}ms`,
                } as React.CSSProperties
              }
            >
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
                {category.image_url ? (
                  <div className="relative h-40 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50">
                    <Image
                      src={category.image_url || "/placeholder.svg"}
                      alt={category.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                ) : (
                  <div
                    className="h-40 flex items-center justify-center"
                    style={{ backgroundColor: lightenColor(themeColor, 95) }}
                  >
                    <Squares2X2Icon className="w-12 h-12 opacity-20" style={{ color: themeColor }} />
                  </div>
                )}

                <div className="p-5">
                  <h3
                    className="font-bold text-lg leading-tight mb-2 group-hover:translate-x-1 transition-transform duration-300"
                    style={{ color: themeColor }}
                  >
                    {category.name}
                  </h3>
                  {category.description && (
                    <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">{category.description}</p>
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
