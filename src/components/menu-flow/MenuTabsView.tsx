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
  onSelectCategory: (category: MenuCategory) => void
  onSelectService: (service: ServiceConfiguration) => void
  themeColor: string
  business: Business
}

type TabType = "all" | string // "all" or menu.id or "services"

const MenuTabsView: React.FC<MenuTabsViewProps> = ({ 
  menus, 
  categories, 
  items, 
  onSelectCategory,
  onSelectService,
  themeColor,
  business
}) => {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<TabType>("all")
  const [services, setServices] = useState<ServiceConfiguration[]>([])
  const [servicesLoading, setServicesLoading] = useState(false)

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
    if (activeTab === "all") {
      return categories
    } else if (activeTab === "services") {
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
    onSelectCategory(category)
  }

  const handleCategorySelect = (category: any) => {
    if (category.isService && category.serviceData) {
      onSelectService(category.serviceData)
    } else {
      onSelectCategory(category as MenuCategory)
    }
  }


  // Create tabs array
  const tabs = [
    { id: "all", name: "All", count: categories.length },
    ...menus.map(menu => ({
      id: menu.id,
      name: menu.name,
      count: categories.filter(cat => cat.menu_id === menu.id).length
    })),
    { id: "services", name: "Services", count: services.length }
  ]

  const hasNoResults = searchQuery.trim() && 
    filteredCategories.length === 0 && 
    searchedItems.length === 0

  return (
    <div className="w-full space-y-6 pb-2">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900 tracking-tight mb-4">
          Discover Our Menu
        </h2>
        
        {/* Search Bar */}
        <div className="relative mb-6">
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

        {/* Tabs */}
        {!searchQuery.trim() && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'text-white shadow-md'
                    : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                }`}
                style={activeTab === tab.id ? { backgroundColor: themeColor } : {}}
              >
                {tab.name} {tab.count > 0 && `(${tab.count})`}
              </button>
            ))}
          </div>
        )}
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

              {/* Categories Results */}
              {filteredCategories.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    {activeTab === "services" ? (
                      <CogIcon className="w-5 h-5" style={{ color: themeColor }} />
                    ) : (
                      <SparklesIcon className="w-5 h-5" style={{ color: themeColor }} />
                    )}
                    {activeTab === "services" ? "Services" : "Categories"} ({filteredCategories.length})
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {filteredCategories.map((category) => {
                      const isService = (category as any).isService
                      return (
                        <button
                          key={category.id}
                          onClick={() => handleCategorySelect(category)}
                          className={`group rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-offset-2 active:scale-[0.98] ${
                            isService
                              ? 'bg-black text-white h-24 flex items-center justify-center'
                              : 'bg-white border border-gray-200 text-left'
                          }`}
                          style={
                            {
                              "--tw-ring-color": `${themeColor}40`,
                            } as React.CSSProperties
                          }
                        >
                          {isService ? (
                            // Service button with black background and centered text
                            <div className="text-center">
                              <CogIcon className="w-8 h-8 mx-auto mb-2 opacity-70" />
                              <h4 className="font-bold text-sm leading-tight">
                                {category.name}
                              </h4>
                            </div>
                          ) : (
                            // Regular category button
                            <>
                              <div className="relative h-24 overflow-hidden">
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
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              {activeTab === "all" ? "All Categories" : 
               activeTab === "services" ? "Services" : 
               `${menus.find(m => m.id === activeTab)?.name || ""} Categories`}
            </h3>
          </div>
          
          {filteredCategories.length === 0 ? (
            <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                {activeTab === "services" ? (
                  servicesLoading ? (
                    <CogIcon className="w-10 h-10 text-gray-400 animate-pulse" />
                  ) : (
                    <CogIcon className="w-10 h-10 text-gray-400" />
                  )
                ) : (
                  <SparklesIcon className="w-10 h-10 text-gray-400" />
                )}
              </div>
              <p className="text-gray-600 font-medium text-lg">
                {activeTab === "services" ? 
                  (servicesLoading ? "Loading services..." : "No services available") : 
                  "No categories available"}
              </p>
              <p className="text-gray-400 text-sm mt-1">
                {activeTab === "services" ? 
                  (servicesLoading ? "Please wait..." : "Check back later for updates") : 
                  "Check back later for updates"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {filteredCategories.map((category) => {
                const isService = (category as any).isService
                return (
                  <button
                    key={category.id}
                    onClick={() => handleCategorySelect(category)}
                    className={`group rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-offset-2 active:scale-[0.98] ${
                      isService
                        ? 'bg-black text-white h-24 flex items-center justify-center'
                        : 'bg-white border border-gray-200 text-left'
                    }`}
                    style={
                      {
                        "--tw-ring-color": `${themeColor}40`,
                      } as React.CSSProperties
                    }
                  >
                    {isService ? (
                      // Service button with black background and centered text
                      <div className="text-center">
                        <CogIcon className="w-8 h-8 mx-auto mb-2 opacity-70" />
                        <h4 className="font-bold text-sm leading-tight">
                          {category.name}
                        </h4>
                      </div>
                    ) : (
                      // Regular category button
                      <>
                        <div className="relative h-24 overflow-hidden">
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