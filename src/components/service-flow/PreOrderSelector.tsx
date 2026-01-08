"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import type { Menu, MenuCategory, MenuItem } from "@/types/database"
import { useServiceStore } from "@/store/serviceStore"
import { getFullMenu } from "@/lib/api"
import { PlusIcon, MinusIcon } from "@heroicons/react/24/outline"

interface PreOrderSelectorProps {
  businessId: string
  themeColor: string
}

export default function PreOrderSelector({ businessId, themeColor }: PreOrderSelectorProps) {
  const {
    preOrderItems,
    addPreOrderItem,
    removePreOrderItem,
    updatePreOrderQuantity
  } = useServiceStore()

  const [menuData, setMenuData] = useState<{
    menus: Menu[]
    categories: MenuCategory[]
    items: MenuItem[]
  }>({ menus: [], categories: [], items: [] })
  const [loading, setLoading] = useState(true)
  const [selectedMainCategory, setSelectedMainCategory] = useState<string>("drinks")
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("all")

  useEffect(() => {
    const loadMenu = async () => {
      try {
        setLoading(true)
        const data = await getFullMenu(businessId)
        setMenuData(data)
      } catch (error) {
        console.error("Error loading menu for pre-order:", error)
      } finally {
        setLoading(false)
      }
    }

    loadMenu()
  }, [businessId])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(price)
  }

  const getItemQuantity = (itemId: string) => {
    const item = preOrderItems.find(preOrderItem => preOrderItem.menuItem.id === itemId)
    return item?.quantity || 0
  }

  const handleAddItem = (item: MenuItem) => {
    addPreOrderItem(item, 1)
  }

  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removePreOrderItem(itemId)
    } else {
      updatePreOrderQuantity(itemId, newQuantity)
    }
  }

  // Categorize menu categories into Food and Drinks based on common naming patterns
  const categorizeMenuCategories = (categories: MenuCategory[]) => {
    const foodKeywords = ['food', 'meal', 'dish', 'main', 'appetizer', 'dessert', 'snack', 'breakfast', 'lunch', 'dinner', 'rice', 'pasta', 'pizza', 'burger', 'sandwich', 'salad', 'soup']
    const drinkKeywords = ['drink', 'beverage', 'juice', 'water', 'soda', 'coffee', 'tea', 'cocktail', 'beer', 'wine', 'smoothie', 'shake', 'latte', 'cappuccino']
    
    const foodCategories: MenuCategory[] = []
    const drinkCategories: MenuCategory[] = []
    const otherCategories: MenuCategory[] = []
    
    categories.forEach(category => {
      const categoryName = category.name.toLowerCase()
      const isFood = foodKeywords.some(keyword => categoryName.includes(keyword))
      const isDrink = drinkKeywords.some(keyword => categoryName.includes(keyword))
      
      if (isFood && !isDrink) {
        foodCategories.push(category)
      } else if (isDrink && !isFood) {
        drinkCategories.push(category)
      } else {
        // If unclear, check items in the category
        const categoryItems = menuData.items.filter(item => item.category_id === category.id)
        const itemNames = categoryItems.map(item => item.name.toLowerCase()).join(' ')
        
        const itemsAreFood = foodKeywords.some(keyword => itemNames.includes(keyword))
        const itemsAreDrinks = drinkKeywords.some(keyword => itemNames.includes(keyword))
        
        if (itemsAreFood && !itemsAreDrinks) {
          foodCategories.push(category)
        } else if (itemsAreDrinks && !itemsAreFood) {
          drinkCategories.push(category)
        } else {
          otherCategories.push(category)
        }
      }
    })
    
    return { foodCategories, drinkCategories }
  }

  // Get unique categories that have items
  const availableCategories = menuData.categories.filter(category =>
    menuData.items.some(item => item.category_id === category.id)
  )

  const { foodCategories, drinkCategories } = categorizeMenuCategories(availableCategories)

  // Get subcategories based on selected main category
  const getSubCategories = () => {
    switch (selectedMainCategory) {
      case "food":
        return foodCategories
      case "drinks":
        return drinkCategories
      default:
        return availableCategories
    }
  }

  const subCategories = getSubCategories()

  // Filter items based on selected categories
  const getFilteredItems = () => {
    if (selectedMainCategory === "food") {
      const foodCategoryIds = foodCategories.map(cat => cat.id)
      if (selectedSubCategory === "all") {
        return menuData.items.filter(item => foodCategoryIds.includes(item.category_id))
      } else {
        return menuData.items.filter(item => item.category_id === selectedSubCategory)
      }
    }
    
    if (selectedMainCategory === "drinks") {
      const drinkCategoryIds = drinkCategories.map(cat => cat.id)
      if (selectedSubCategory === "all") {
        return menuData.items.filter(item => drinkCategoryIds.includes(item.category_id))
      } else {
        return menuData.items.filter(item => item.category_id === selectedSubCategory)
      }
    }
    
    return menuData.items
  }

  const filteredItems = getFilteredItems()

  // Handle main category selection
  const handleMainCategorySelect = (category: string) => {
    setSelectedMainCategory(category)
    setSelectedSubCategory("all") // Reset subcategory when main category changes
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: themeColor }}></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold text-base mb-3" style={{ color: themeColor }}>
          Select Food & Drinks
        </h4>

        {/* Main Category Buttons */}
        <div className="mb-4">
          <div className="flex gap-2 justify-center">
            {drinkCategories.length > 0 && (
              <button
                type="button"
                onClick={() => handleMainCategorySelect("drinks")}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  selectedMainCategory === "drinks"
                    ? 'text-white shadow-md'
                    : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                }`}
                style={selectedMainCategory === "drinks" ? { backgroundColor: themeColor } : {}}
              >
                Drinks
              </button>
            )}
            {foodCategories.length > 0 && (
              <button
                type="button"
                onClick={() => handleMainCategorySelect("food")}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  selectedMainCategory === "food"
                    ? 'text-white shadow-md'
                    : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                }`}
                style={selectedMainCategory === "food" ? { backgroundColor: themeColor } : {}}
              >
                Food
              </button>
            )}
          </div>
        </div>

        {/* Subcategory Carousel */}
        {(selectedMainCategory === "food" || selectedMainCategory === "drinks") && subCategories.length > 1 && (
          <div className="mb-4">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
              <button
                type="button"
                onClick={() => setSelectedSubCategory("all")}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selectedSubCategory === "all"
                    ? 'text-white shadow-sm'
                    : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                }`}
                style={selectedSubCategory === "all" ? { backgroundColor: themeColor } : {}}
              >
                All {selectedMainCategory === "food" ? "Food" : "Drinks"}
              </button>
              {subCategories.map((category) => (
                <button
                  type="button"
                  key={category.id}
                  onClick={() => setSelectedSubCategory(category.id)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                    selectedSubCategory === category.id
                      ? 'text-white shadow-sm'
                      : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                  }`}
                  style={selectedSubCategory === category.id ? { backgroundColor: themeColor } : {}}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Items Carousel */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-gray-500 text-sm">No items available in this category</p>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-3 pb-3" style={{ width: 'max-content' }}>
              {filteredItems.map((item) => {
                const quantity = getItemQuantity(item.id)
                const category = menuData.categories.find(cat => cat.id === item.category_id)

                return (
                  <div
                    key={item.id}
                    className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all flex-shrink-0"
                    style={{ width: '240px' }}
                  >
                    {/* Item Image */}
                    {item.image_url ? (
                      <div className="relative h-24 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50">
                        <Image
                          src={item.image_url}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div
                        className="h-24 flex items-center justify-center"
                        style={{ backgroundColor: `${themeColor}10` }}
                      >
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: `${themeColor}20` }}
                        >
                          <span className="text-sm font-bold" style={{ color: themeColor }}>
                            {item.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Item Details */}
                    <div className="p-3">
                      <div className="mb-2">
                        <h5 className="font-semibold text-gray-900 text-xs leading-tight line-clamp-1">
                          {item.name}
                        </h5>
                        {category && (
                          <p className="text-xs text-gray-500 mt-0.5">{category.name}</p>
                        )}
                        <p className="text-xs font-bold mt-1" style={{ color: themeColor }}>
                          {formatPrice(item.price)}
                        </p>
                      </div>

                      {item.description && (
                        <p className="text-gray-600 text-xs mb-2 line-clamp-1">
                          {item.description}
                        </p>
                      )}

                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Per person</span>

                        {quantity > 0 ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(item.id, quantity - 1)}
                              className="w-5 h-5 rounded-full flex items-center justify-center border hover:bg-gray-50 transition-colors"
                              style={{ borderColor: themeColor, color: themeColor }}
                            >
                              <MinusIcon className="w-2.5 h-2.5" />
                            </button>
                            <span className="font-semibold text-xs min-w-[1rem] text-center">
                              {quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(item.id, quantity + 1)}
                              className="w-5 h-5 rounded-full flex items-center justify-center text-white transition-colors"
                              style={{ backgroundColor: themeColor }}
                            >
                              <PlusIcon className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAddItem(item)}
                            className="px-2.5 py-1 rounded-full text-white font-medium text-xs transition-all hover:shadow-sm active:scale-95"
                            style={{ backgroundColor: themeColor }}
                          >
                            Add
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}