"use client"

import type React from "react"

import Image from "next/image"
import { useState } from "react"
import type { MenuItem, SelectedOption } from "@/types/database"
import { useCartStore } from "@/store/cartStore"
import { PlusIcon, MinusIcon, CogIcon } from "@heroicons/react/24/outline"
import { CheckCircleIcon } from "@heroicons/react/24/solid"
import { getContrastColor, lightenColor } from "@/lib/color-utils"
import MenuItemOptionsModal from "./MenuItemOptionsModal"

interface MenuItemCardProps {
  item: MenuItem
  themeColor: string
}

export default function MenuItemCard({ item, themeColor }: MenuItemCardProps) {
  const [quantity, setQuantity] = useState(0)
  const [showOptionsModal, setShowOptionsModal] = useState(false)
  const { addItem, items } = useCartStore()

  const contrastColor = getContrastColor(themeColor)
  const lightBg = lightenColor(themeColor, 96)

  const cartItem = items.find((cartItem) => cartItem.menuItem.id === item.id)
  const currentQuantity = cartItem?.quantity || 0

  // Check if item has options
  const hasOptions = item.option_categories && item.option_categories.length > 0
  const hasRequiredOptions = item.option_categories?.some(cat => cat.is_required) || false

  const handleAddToCart = (quantityToAdd?: number, selectedOptions?: SelectedOption[], note?: string) => {
    const finalQuantity = quantityToAdd || quantity
    if (finalQuantity > 0) {
      addItem(item, finalQuantity, selectedOptions || [], note)
      setQuantity(0)
    }
  }

  const handleQuickAdd = () => {
    if (hasOptions) {
      // If item has any options, open modal
      setShowOptionsModal(true)
    } else {
      // If no options at all, add directly
      handleAddToCart()
    }
  }

  const incrementQuantity = () => setQuantity((prev) => prev + 1)
  const decrementQuantity = () => setQuantity((prev) => Math.max(0, prev - 1))

  return (
    <>
      <div className="menu-card bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 group">
        {item.image_url ? (
          <div className="relative h-40 bg-gradient-to-br from-gray-100 to-gray-50 overflow-hidden">
            <Image
              src={item.image_url || "/placeholder.svg"}
              alt={item.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            <div
              className="absolute top-2 right-2 px-2.5 py-1 rounded-lg backdrop-blur-md font-bold text-xs shadow-md"
              style={{
                backgroundColor: `${themeColor}F0`,
                color: contrastColor,
              }}
            >
              ₦{item.price.toLocaleString()}
            </div>

            {/* Options indicator */}
            {hasOptions && (
              <div
                className="absolute top-2 left-2 p-1.5 rounded-lg backdrop-blur-md shadow-md"
                style={{
                  backgroundColor: `${themeColor}F0`,
                  color: contrastColor,
                }}
                title="Customizable options available"
              >
                <CogIcon className="w-4 h-4" />
              </div>
            )}
          </div>
        ) : (
          <div className="h-40 flex flex-col items-center justify-center" style={{ backgroundColor: lightBg }}>
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mb-2"
              style={{ backgroundColor: `${themeColor}20` }}
            >
              <span className="text-xl">🍽️</span>
            </div>
            <div
              className="px-3 py-1.5 rounded-lg font-bold text-xs"
              style={{
                backgroundColor: `${themeColor}`,
                color: contrastColor,
              }}
            >
              ₦{item.price.toLocaleString()}
            </div>
            {/* Options indicator for no-image items */}
            {hasOptions && (
              <div className="mt-2 flex items-center gap-1 text-xs" style={{ color: themeColor }}>
                <CogIcon className="w-3 h-3" />
                <span>Customizable</span>
              </div>
            )}
          </div>
        )}

        <div className="menu-card-content p-4">
          <div className="mb-3">
            <h4 className="font-bold text-gray-900 text-sm leading-tight mb-1 line-clamp-1">{item.name}</h4>
            {item.description && <p className="text-gray-500 text-xs leading-relaxed line-clamp-2">{item.description}</p>}
            
            {/* Options summary */}
            {hasOptions && (
              <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                <CogIcon className="w-3 h-3" />
                <span>
                  {item.option_categories!.length} option categor{item.option_categories!.length === 1 ? 'y' : 'ies'}
                  {hasRequiredOptions && <span className="text-red-500 ml-1">*</span>}
                </span>
              </div>
            )}
          </div>

          <div className="menu-card-actions space-y-3">
            {/* Quantity selector - always show */}
            <div
              className="flex items-center gap-2 p-2 rounded-lg border-2 transition-all duration-200"
              style={{
                borderColor: quantity > 0 ? themeColor : "#E5E7EB",
                backgroundColor: quantity > 0 ? lightBg : "#F9FAFB",
              }}
            >
              <button
                onClick={decrementQuantity}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
                style={{
                  backgroundColor: quantity > 0 ? themeColor : "#E5E7EB",
                  color: quantity > 0 ? contrastColor : "#9CA3AF",
                }}
                disabled={quantity === 0}
                title="Decrease quantity"
                aria-label="Decrease quantity"
              >
                <MinusIcon className="w-4 h-4" />
              </button>

              <div className="flex-1 text-center">
                <span className="font-bold text-lg text-gray-900">{quantity}</span>
              </div>

              <button
                onClick={incrementQuantity}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
                style={{ backgroundColor: themeColor, color: contrastColor }}
                title="Increase quantity"
                aria-label="Increase quantity"
              >
                <PlusIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Action buttons - show when quantity > 0 */}
            {quantity > 0 && (
              <div className="space-y-2">
                {/* Add to cart button */}
                <button
                  onClick={hasRequiredOptions ? () => setShowOptionsModal(true) : handleQuickAdd}
                  disabled={hasRequiredOptions}
                  style={{
                    backgroundColor: hasRequiredOptions ? "#E5E7EB" : themeColor,
                    color: hasRequiredOptions ? "#9CA3AF" : contrastColor,
                  }}
                  className="w-full font-bold py-2.5 px-3 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:shadow-md disabled:hover:scale-100 disabled:hover:shadow-none text-sm flex items-center justify-center gap-2 disabled:cursor-not-allowed"
                >
                  {hasRequiredOptions 
                    ? "Select Required Options First" 
                    : `Add ${quantity} to Cart`
                  }
                </button>

                {/* Customize options button - only show if item has options and quantity > 0 */}
                {hasOptions && (
                  <button
                    onClick={() => setShowOptionsModal(true)}
                    className="w-full font-bold py-2.5 px-3 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:shadow-md text-sm flex items-center justify-center gap-2 border-2"
                    style={{
                      borderColor: themeColor,
                      backgroundColor: "white",
                      color: themeColor,
                    }}
                  >
                    <CogIcon className="w-4 h-4" />
                    Customize Options
                    {hasRequiredOptions && <span className="text-red-500">*</span>}
                  </button>
                )}
              </div>
            )}

            {currentQuantity > 0 && (
              <div
                className="flex items-center justify-center gap-1 text-xs font-semibold py-1.5 rounded-md"
                style={{
                  backgroundColor: `${themeColor}15`,
                  color: themeColor,
                }}
              >
                <CheckCircleIcon className="w-3.5 h-3.5" />
                {currentQuantity} in cart
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Options Modal */}
      <MenuItemOptionsModal
        isOpen={showOptionsModal}
        onClose={() => setShowOptionsModal(false)}
        item={item}
        themeColor={themeColor}
        onAddToCart={handleAddToCart}
        initialQuantity={quantity}
      />
    </>
  )
}
