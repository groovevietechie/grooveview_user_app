"use client"

import { useState } from "react"
import type { Menu, MenuCategory, MenuItem, Business } from "@/types/database"
import MainCategorySelection from "./menu-flow/MainCategorySelection"
import MenuSelection from "./menu-flow/MenuSelection"
import CategorySelection from "./menu-flow/CategorySelection"
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

type FlowStep = "mainCategories" | "menus" | "categories" | "items" | "services"
type MainCategory = "food" | "drinks" | "services"

export default function MenuList({ business, menus, categories, items, themeColor }: MenuListProps) {
  const [step, setStep] = useState<FlowStep>("mainCategories")
  const [selectedMainCategory, setSelectedMainCategory] = useState<MainCategory | null>(null)
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | null>(null)

  // Group categories by menu
  const categoriesByMenu = categories.reduce(
    (acc, category) => {
      if (!acc[category.menu_id]) {
        acc[category.menu_id] = []
      }
      acc[category.menu_id].push(category)
      return acc
    },
    {} as Record<string, MenuCategory[]>,
  )

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

  // Filter menus based on main category selection
  const getFilteredMenus = (mainCategory: MainCategory) => {
    if (mainCategory === "services") {
      return []
    }
    
    // Filter menus based on name and description keywords
    const keywords = {
      food: ["food", "meal", "eat", "dish", "cuisine", "restaurant", "kitchen", "dining"],
      drinks: ["drink", "beverage", "cocktail", "beer", "wine", "bar", "alcohol", "spirits", "juice"]
    }
    
    const categoryKeywords = keywords[mainCategory] || []
    
    return menus.filter(menu => {
      const menuName = menu.name.toLowerCase()
      const menuDesc = menu.description?.toLowerCase() || ""
      
      // Check if menu name or description contains relevant keywords
      const hasKeyword = categoryKeywords.some(keyword => 
        menuName.includes(keyword) || menuDesc.includes(keyword)
      )
      
      // If no specific keywords found, include all menus for backward compatibility
      // This ensures existing businesses without categorized menus still work
      return hasKeyword || categoryKeywords.length === 0
    })
  }

  const handleMainCategorySelect = (category: MainCategory) => {
    if (selectedMainCategory === category) {
      // If clicking the same category, clear the selection
      setSelectedMainCategory(null)
    } else {
      setSelectedMainCategory(category)
      // Always go to menus step to show the appropriate content
      setStep("menus")
    }
  }

  const handleMenuCategorySelect = (category: MenuCategory) => {
    setSelectedCategory(category)
    // Ensure we have a main category set for proper back navigation
    if (!selectedMainCategory) {
      // Try to determine main category from the menu
      const menu = menus.find(m => m.id === category.menu_id)
      if (menu) {
        const menuName = menu.name.toLowerCase()
        const menuDesc = menu.description?.toLowerCase() || ""
        
        // Determine category based on keywords
        if (["drink", "beverage", "cocktail", "beer", "wine", "bar", "alcohol"].some(keyword => 
          menuName.includes(keyword) || menuDesc.includes(keyword))) {
          setSelectedMainCategory("drinks")
        } else {
          setSelectedMainCategory("food") // Default to food
        }
      }
    }
    setStep("items")
  }

  const handleMenuSelect = (menu: Menu) => {
    setSelectedMenu(menu)
    setSelectedCategory(null)
    setStep("categories")
  }

  const handleCategorySelect = (category: MenuCategory) => {
    setSelectedCategory(category)
    // Ensure we have a main category set for proper back navigation
    if (!selectedMainCategory) {
      // Try to determine main category from the menu
      const menu = menus.find(m => m.id === category.menu_id)
      if (menu) {
        const menuName = menu.name.toLowerCase()
        const menuDesc = menu.description?.toLowerCase() || ""
        
        // Determine category based on keywords
        if (["drink", "beverage", "cocktail", "beer", "wine", "bar", "alcohol"].some(keyword => 
          menuName.includes(keyword) || menuDesc.includes(keyword))) {
          setSelectedMainCategory("drinks")
        } else {
          setSelectedMainCategory("food") // Default to food
        }
      }
    }
    setStep("items")
  }

  const handleBackToMainCategories = () => {
    setSelectedMainCategory(null)
    setSelectedMenu(null)
    setSelectedCategory(null)
    setStep("mainCategories")
  }

  const handleBackToMenus = () => {
    setSelectedMenu(null)
    setSelectedCategory(null)
    setStep("menus")
  }

  const handleBackToCategories = () => {
    setSelectedCategory(null)
    setStep("categories")
  }

  // Function to handle back from items - ALWAYS goes to main categories page
  const handleBackFromItems = () => {
    // Always go back to main categories page (where all menus and categories are displayed)
    handleBackToMainCategories()
  }

  const handleServiceBookingComplete = (bookingId: string) => {
    // Handle successful service booking
    console.log("Service booking completed:", bookingId)
    // You could show a success message or redirect
    handleBackToMainCategories()
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
        {step === "mainCategories" && (
          <MainCategorySelection 
            menus={menus}
            categories={categories}
            items={items}
            onSelectCategory={handleMainCategorySelect}
            onSelectMenuCategory={handleMenuCategorySelect}
            onSelectItem={(item, category) => {
              // When an item is selected from search, navigate directly to the items view
              setSelectedCategory(category)
              setStep("items")
            }}
            themeColor={themeColor}
            isLoading={menus.length === 0 && categories.length === 0}
            selectedMainCategory={selectedMainCategory}
          />
        )}

        {step === "menus" && selectedMainCategory && (
          <MenuSelection 
            menus={getFilteredMenus(selectedMainCategory)} 
            categories={categories}
            items={items}
            onSelectMenu={handleMenuSelect} 
            onSelectItem={(item, category) => {
              // When an item is selected from search, navigate directly to the items view
              setSelectedCategory(category)
              setStep("items")
            }}
            onSelectService={(service) => {
              // When a service is selected, navigate to the service flow
              setStep("services")
            }}
            themeColor={themeColor}
            business={business}
            showServices={selectedMainCategory === "services"}
          />
        )}

        {step === "categories" && selectedMenu && (
          <CategorySelection
            menu={selectedMenu}
            categories={categoriesByMenu[selectedMenu.id] || []}
            onSelectCategory={handleCategorySelect}
            onBack={selectedMainCategory ? handleBackToMainCategories : handleBackToMenus}
            themeColor={themeColor}
          />
        )}

        {step === "items" && selectedCategory && (
          <ItemsGrid
            category={selectedCategory}
            items={itemsByCategory[selectedCategory.id] || []}
            onBack={handleBackFromItems}
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
