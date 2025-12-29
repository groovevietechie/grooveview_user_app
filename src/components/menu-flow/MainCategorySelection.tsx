"use client"

import type React from "react"
import { useState } from "react"
import Image from "next/image"
import type { Menu, MenuCategory, MenuItem } from "@/types/database"
import { MagnifyingGlassIcon, SparklesIcon, ArrowRightIcon } from "@heroicons/react/24/outline"
import { lightenColor } from "@/lib/color-utils"
import { handleImageError, isValidImageUrl } from "@/lib/image-utils"
import { EmptyState, MainCategoryLoadingSkeleton } from "../LoadingStates"

interface MainCategorySelectionProps {
  menus: Menu[]
  categories: MenuCategory[]
  items?: MenuItem[]
  onSelectCategory: (category: "food" | "drinks" | "services") => void
  onSelectMenuCategory: (category: MenuCategory) => void
  onSelectItem?: (item: MenuItem, category: MenuCategory) => void
  themeColor: string
  isLoading?: boolean
  selectedMainCategory?: "food" | "drinks" | "services" | null
}

export default function MainCategorySelection({ 
  menus, 
  categories, 
  items = [],
  onSelectCategory, 
  onSelectMenuCategory, 
  onSelectItem,
  themeColor,
  isLoading = false,
  selectedMainCategory = null
}: MainCategorySelectionProps) {
  const [searchQuery, setSearchQuery] = useState("")

  // Show loading state
  if (isLoading) {
    return <MainCategoryLoadingSkeleton themeColor={themeColor} />
  }

  // Define main categories with their associated menu types
  const mainCategories = [
    {
      id: "food" as const,
      name: "Food",
      description: "Delicious meals and appetizers",
      fallbackColor: themeColor, // Use theme color for unselected
      keywords: ["food", "meal", "eat", "dish", "cuisine", "restaurant"]
    },
    {
      id: "drinks" as const,
      name: "Drinks",
      description: "Refreshing beverages and cocktails",
      fallbackColor: themeColor, // Use theme color for unselected
      keywords: ["drink", "beverage", "cocktail", "beer", "wine", "bar", "alcohol"]
    },
    {
      id: "services" as const,
      name: "Services",
      description: "Book rooms, parties and more",
      fallbackColor: themeColor, // Use theme color for unselected
      keywords: ["service", "booking", "room", "party", "event"]
    }
  ]

  // Orange color for active/selected state
  const activeColor = "#F97316" // Orange-500

  // Get menus that match the main category type
  const getMenusForCategory = (categoryType: "food" | "drinks") => {
    const category = mainCategories.find(cat => cat.id === categoryType)
    if (!category) return []
    
    const matchingMenus = menus.filter(menu => {
      const menuName = menu.name.toLowerCase()
      const menuDesc = menu.description?.toLowerCase() || ""
      
      return category.keywords.some(keyword => 
        menuName.includes(keyword) || menuDesc.includes(keyword)
      )
    })
    
    // If no specific matches found, return all menus as fallback
    return matchingMenus.length > 0 ? matchingMenus : menus
  }

  // Get categories for display in the categories section
  const getDisplayCategories = () => {
    if (selectedMainCategory && selectedMainCategory !== "services") {
      // Filter categories based on selected main category
      const filteredMenus = getMenusForCategory(selectedMainCategory)
      const filteredMenuIds = filteredMenus.map(menu => menu.id)
      
      // Return categories that belong to the filtered menus
      return categories.filter(category => 
        filteredMenuIds.includes(category.menu_id)
      )
    }
    
    // If no main category selected or searching, show all categories (limited)
    return categories.slice(0, 8)
  }

  const filteredMainCategories = mainCategories.filter(category =>
    searchQuery === "" || 
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredMenuCategories = categories.filter(category =>
    searchQuery === "" ||
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Search through menu items when there's a search query
  const searchedItems = searchQuery.trim() ? items.filter(item => {
    const itemMatches = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
    return itemMatches
  }).map(item => {
    // Find the category and menu for this item
    const category = categories.find(cat => cat.id === item.category_id)
    const menu = category ? menus.find(m => m.id === category.menu_id) : null
    return { item, category, menu }
  }).filter(result => result.category && result.menu) : []

  const displayCategories = searchQuery ? filteredMenuCategories : getDisplayCategories()

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
            placeholder="Search..."
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
          {filteredMainCategories.length === 0 && displayCategories.length === 0 && searchedItems.length === 0 ? (
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
                      category && menu && (
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
                      )
                    ))}
                  </div>
                </div>
              )}

              {/* Main Categories Results */}
              {filteredMainCategories.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <MagnifyingGlassIcon className="w-5 h-5" style={{ color: themeColor }} />
                    Main Categories ({filteredMainCategories.length})
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    {filteredMainCategories.map((category) => {
                      const representativeMenus = category.id === "services" ? [] : getMenusForCategory(category.id)
                      const representativeMenu = representativeMenus[0]
                      const isSelected = selectedMainCategory === category.id
                      const activeColor = "#F97316"
                      
                      return (
                        <button
                          key={category.id}
                          onClick={() => onSelectCategory(category.id)}
                          className={`group text-center transition-all duration-300 hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-offset-2 active:scale-[0.98] ${
                            isSelected ? 'ring-2 ring-offset-2' : ''
                          }`}
                          style={
                            {
                              "--tw-ring-color": isSelected ? activeColor : `${themeColor}40`,
                            } as React.CSSProperties
                          }
                        >
                          <div className={`bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 ${
                            isSelected ? 'border-2 shadow-lg' : ''
                          }`}
                          style={isSelected ? { borderColor: activeColor } : {}}
                          >
                            <div className="relative h-24 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50">
                              {representativeMenu?.image_url && isValidImageUrl(representativeMenu.image_url) ? (
                                <Image
                                  src={representativeMenu.image_url}
                                  alt={category.name}
                                  fill
                                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                                  onError={handleImageError}
                                />
                              ) : (
                                <div 
                                  className="w-full h-full flex items-center justify-center"
                                  style={{ backgroundColor: lightenColor(isSelected ? activeColor : category.fallbackColor, 95) }}
                                >
                                  <span 
                                    className="text-2xl font-bold" 
                                    style={{ color: isSelected ? activeColor : category.fallbackColor }}
                                  >
                                    {category.name.charAt(0)}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="p-2">
                              <div
                                className={`inline-block px-3 py-1 rounded-full text-white font-medium text-xs group-hover:scale-105 transition-transform duration-300 ${
                                  isSelected ? 'scale-105' : ''
                                }`}
                                style={{ backgroundColor: isSelected ? activeColor : category.fallbackColor }}
                              >
                                {category.name}
                              </div>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Menu Categories Results */}
              {displayCategories.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <SparklesIcon className="w-5 h-5" style={{ color: themeColor }} />
                    Categories ({displayCategories.length})
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {displayCategories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => onSelectMenuCategory(category)}
                        className="group bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 text-left"
                      >
                        <div className="relative h-20 overflow-hidden">
                          {category.image_url && isValidImageUrl(category.image_url) ? (
                            <Image
                              src={category.image_url}
                              alt={category.name}
                              fill
                              className="object-cover group-hover:scale-110 transition-transform duration-500"
                              onError={handleImageError}
                            />
                          ) : (
                            <div 
                              className="w-full h-full flex items-center justify-center"
                              style={{ backgroundColor: lightenColor(themeColor, 95) }}
                            >
                              <SparklesIcon 
                                className="w-6 h-6 opacity-30" 
                                style={{ color: themeColor }} 
                              />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                          <div className="absolute bottom-2 left-3 right-3">
                            <h4 className="text-white font-bold text-sm leading-tight">
                              {category.name}
                            </h4>
                          </div>
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

      {/* Default view when not searching */}
      {!searchQuery.trim() && (
        <>
          {/* Main Categories Grid */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {filteredMainCategories.map((category) => {
              // Get a representative menu for this category to show its image
              const representativeMenus = category.id === "services" ? [] : getMenusForCategory(category.id)
              const representativeMenu = representativeMenus[0]
              const isSelected = selectedMainCategory === category.id
              
              return (
                <button
                  key={category.id}
                  onClick={() => onSelectCategory(category.id)}
                  className={`group text-center transition-all duration-300 hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-offset-2 active:scale-[0.98] ${
                    isSelected ? 'ring-2 ring-offset-2' : ''
                  }`}
                  style={
                    {
                      "--tw-ring-color": isSelected ? activeColor : `${themeColor}40`,
                    } as React.CSSProperties
                  }
                >
                  <div className={`bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 ${
                    isSelected ? 'border-2 shadow-lg' : ''
                  }`}
                  style={isSelected ? { borderColor: activeColor } : {}}
                  >
                    {/* Category Image */}
                    <div className="relative h-32 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50">
                      {representativeMenu?.image_url && isValidImageUrl(representativeMenu.image_url) ? (
                        <Image
                          src={representativeMenu.image_url}
                          alt={category.name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                          onError={handleImageError}
                        />
                      ) : (
                        <div 
                          className="w-full h-full flex items-center justify-center"
                          style={{ backgroundColor: lightenColor(isSelected ? activeColor : category.fallbackColor, 95) }}
                        >
                          <span 
                            className="text-3xl font-bold" 
                            style={{ color: isSelected ? activeColor : category.fallbackColor }}
                          >
                            {category.name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>

                    {/* Category Label */}
                    <div className="p-3">
                      <div
                        className={`inline-block px-4 py-2 rounded-full text-white font-medium text-sm group-hover:scale-105 transition-transform duration-300 ${
                          isSelected ? 'scale-105' : ''
                        }`}
                        style={{ backgroundColor: isSelected ? activeColor : category.fallbackColor }}
                      >
                        {category.name}
                      </div>
                    </div>

                    <div
                      className={`h-1 transition-all duration-500 ease-out ${
                        isSelected ? 'w-full' : 'w-0 group-hover:w-full'
                      }`}
                      style={{ backgroundColor: isSelected ? activeColor : category.fallbackColor }}
                    />
                  </div>
                </button>
              )
            })}
          </div>

          {/* Categories Section - Now showing filtered categories based on selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedMainCategory ? (
                  `${selectedMainCategory.charAt(0).toUpperCase() + selectedMainCategory.slice(1)} Categories`
                ) : (
                  'Categories'
                )}
              </h3>
              {selectedMainCategory && selectedMainCategory !== "services" && (
                <button
                  onClick={() => onSelectCategory(selectedMainCategory)}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Clear filter
                </button>
              )}
            </div>
            
            {displayCategories.length === 0 ? (
              <EmptyState
                title={searchQuery ? "No categories found" : selectedMainCategory ? `No ${selectedMainCategory} categories available` : "No categories available"}
                description={searchQuery ? "Try adjusting your search terms" : selectedMainCategory ? `This business hasn't added any ${selectedMainCategory} categories yet` : "This business hasn't added any menu categories yet"}
                themeColor={themeColor}
              />
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {displayCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => onSelectMenuCategory(category)}
                    className="group bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 text-left"
                  >
                    <div className="relative h-24 overflow-hidden">
                      {category.image_url && isValidImageUrl(category.image_url) ? (
                        <Image
                          src={category.image_url}
                          alt={category.name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                          onError={handleImageError}
                        />
                      ) : (
                        <div 
                          className="w-full h-full flex items-center justify-center"
                          style={{ backgroundColor: lightenColor(themeColor, 95) }}
                        >
                          <SparklesIcon 
                            className="w-8 h-8 opacity-30" 
                            style={{ color: themeColor }} 
                          />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                      <div className="absolute bottom-2 left-3 right-3">
                        <h4 className="text-white font-bold text-sm leading-tight">
                          {category.name}
                        </h4>
                        {category.description && (
                          <p className="text-white/80 text-xs mt-1 line-clamp-1">
                            {category.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div
                      className="h-1 w-0 group-hover:w-full transition-all duration-500 ease-out"
                      style={{ backgroundColor: selectedMainCategory ? activeColor : themeColor }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}