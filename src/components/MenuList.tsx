"use client"

import { useState } from "react"
import type { Menu, MenuCategory, MenuItem, Business } from "@/types/database"
import MenuTabsView from "./menu-flow/MenuTabsView"
import ItemsGrid from "./menu-flow/ItemsGrid"
import ServiceFlow from "./ServiceFlow"
import { ErrorBoundary, MenuErrorFallback } from "./ErrorBoundary"

interface MenuListProps {
  business: Business
  menus: Menu[]
  categories: MenuCategory[]
  items: MenuItem[]
  themeColor: string
}

type FlowStep = "menus" | "items" | "services"

export default function MenuList({ business, menus, categories, items, themeColor }: MenuListProps) {
  const [step, setStep] = useState<FlowStep>("menus")
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | null>(null)
  const [selectedService, setSelectedService] = useState<any>(null)
  const [lastActiveTab, setLastActiveTab] = useState<string>("") // Will be set dynamically based on available menus

  // Set initial active tab based on available menus (drinks first preference)
  const getInitialActiveTab = () => {
    const drinkKeywords = ['drink', 'beverage', 'juice', 'water', 'soda', 'coffee', 'tea', 'cocktail', 'beer', 'wine', 'smoothie', 'shake', 'latte', 'cappuccino']
    const drinksMenu = menus.find(menu => 
      drinkKeywords.some(keyword => menu.name.toLowerCase().includes(keyword))
    )
    return drinksMenu?.id || menus[0]?.id || "services"
  }

  // Set initial tab if not already set
  if (!lastActiveTab && menus.length > 0) {
    setLastActiveTab(getInitialActiveTab())
  }

  // Group items by category
  const itemsByCategory = items.reduce(
    (acc, item) => {
      if (!acc[item.category_id]) {
        acc[item.category_id] = []
      }
      acc[item.category_id].push(item)
      return acc
    },
    {} as Record<string, MenuItem[]>,
  )

  const handleCategorySelect = (category: MenuCategory, activeTab?: string) => {
    setSelectedCategory(category)
    if (activeTab) {
      setLastActiveTab(activeTab) // Store which tab the user was on
    }
    setStep("items")
  }

  const handleBackToMenus = () => {
    setSelectedCategory(null)
    setSelectedService(null)
    setStep("menus")
    // Don't reset lastActiveTab - preserve it for the MenuTabsView
  }

  const handleServiceSelect = (service: any) => {
    setSelectedService(service)
    setLastActiveTab("services") // Set the active tab to services when a service is selected
    setStep("services")
  }

  const handleServiceBookingComplete = (bookingId: string) => {
    console.log("Service booking completed:", bookingId)
    // Don't reset lastActiveTab - preserve "services" tab
    setSelectedService(null)
    setStep("menus") // Return to menus but preserve the services tab
  }

  if (menus.length === 0 && step !== "services") {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No menus available</p>
      </div>
    )
  }

  return (
    <ErrorBoundary fallback={(props) => <MenuErrorFallback {...props} themeColor={themeColor} />}>
      <div className="w-full">
        {step === "menus" && (
          <MenuTabsView
            menus={menus}
            categories={categories}
            items={items}
            onSelectCategory={handleCategorySelect}
            onSelectService={handleServiceSelect}
            themeColor={themeColor}
            business={business}
            initialActiveTab={lastActiveTab} // Pass the last active tab
          />
        )}

        {step === "items" && selectedCategory && (
          <ItemsGrid
            category={selectedCategory}
            items={itemsByCategory[selectedCategory.id] || []}
            onBack={handleBackToMenus}
            themeColor={themeColor}
          />
        )}

        {step === "services" && (
          <ServiceFlow
            business={business}
            themeColor={themeColor}
            initialService={selectedService}
            onBookingComplete={handleServiceBookingComplete}
            onBackToMenu={() => {
              setSelectedService(null)
              setStep("menus") // Return to menus with preserved tab state
            }}
          />
        )}
      </div>
    </ErrorBoundary>
  )
}
