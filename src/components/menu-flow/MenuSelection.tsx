"use client"

import type React from "react"
import { useState, useMemo } from "react"
import Image from "next/image"
import type { Menu, MenuCategory, MenuItem } from "@/types/database"
import { MagnifyingGlassIcon, SparklesIcon, ArrowRightIcon } from "@heroicons/react/24/outline"
import { lightenColor } from "@/lib/color-utils"

interface MenuSelectionProps {
  menus: Menu[]
  categories?: MenuCategory[]
  items?: MenuItem[]
  onSelectMenu: (menu: Menu) => void
  onSelectItem?: (item: MenuItem, category: MenuCategory) => void
  themeColor: string
}

export default function MenuSelection({ 
  menus, 
  categories = [], 
  items = [], 
  onSelectMenu, 
  onSelectItem, 
  themeColor 
}: MenuSelectionProps) {
  const [searchQuery, setSearchQuery] = useState("")

  // Enhanced search that includes menu items
  const { filteredMenus, searchedItems } = useMemo(() => {
    if (!searchQuery.trim()) {
      return { 
        filteredMenus: menus, 
        searchedItems: [] 
      }
    }

    const query = searchQuery.toLowerCase()
    
    // Filter menus
    const filteredMenus = menus.filter(
      (menu) =>
        menu.name.toLowerCase().includes(query) || 
        (menu.description && menu.description.toLowerCase().includes(query))
    )

    // Search through menu items
    const searchedItems: { item: MenuItem; category: MenuCategory; menu: Menu }[] = []
    
    items.forEach(item => {
      const itemMatches = 
        item.name.toLowerCase().includes(query) ||
        (item.description && item.description.toLowerCase().includes(query))
      
      if (itemMatches) {
        // Find the category and menu for this item
        const category = categories.find(cat => cat.id === item.category_id)
        if (category) {
          const menu = menus.find(m => m.id === category.menu_id)
          if (menu) {
            searchedItems.push({ item, category, menu })
          }
        }
      }
    })

    return { filteredMenus, searchedItems }
  }, [menus, categories, items, searchQuery])

  const hasNoResults = searchQuery.trim() && filteredMenus.length === 0 && searchedItems.length === 0

  const handleItemSelect = (item: MenuItem, category: MenuCategory) => {
    if (onSelectItem) {
      onSelectItem(item, category)
    }
  }

  return (
    <div className="w-full space-y-2 pb-2">
      <div className="mb-2">
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Discover Our Menu</h2>
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
            placeholder="Search menus or items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-14 pr-6 py-3.5 rounded-full border-2 outline-none transition-all text-sm font-medium bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md focus:shadow-lg"
            style={{
              borderColor: searchQuery ? themeColor : "#E5E7EB",
            }}
          />
        </div>
      </div>

      {/* Search Results */}
      {searchQuery.trim() && (
        <div className="mb-6">
          {hasNoResults ? (
            <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MagnifyingGlassIcon className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium text-lg">No results found</p>
              <p className="text-gray-400 text-sm mt-1">Try adjusting your search terms</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Menu Items Results */}
              {searchedItems.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <SparklesIcon className="w-5 h-5" style={{ color: themeColor }} />
                    Menu Items ({searchedItems.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {searchedItems.map(({ item, category, menu }) => (
                      <button
                        key={`${item.id}-${category.id}`}
                        onClick={() => handleItemSelect(item, category)}
                        className="group text-left p-4 bg-white border border-gray-200 rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-offset-2 active:scale-[0.98]"
                        style={
                          {
                            "--tw-ring-color": `${themeColor}40`,
                          } as React.CSSProperties
                        }
                      >
                        <div className="flex items-start gap-3">
                          {item.image_url ? (
                            <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                              <Image
                                src={item.image_url}
                                alt={item.name}
                                fill
                                className="object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                            </div>
                          ) : (
                            <div 
                              className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: lightenColor(themeColor, 95) }}
                            >
                              <SparklesIcon className="w-8 h-8 opacity-40" style={{ color: themeColor }} />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 group-hover:translate-x-1 transition-transform duration-300">
                              {item.name}
                            </h4>
                            <p className="text-sm text-gray-500 mt-1">
                              {menu.name} → {category.name}
                            </p>
                            {item.description && (
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                {item.description}
                              </p>
                            )}
                            {item.price && (
                              <p className="text-sm font-medium mt-2" style={{ color: themeColor }}>
                                ₦{item.price.toLocaleString()}
                              </p>
                            )}
                          </div>
                          <ArrowRightIcon className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all duration-300 flex-shrink-0" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Menu Results */}
              {filteredMenus.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <MagnifyingGlassIcon className="w-5 h-5" style={{ color: themeColor }} />
                    Menus ({filteredMenus.length})
                  </h3>
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
                              <SparklesIcon className="w-16 h-16 opacity-20" style={{ color: themeColor }} />
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
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Default Menu Grid (when not searching) */}
      {!searchQuery.trim() && (
        <>
          {menus.length === 0 ? (
            <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MagnifyingGlassIcon className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium text-lg">No menus available</p>
              <p className="text-gray-400 text-sm mt-1">Check back later for updates</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-5">
              {menus.map((menu) => (
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
                        <SparklesIcon className="w-16 h-16 opacity-20" style={{ color: themeColor }} />
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
        </>
      )}
    </div>
  )
}
