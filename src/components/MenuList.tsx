"use client"

import { useState } from "react"
import type { Menu, MenuCategory, MenuItem } from "@/types/database"
import MenuSelection from "./menu-flow/MenuSelection"
import CategorySelection from "./menu-flow/CategorySelection"
import ItemsGrid from "./menu-flow/ItemsGrid"

interface MenuListProps {
  menus: Menu[]
  categories: MenuCategory[]
  items: MenuItem[]
  themeColor: string
}

type FlowStep = "menus" | "categories" | "items"

export default function MenuList({ menus, categories, items, themeColor }: MenuListProps) {
  const [step, setStep] = useState<FlowStep>("menus")
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

  const handleMenuSelect = (menu: Menu) => {
    setSelectedMenu(menu)
    setSelectedCategory(null)
    setStep("categories")
  }

  const handleCategorySelect = (category: MenuCategory) => {
    setSelectedCategory(category)
    setStep("items")
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

  if (menus.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No menus available</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      {step === "menus" && <MenuSelection menus={menus} onSelectMenu={handleMenuSelect} themeColor={themeColor} />}

      {step === "categories" && selectedMenu && (
        <CategorySelection
          menu={selectedMenu}
          categories={categoriesByMenu[selectedMenu.id] || []}
          onSelectCategory={handleCategorySelect}
          onBack={handleBackToMenus}
          themeColor={themeColor}
        />
      )}

      {step === "items" && selectedCategory && (
        <ItemsGrid
          category={selectedCategory}
          items={itemsByCategory[selectedCategory.id] || []}
          onBack={handleBackToCategories}
          themeColor={themeColor}
        />
      )}
    </div>
  )
}
