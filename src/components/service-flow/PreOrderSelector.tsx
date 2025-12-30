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
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

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

  // Filter items based on selected category
  const filteredItems = selectedCategory === "all"
    ? menuData.items
    : menuData.items.filter(item => item.category_id === selectedCategory)

  // Get unique categories that have items
  const availableCategories = menuData.categories.filter(category =>
    menuData.items.some(item => item.category_id === category.id)
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: themeColor }}></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h4 className="font-semibold text-lg mb-4" style={{ color: themeColor }}>
          Select Food & Drinks
        </h4>

        {/* Category Filter */}
        {availableCategories.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === "all"
                  ? 'text-white shadow-md'
                  : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
              }`}
              style={selectedCategory === "all" ? { backgroundColor: themeColor } : {}}
            >
              All Items
            </button>
            {availableCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === category.id
                    ? 'text-white shadow-md'
                    : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                }`}
                style={selectedCategory === category.id ? { backgroundColor: themeColor } : {}}
              >
                {category.name}
              </button>
            ))}
          </div>
        )}

        {/* Items Grid */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">No items available in this category</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredItems.map((item) => {
              const quantity = getItemQuantity(item.id)
              const category = menuData.categories.find(cat => cat.id === item.category_id)

              return (
                <div
                  key={item.id}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all"
                >
                  {/* Item Image */}
                  {item.image_url ? (
                    <div className="relative h-32 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50">
                      <Image
                        src={item.image_url}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div
                      className="h-32 flex items-center justify-center"
                      style={{ backgroundColor: `${themeColor}10` }}
                    >
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${themeColor}20` }}
                      >
                        <span className="text-lg font-bold" style={{ color: themeColor }}>
                          {item.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Item Details */}
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h5 className="font-semibold text-gray-900 text-sm leading-tight">
                          {item.name}
                        </h5>
                        {category && (
                          <p className="text-xs text-gray-500 mt-1">{category.name}</p>
                        )}
                        <p className="text-sm font-bold mt-1" style={{ color: themeColor }}>
                          {formatPrice(item.price)}
                        </p>
                      </div>
                    </div>

                    {item.description && (
                      <p className="text-gray-600 text-xs mb-3 line-clamp-2">
                        {item.description}
                      </p>
                    )}

                    {/* Quantity Controls */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Per person</span>

                      {quantity > 0 ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleUpdateQuantity(item.id, quantity - 1)}
                            className="w-6 h-6 rounded-full flex items-center justify-center border hover:bg-gray-50 transition-colors"
                            style={{ borderColor: themeColor, color: themeColor }}
                          >
                            <MinusIcon className="w-3 h-3" />
                          </button>
                          <span className="font-semibold text-sm min-w-[1.5rem] text-center">
                            {quantity}
                          </span>
                          <button
                            onClick={() => handleUpdateQuantity(item.id, quantity + 1)}
                            className="w-6 h-6 rounded-full flex items-center justify-center text-white transition-colors"
                            style={{ backgroundColor: themeColor }}
                          >
                            <PlusIcon className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAddItem(item)}
                          className="px-3 py-1 rounded-full text-white font-medium text-xs transition-all hover:shadow-md active:scale-95"
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
        )}
      </div>
    </div>
  )
}