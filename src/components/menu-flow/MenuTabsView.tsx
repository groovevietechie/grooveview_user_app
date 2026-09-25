"use client"

import React, { useState, useMemo, useEffect } from "react"
import Image from "next/image"
import type { Menu, MenuCategory, MenuItem, ServiceConfiguration, Business } from "@/types/database"
import { MagnifyingGlassIcon, SparklesIcon, CogIcon, ArrowRightIcon, BuildingStorefrontIcon, ShoppingBagIcon, WrenchScrewdriverIcon, AdjustmentsHorizontalIcon, ChevronRightIcon } from "@heroicons/react/24/outline"
import { lightenColor } from "@/lib/color-utils"
import { getServiceConfigurations } from "@/lib/api"

interface MenuTabsViewProps {
  menus: Menu[]
  categories: MenuCategory[]
  items: MenuItem[]
  onSelectCategory: (category: MenuCategory, activeTab?: string) => void
  onSelectService: (service: ServiceConfiguration) => void
  themeColor: string
  business: Business
  initialActiveTab?: string
  orderCounts: Record<string, number>
}

type TabType = "all" | string // "all" or menu.id or "services"

const MenuTabsView: React.FC<MenuTabsViewProps> = ({ 
  menus, 
  categories, 
  items, 
  onSelectCategory,
  onSelectService,
  themeColor,
  business,
  initialActiveTab,
  orderCounts
}) => {
  // Determine default tab - Drinks first, then other menus, then services
  const drinkKeywords = ['drink', 'beverage', 'juice', 'water', 'soda', 'coffee', 'tea', 'cocktail', 'beer', 'wine', 'smoothie', 'shake', 'latte', 'cappuccino']
  const drinksMenu = menus.find(menu => 
    drinkKeywords.some(keyword => menu.name.toLowerCase().includes(keyword))
  )
  const defaultTab = drinksMenu?.id || menus[0]?.id || "services"
  
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<TabType>(initialActiveTab || defaultTab)
  const [services, setServices] = useState<ServiceConfiguration[]>([])
  const [servicesLoading, setServicesLoading] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  // Calculate order counts for categories and menus
  const getCategoryOrderCount = (categoryId: string): number => {
    const categoryItems = items.filter(item => item.category_id === categoryId)
    return categoryItems.reduce((total, item) => total + (orderCounts[item.id] || 0), 0)
  }

  // Get minimum price for a category
  const getCategoryMinPrice = (categoryId: string): number | null => {
    const categoryItems = items.filter(item => item.category_id === categoryId)
    if (categoryItems.length === 0) return null
    const minPrice = Math.min(...categoryItems.map(item => item.price))
    return minPrice
  }

  const getMenuOrderCount = (menuId: string): number => {
    const menuCategories = categories.filter(cat => cat.menu_id === menuId)
    return menuCategories.reduce((total, cat) => total + getCategoryOrderCount(cat.id), 0)
  }

  // Load services on component mount
  useEffect(() => {
    setServicesLoading(true)
    getServiceConfigurations(business.id)
      .then(setServices)
      .catch(error => {
        console.error("Failed to load services:", error)
        setServices([])
      })
      .finally(() => setServicesLoading(false))
  }, [business.id])

  // Get service type display info
  const getServiceTypeInfo = (serviceType: string | null) => {
    if (!serviceType) {
      return {
        name: 'Custom Service',
        description: 'Custom service offering',
        image: null,
        fallbackColor: themeColor
      }
    }

    switch (serviceType) {
      case 'roomBooking':
        return {
          name: 'Room Booking',
          description: 'Book private rooms for your events',
          image: null, // No image needed for buttons
          fallbackColor: '#4F46E5'
        }
      case 'partyBooking':
        return {
          name: 'Party Booking',
          description: 'Complete party packages with all amenities',
          image: null, // No image needed for buttons
          fallbackColor: '#7C3AED'
        }
      default:
        return {
          name: serviceType.charAt(0).toUpperCase() + serviceType.slice(1),
          description: 'Custom service offering',
          image: null, // No image needed for buttons
          fallbackColor: themeColor
        }
    }
  }

  // Get categories to display based on active tab
  const displayCategories = useMemo(() => {
    if (activeTab === "services") {
      // Convert services to category-like objects for display
      return services.map(service => ({
        id: service.id,
        name: service.title,
        description: service.description || getServiceTypeInfo(service.service_type).description,
        image_url: null, // Services displayed as buttons, no image needed
        menu_id: "services",
        isService: true,
        serviceData: service
      }))
    } else {
      // Filter categories by selected menu, or show every category for All
      return activeTab === "all" ? categories : categories.filter(cat => cat.menu_id === activeTab)
    }
  }, [activeTab, categories, services])

  // Enhanced search that includes menu items and services
  const { searchedItems, filteredCategories } = useMemo(() => {
    if (!searchQuery.trim()) {
      return { 
        searchedItems: [],
        filteredCategories: displayCategories
      }
    }

    const query = searchQuery.toLowerCase()
    
    // Filter categories
    const filteredCategories = displayCategories.filter(category =>
      category.name.toLowerCase().includes(query) ||
      (category.description && category.description.toLowerCase().includes(query))
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

    return { searchedItems, filteredCategories }
  }, [searchQuery, displayCategories, items, categories, menus])

  const handleItemSelect = (item: MenuItem, category: MenuCategory) => {
    // Navigate directly to items view for this category
    onSelectCategory(category, activeTab) // Pass the current active tab
  }

  const handleCategorySelect = (category: any) => {
    if (category.isService && category.serviceData) {
      onSelectService(category.serviceData)
    } else {
      onSelectCategory(category as MenuCategory, activeTab) // Pass the current active tab
    }
  }


  // Create tabs array - Drinks first, then other menus, then Services
  const otherMenus = menus.filter(menu => 
    !drinkKeywords.some(keyword => menu.name.toLowerCase().includes(keyword))
  )
  
  const tabs = [
    // Drinks menu first (if exists)
    ...(drinksMenu ? [{
      id: drinksMenu.id,
      name: drinksMenu.name,
      count: categories.filter(cat => cat.menu_id === drinksMenu.id).length
    }] : []),
    // Other menus
    ...otherMenus.map(menu => ({
      id: menu.id,
      name: menu.name,
      count: categories.filter(cat => cat.menu_id === menu.id).length
    })),
    // Services last
    { id: "services", name: "Services", count: services.length }
  ]

  const hasNoResults = searchQuery.trim() && 
    filteredCategories.length === 0 && 
    searchedItems.length === 0

  return (
    <div className="lounge-menu-content w-full space-y-2 pb-1">
      {/* Search Bar */}
      <div className="mb-2">
        <div className="relative mb-2">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-white to-gray-100 rounded-2xl blur-sm opacity-60"></div>
          <div className="relative lounge-search-control">
            <MagnifyingGlassIcon
              style={{ color: themeColor }}
              className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search drinks, food, or experiences..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-6 py-4 rounded-2xl border-2 outline-none transition-all text-sm font-medium bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl focus:shadow-2xl placeholder:text-gray-400"
              style={{
                borderColor: searchQuery ? themeColor : "#E5E7EB",
              }}
            />
            <button
              type="button"
              onClick={() => setIsFilterOpen((open) => !open)}
              aria-label="Filter menu categories"
              aria-expanded={isFilterOpen}
              className={`lounge-filter-button ${isFilterOpen ? "is-active" : ""}`}
            >
              <AdjustmentsHorizontalIcon className="w-5 h-5" />
            </button>
          </div>
          {isFilterOpen && (
            <div className="lounge-filter-panel" role="group" aria-label="Filter by menu">
              <button type="button" onClick={() => { setActiveTab("all"); setSearchQuery("") }} className={activeTab === "all" ? "is-selected" : ""}>All</button>
              {tabs.map((tab) => (
                <button key={tab.id} type="button" onClick={() => { setActiveTab(tab.id); setSearchQuery(""); setIsFilterOpen(false) }} className={activeTab === tab.id ? "is-selected" : ""}>{tab.name}</button>
              ))}
            </div>
          )}
        </div>

        {/* Enhanced Tabs */}
        {!searchQuery.trim() && (
          <div className="lounge-category-switcher relative mb-8 grid grid-cols-3 gap-2">
              {tabs.map((tab, index) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`lounge-category-button relative text-left px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'is-active text-white shadow-lg z-10'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
                  }`}
                >
                  <div className="relative z-10 flex items-center gap-3">
                    <span className="lounge-category-icon">
                      {tab.id === "services" ? <WrenchScrewdriverIcon /> : index === 0 ? <BuildingStorefrontIcon /> : <ShoppingBagIcon />}
                    </span>
                    <div className="lounge-category-copy">
                      <div className="lounge-category-name-row">
                        <div className="font-semibold truncate">{tab.name}</div>
                      </div>
                    </div>
                    <ChevronRightIcon className="lounge-category-chevron" />
                  </div>
                </button>
              ))}
          </div>
        )}
      </div>

      {/* Search Results */}
      {searchQuery.trim() && (
        <div className="mb-8">
          {hasNoResults ? (
            <div className="text-center py-20 bg-gradient-to-br from-gray-50 via-white to-gray-50 rounded-3xl border border-gray-100 shadow-lg">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                <MagnifyingGlassIcon className="w-12 h-12 text-gray-400" />
              </div>
              <p className="text-gray-700 font-semibold text-lg mb-2">No results found</p>
              <p className="text-gray-500 text-xs">Try adjusting your search terms or browse our categories</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Menu Items Results */}
              {searchedItems.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
                      style={{ backgroundColor: themeColor }}
                    >
                      <SparklesIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Menu Items</h3>
                      <p className="text-gray-500 text-xs">{searchedItems.length} items found</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {searchedItems.map(({ item, category, menu }) => (
                      <button
                        key={`${item.id}-${category.id}`}
                        onClick={() => handleItemSelect(item, category)}
                        className="group text-left p-5 bg-white border border-gray-200 rounded-2xl hover:shadow-xl transition-all duration-300 hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-offset-2 active:scale-[0.98] hover:border-gray-300"
                        style={
                          {
                            "--tw-ring-color": `${themeColor}40`,
                          } as React.CSSProperties
                        }
                      >
                        <div className="flex items-start gap-4">
                          {item.image_url ? (
                            <div className="relative w-18 h-18 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 shadow-md">
                              <Image
                                src={item.image_url}
                                alt={item.name}
                                fill
                                className="object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                            </div>
                          ) : (
                            <div 
                              className="w-18 h-18 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md"
                              style={{ backgroundColor: lightenColor(themeColor, 95) }}
                            >
                              <SparklesIcon className="w-8 h-8 opacity-50" style={{ color: themeColor }} />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-900 group-hover:translate-x-1 transition-transform duration-300 text-sm">
                              {item.name}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                {menu.name}
                              </span>
                              <span className="text-xs text-gray-400">→</span>
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                {category.name}
                              </span>
                            </div>
                            {item.description && (
                              <p className="text-xs text-gray-600 mt-2 line-clamp-2 leading-relaxed">
                                {item.description}
                              </p>
                            )}
                            {item.price && (
                              <div className="flex items-center justify-between mt-3">
                                <p className="text-sm font-bold" style={{ color: themeColor }}>
                                  ₦{item.price.toLocaleString()}
                                </p>
                                <ArrowRightIcon className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all duration-300" />
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Categories Results */}
              {filteredCategories.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
                      style={{ backgroundColor: activeTab === "services" ? '#1F2937' : themeColor }}
                    >
                      {activeTab === "services" ? (
                        <CogIcon className="w-5 h-5 text-white" />
                      ) : (
                        <SparklesIcon className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {activeTab === "services" ? "Services" : "Categories"}
                      </h3>
                      <p className="text-gray-500 text-xs">{filteredCategories.length} options available</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {filteredCategories.map((category) => {
                      const isService = (category as any).isService
                      return (
                        <button
                          key={category.id}
                          onClick={() => handleCategorySelect(category)}
                          className={`group rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-offset-2 active:scale-[0.98] ${
                            isService
                              ? 'bg-gradient-to-br from-gray-900 to-black text-white h-28 flex items-center justify-center'
                              : 'bg-white border border-gray-200 text-left hover:border-gray-300'
                          }`}
                          style={
                            {
                              "--tw-ring-color": `${themeColor}40`,
                            } as React.CSSProperties
                          }
                        >
                          {isService ? (
                            <div className="text-center p-4">
                              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                                <CogIcon className="w-6 h-6 text-white" />
                              </div>
                              <h4 className="font-bold text-sm leading-tight">
                                {category.name}
                              </h4>
                            </div>
                          ) : (
                            <>
                              <div className="relative h-28 overflow-hidden">
                                {category.image_url ? (
                                  <Image
                                    src={category.image_url}
                                    alt={category.name}
                                    fill
                                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                                  />
                                ) : (
                                  <div
                                    className="w-full h-full flex items-center justify-center"
                                    style={{ backgroundColor: lightenColor(themeColor, 95) }}
                                  >
                                    <SparklesIcon
                                      className="w-10 h-10 opacity-30"
                                      style={{ color: themeColor }}
                                    />
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                                
                                {/* Order count badge - top right */}
                                {(() => {
                                  const count = getCategoryOrderCount(category.id)
                                  return count > 0 ? (
                                    <div 
                                      className="absolute top-2 right-2 bg-white/95 backdrop-blur-sm px-2 py-1 rounded-lg shadow-lg"
                                      style={{
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)'
                                      }}
                                    >
                                      <span className="text-xs font-bold" style={{ color: themeColor }}>
                                        {count} {count === 1 ? 'Order' : 'Orders'}
                                      </span>
                                    </div>
                                  ) : null
                                })()}
                                
                                <div className="absolute bottom-3 left-4 right-4">
                                  <h4 className="text-white font-bold text-sm leading-tight mb-1">
                                    {category.name}
                                  </h4>
                                  {category.description && (
                                    <p className="text-white/90 text-xs line-clamp-1">
                                      {category.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div
                                className="h-1 w-0 group-hover:w-full transition-all duration-500 ease-out"
                                style={{ backgroundColor: themeColor }}
                              />
                            </>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Default Categories Grid (when not searching) */}
      {!searchQuery.trim() && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {activeTab === "services" ? "Our Services" : 
                 `${menus.find(m => m.id === activeTab)?.name || ""} Menu`}
              </h3>
              <p className="text-gray-500 text-xs mt-1">
                {activeTab === "services" ? "Professional services tailored for you" : "Browse our delicious offerings"}
              </p>
            </div>
          </div>
          
          {filteredCategories.length === 0 ? (
            <div className="text-center py-20 bg-gradient-to-br from-gray-50 via-white to-gray-50 rounded-3xl border border-gray-100 shadow-lg">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                {activeTab === "services" ? (
                  servicesLoading ? (
                    <CogIcon className="w-12 h-12 text-gray-400 animate-spin" />
                  ) : (
                    <CogIcon className="w-12 h-12 text-gray-400" />
                  )
                ) : (
                  <SparklesIcon className="w-12 h-12 text-gray-400" />
                )}
              </div>
              <p className="text-gray-700 font-semibold text-lg mb-2">
                {activeTab === "services" ? 
                  (servicesLoading ? "Loading services..." : "Coming Soon") : 
                  "No categories available"}
              </p>
              <p className="text-gray-500 text-xs">
                {activeTab === "services" ? 
                  (servicesLoading ? "Please wait while we load our services..." : "We're working on adding new services for you") : 
                  "New categories will be added soon"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-6">
              {filteredCategories.map((category, index) => {
                const isService = (category as any).isService
                const orderCount = getCategoryOrderCount(category.id)
                
                return (
                  <button
                    key={category.id}
                    onClick={() => handleCategorySelect(category)}
                    className={`group relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-offset-2 active:scale-[0.98] before:absolute before:inset-0 before:rounded-2xl before:pointer-events-none before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500 ${
                      isService
                        ? 'bg-gradient-to-br from-gray-900 to-black text-white h-40 flex items-center justify-center'
                        : 'h-48 flex flex-col relative'
                    }`}
                    style={
                      {
                        "--tw-ring-color": `${themeColor}40`,
                        animationDelay: `${index * 100}ms`,
                      } as React.CSSProperties
                    }
                  >
                    {!isService && (
                      <>
                        <div 
                          className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                          style={{
                            background: `radial-gradient(circle at 50% 50%, ${themeColor}40, transparent 70%)`,
                            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                          }}
                        />
                        <div
                          className="absolute inset-0 rounded-2xl pointer-events-none"
                          style={{
                            border: `2px solid transparent`,
                            background: `linear-gradient(rgba(2,10,22,0.78), rgba(2,10,22,0.78)) padding-box, linear-gradient(135deg, #f6c945, #ffd52e) border-box`,
                            opacity: 0,
                            animation: `card-glow-edge 3s ease-in-out infinite`,
                            animationDelay: `${index * 100}ms`,
                          }}
                        />
                      </>
                    )}
                    {isService ? (
                      <div className="text-center p-5">
                        <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                          <CogIcon className="w-7 h-7 text-white" />
                        </div>
                        <h4 className="font-bold text-sm leading-tight">
                          {category.name}
                        </h4>
                      </div>
                    ) : (
                      <>
                        {/* Image container */}
                        <div className="relative flex-1 overflow-hidden bg-gray-900">
                          {category.image_url ? (
                            <Image
                              src={category.image_url}
                              alt={category.name}
                              fill
                              className="object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          ) : (
                            <div
                              className="w-full h-full flex items-center justify-center"
                              style={{ backgroundColor: lightenColor(themeColor, 85) }}
                            >
                              <SparklesIcon
                                className="w-12 h-12 opacity-30"
                                style={{ color: themeColor }}
                              />
                            </div>
                          )}
                          
                          {/* Dark gradient overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                          
                          {/* Order count badge - top left (dark navy gradient) */}
                          {orderCount > 0 && (
                            <div 
                              className="absolute top-3 left-3 px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5 font-bold text-xs text-white/90 backdrop-blur-sm"
                              style={{ 
                                background: 'linear-gradient(135deg, rgba(22, 51, 101, 0.9), rgba(5, 20, 44, 0.9))',
                                border: '1px solid rgba(89, 148, 255, 0.35)'
                              }}
                            >
                              <span className="block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: themeColor }}></span>
                              <span>{orderCount} {orderCount === 1 ? 'Order' : 'Orders'}</span>
                            </div>
                          )}
                          
                          {/* Favorite icon - top right */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              // Add favorite functionality here
                            }}
                            className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
                            aria-label="Add to favorites"
                          >
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                          </button>
                        </div>

                        {/* Bottom section with title and price on same row */}
                        <div className="relative z-10 bg-gradient-to-t from-black/40 to-transparent px-4 py-4">
                          <div className="flex items-end justify-between gap-3">
                            <h4 className="text-white font-bold text-sm leading-tight">
                              {category.name}
                            </h4>
                            {(() => {
                              const minPrice = getCategoryMinPrice(category.id)
                              return minPrice !== null ? (
                                <p className="text-white/90 text-sm font-semibold whitespace-nowrap">
                                  ₦{minPrice.toLocaleString()}+
                                </p>
                              ) : null
                            })()}
                          </div>
                        </div>
                      </>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default MenuTabsView
