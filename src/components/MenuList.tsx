"use client"

import { useEffect } from "react"
import type { Menu, MenuCategory, MenuItem, Business } from "@/types/database"
import MenuTabsView from "./menu-flow/MenuTabsView"
import ItemsGrid from "./menu-flow/ItemsGrid"
import ServiceFlow from "./ServiceFlow"
import { ErrorBoundary, MenuErrorFallback } from "./ErrorBoundary"
import { useMenuNavigation } from "@/hooks/useMenuNavigation"

interface MenuListProps {
  business: Business
  menus: Menu[]
  categories: MenuCategory[]
  items: MenuItem[]
  themeColor: string
  orderCounts: Record<string, number>
}

export default function MenuList({ business, menus, categories, items, themeColor, orderCounts }: MenuListProps) {
  const {
    navigationState,
    navigateToCategory,
    navigateToService,
    navigateToMenus,
    handleBack
  } = useMenuNavigation()

  // Set initial active tab based on available menus (drinks first preference)
  const getInitialActiveTab = () => {
    const drinkKeywords = ['drink', 'beverage', 'juice', 'water', 'soda', 'coffee', 'tea', 'cocktail', 'beer', 'wine', 'smoothie', 'shake', 'latte', 'cappuccino']
    const drinksMenu = menus.find(menu => 
      drinkKeywords.some(keyword => menu.name.toLowerCase().includes(keyword))
    )
    return drinksMenu?.id || menus[0]?.id || "services"
  }

  // Initialize active tab if not set
  useEffect(() => {
    if (!navigationState.activeTab && menus.length > 0) {
      navigateToMenus(getInitialActiveTab())
    }
  }, [menus, navigationState.activeTab, navigateToMenus])

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

  // Find selected category and service
  const selectedCategory = navigationState.selectedCategoryId 
    ? categories.find(cat => cat.id === navigationState.selectedCategoryId)
    : null

  const handleServiceSelect = (service: any) => {
    navigateToService(service.id)
  }

  const handleServiceBookingComplete = (bookingId: string) => {
    console.log("Service booking completed:", bookingId)
    // Return to menus but preserve the services tab
    navigateToMenus("services")
  }

  const handleServiceBackToMenu = () => {
    navigateToMenus(navigationState.activeTab)
  }

  if (menus.length === 0 && navigationState.step !== "services") {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No menus available</p>
      </div>
    )
  }

  return (
    <ErrorBoundary fallback={(props) => <MenuErrorFallback {...props} themeColor={themeColor} />}>
      <div className="w-full">
        {navigationState.step === "menus" && (
          <MenuTabsView
            menus={menus}
            categories={categories}
            items={items}
            onSelectCategory={navigateToCategory}
            onSelectService={handleServiceSelect}
            themeColor={themeColor}
            business={business}
            initialActiveTab={navigationState.activeTab}
            orderCounts={orderCounts}
          />
        )}

        {navigationState.step === "items" && selectedCategory && (
          <ItemsGrid
            category={selectedCategory}
            items={itemsByCategory[selectedCategory.id] || []}
            onBack={handleBack}
            themeColor={themeColor}
            orderCounts={orderCounts}
          />
        )}

        {navigationState.step === "services" && (
          <ServiceFlow
            business={business}
            themeColor={themeColor}
            initialService={navigationState.selectedServiceId ? { id: navigationState.selectedServiceId } : null}
            onBookingComplete={handleServiceBookingComplete}
            onBackToMenu={handleServiceBackToMenu}
          />
        )}
      </div>
    </ErrorBoundary>
  )
}
