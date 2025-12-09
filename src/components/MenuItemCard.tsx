"use client"

import type React from "react"

import Image from "next/image"
import { useState } from "react"
import type { MenuItem } from "@/types/database"
import { useCartStore } from "@/store/cartStore"
import { PlusIcon, MinusIcon } from "@heroicons/react/24/outline"
import { getContrastColor, lightenColor } from "@/lib/color-utils"

interface MenuItemCardProps {
  item: MenuItem
  themeColor: string
}

export default function MenuItemCard({ item, themeColor }: MenuItemCardProps) {
  const [quantity, setQuantity] = useState(0)
  const [note, setNote] = useState("")
  const [showNote, setShowNote] = useState(false)
  const { addItem, items } = useCartStore()

  const contrastColor = getContrastColor(themeColor)
  const lightBg = lightenColor(themeColor, 95)

  // Check if item is already in cart
  const cartItem = items.find((cartItem) => cartItem.menuItem.id === item.id)
  const currentQuantity = cartItem?.quantity || 0

  const handleAddToCart = () => {
    if (quantity > 0) {
      addItem(item, quantity, note.trim() || undefined)
      setQuantity(0)
      setNote("")
      setShowNote(false)
    }
  }

  const incrementQuantity = () => setQuantity((prev) => prev + 1)
  const decrementQuantity = () => setQuantity((prev) => Math.max(0, prev - 1))

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow border border-gray-200">
      {/* Item Image */}
      {item.image_url && (
        <div className="relative h-48 bg-gray-100">
          <Image
            src={item.image_url || "/placeholder.svg"}
            alt={item.name}
            fill
            className="object-cover hover:scale-105 transition-transform duration-200"
          />
        </div>
      )}

      <div className="p-4">
        {/* Item Info */}
        <div className="mb-4">
          <h4 className="font-bold text-gray-900 text-base leading-tight">{item.name}</h4>
          {item.description && <p className="text-gray-600 text-xs mt-2 line-clamp-2">{item.description}</p>}
          <div className="mt-3 text-lg font-bold" style={{ color: themeColor }}>
            ₦{item.price.toLocaleString()}
          </div>
        </div>

        {/* Quantity Selector */}
        <div
          className="flex items-center gap-1 mb-4 p-2 rounded-lg border-2"
          style={{ borderColor: lightBg, backgroundColor: lightBg }}
        >
          <button
            onClick={decrementQuantity}
            className="w-7 h-7 rounded-full flex items-center justify-center hover:opacity-70 disabled:opacity-50 transition-opacity"
            style={{ backgroundColor: themeColor, color: contrastColor }}
            disabled={quantity === 0}
            title="Decrease quantity"
            aria-label="Decrease quantity"
          >
            <MinusIcon className="w-4 h-4" />
          </button>

          <span className="flex-1 text-center font-semibold text-gray-900">{quantity}</span>

          <button
            onClick={incrementQuantity}
            className="w-7 h-7 rounded-full flex items-center justify-center hover:opacity-70 transition-opacity"
            style={{ backgroundColor: themeColor, color: contrastColor }}
            title="Increase quantity"
            aria-label="Increase quantity"
          >
            <PlusIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Special Instructions */}
        <div className="mb-3">
          <button
            onClick={() => setShowNote(!showNote)}
            className="text-xs font-medium transition-opacity hover:opacity-70"
            style={{ color: themeColor }}
          >
            {showNote ? "✕ Hide" : "+ Add"} special instructions
          </button>
          {showNote && (
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Any special requests..."
              className="w-full mt-2 p-2 border rounded-md text-xs resize-none focus:outline-none focus:ring-2"
              style={{ "--tw-ring-color": themeColor } as React.CSSProperties}
              rows={2}
              maxLength={200}
            />
          )}
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          disabled={quantity === 0}
          style={{
            backgroundColor: quantity === 0 ? "#D1D5DB" : themeColor,
            color: quantity === 0 ? "#6B7280" : contrastColor,
          }}
          className="w-full font-semibold py-2 px-4 rounded-lg disabled:cursor-not-allowed transition-opacity hover:opacity-90"
        >
          Add to Cart {quantity > 0 && `(${quantity})`}
        </button>

        {/* Current cart quantity indicator */}
        {currentQuantity > 0 && (
          <p className="text-xs font-medium mt-2 text-center" style={{ color: themeColor }}>
            ✓ {currentQuantity} in cart
          </p>
        )}
      </div>
    </div>
  )
}
