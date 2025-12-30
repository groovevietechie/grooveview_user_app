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

  const handleCategorySelect = (category: MenuCategory) => {
    setSelectedCategory(category)
    setStep("items")
  }

  const handleBackToMenus = () => {
    setSelectedCategory(null)
    setStep("menus")
  }

  const handleServiceSelect = (service: any) => {
    setStep("services")
  }

  const handleServiceBookingComplete = (bookingId: string) => {
    console.log("Service booking completed:", bookingId)
    handleBackToMenus()
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
            onBookingComplete={handleServiceBookingComplete}
          />
        )}
      </div>
    </ErrorBoundary>
  )
}
