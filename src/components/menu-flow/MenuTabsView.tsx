"use client"

import React, { useState, useMemo, useEffect } from "react"
import Image from "next/image"
import type { Menu, MenuCategory, MenuItem, ServiceConfiguration, Business } from "@/types/database"
import { MagnifyingGlassIcon, SparklesIcon, CogIcon, ArrowRightIcon } from "@heroicons/react/24/outline"
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

  // Calculate order counts for categories and menus
  const getCategoryOrderCount = (categoryId: string): number => {
    const categoryItems = items.filter(item => item.category_id === categoryId)
    return categoryItems.reduce((total, item) => total + (orderCounts[item.id] || 0), 0)
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
      // Filter categories by selected menu
      return categories.filter(cat => cat.menu_id === activeTab)
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
    <div className="w-full space-y-6 pb-2">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="text-left">
            <h2 className="text-xl font-bold text-gray-900 tracking-tight mb-2">
              Discover Our Menu
            </h2>
            <p className="text-gray-600 text-xs">Choose from our carefully curated selection</p>
          </div>
          <button
            onClick={() => {
              // Trigger sync modal - we'll need to pass this as a prop
              const event = new CustomEvent('openDeviceSync')
              window.dispatchEvent(event)
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
            style={{ backgroundColor: themeColor, color: 'white' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
            </svg>
            <span>Sync Devices</span>
          </button>
        </div>
        
        {/* Search Bar */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-white to-gray-100 rounded-2xl blur-sm opacity-60"></div>
          <div className="relative">
            <MagnifyingGlassIcon
              style={{ color: themeColor }}
              className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search menus, items, or services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-6 py-4 rounded-2xl border-2 outline-none transition-all text-sm font-medium bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl focus:shadow-2xl placeholder:text-gray-400"
              style={{
                borderColor: searchQuery ? themeColor : "#E5E7EB",
              }}
            />
          </div>
        </div>

        {/* Enhanced Tabs */}
        {!searchQuery.trim() && (
          <div className="relative mb-6 flex justify-center">
            <div className="inline-flex gap-0.5 p-1 bg-gray-100 rounded-2xl overflow-x-auto scrollbar-hide">
              {tabs.map((tab, index) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex-shrink-0 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 min-w-[80px] ${
                    activeTab === tab.id
                      ? 'text-white shadow-lg transform scale-105 z-10'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
                  }`}
                  style={activeTab === tab.id ? { 
                    backgroundColor: themeColor,
                    boxShadow: `0 8px 25px -5px ${themeColor}40`
                  } : {}}
                >
                  <div className="text-center relative z-10">
                    <div className="font-semibold">{tab.name}</div>
                    {tab.count > 0 && (
                      <div className={`text-xs mt-0.5 ${
                        activeTab === tab.id ? 'opacity-90' : 'opacity-60'
                      }`}>
                        {tab.count} {tab.count === 1 ? 'item' : 'items'}
                      </div>
                    )}
                  </div>
                  
                  {/* Active tab indicator */}
                  {activeTab === tab.id && (
                    <div 
                      className="absolute inset-0 rounded-xl opacity-20"
                      style={{ backgroundColor: 'white' }}
                    />
                  )}
                </button>
              ))}
            </div>
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
            <div className="grid grid-cols-2 gap-5">
              {filteredCategories.map((category, index) => {
                const isService = (category as any).isService
                return (
                  <button
                    key={category.id}
                    onClick={() => handleCategorySelect(category)}
                    className={`group rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-offset-2 active:scale-[0.98] ${
                      isService
                        ? 'bg-gradient-to-br from-gray-900 to-black text-white h-32 flex items-center justify-center'
                        : 'bg-white border border-gray-200 text-left hover:border-gray-300'
                    }`}
                    style={
                      {
                        "--tw-ring-color": `${themeColor}40`,
                        animationDelay: `${index * 100}ms`,
                      } as React.CSSProperties
                    }
                  >
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
                        <div className="relative h-32 overflow-hidden">
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
                                className="w-12 h-12 opacity-30"
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
                          
                          <div className="absolute bottom-4 left-4 right-4">
                            <h4 className="text-white font-bold text-sm leading-tight mb-1">
                              {category.name}
                            </h4>
                            {category.description && (
                              <p className="text-white/90 text-xs line-clamp-2 leading-relaxed">
                                {category.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div
                          className="h-1.5 w-0 group-hover:w-full transition-all duration-500 ease-out"
                          style={{ backgroundColor: themeColor }}
                        />
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