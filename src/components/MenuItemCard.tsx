"use client"

import type React from "react"

import Image from "next/image"
import { useState } from "react"
import type { MenuItem } from "@/types/database"
import { useCartStore } from "@/store/cartStore"
import { PlusIcon, MinusIcon, ChatBubbleLeftIcon } from "@heroicons/react/24/outline"
import { CheckCircleIcon } from "@heroicons/react/24/solid"
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
  const lightBg = lightenColor(themeColor, 96)

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
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 border border-gray-200 group">
      {item.image_url ? (
        <div className="relative h-52 bg-gradient-to-br from-gray-100 to-gray-50 overflow-hidden">
          <Image
            src={item.image_url || "/placeholder.svg"}
            alt={item.name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

          <div
            className="absolute top-3 right-3 px-3 py-1.5 rounded-full backdrop-blur-md font-bold text-sm shadow-lg"
            style={{
              backgroundColor: `${themeColor}F0`,
              color: contrastColor,
            }}
          >
            ₦{item.price.toLocaleString()}
          </div>
        </div>
      ) : (
        <div className="h-52 flex flex-col items-center justify-center" style={{ backgroundColor: lightBg }}>
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-3"
            style={{ backgroundColor: `${themeColor}20` }}
          >
            <span className="text-2xl">🍽️</span>
          </div>
          <div
            className="px-4 py-2 rounded-full font-bold text-sm"
            style={{
              backgroundColor: `${themeColor}`,
              color: contrastColor,
            }}
          >
            ₦{item.price.toLocaleString()}
          </div>
        </div>
      )}

      <div className="p-5">
        <div className="mb-4">
          <h4 className="font-bold text-gray-900 text-lg leading-tight mb-2">{item.name}</h4>
          {item.description && <p className="text-gray-500 text-sm leading-relaxed line-clamp-2">{item.description}</p>}
        </div>

        <div
          className="flex items-center gap-2 mb-4 p-2.5 rounded-xl border-2 transition-all duration-200"
          style={{
            borderColor: quantity > 0 ? themeColor : "#E5E7EB",
            backgroundColor: quantity > 0 ? lightBg : "#F9FAFB",
          }}
        >
          <button
            onClick={decrementQuantity}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
            style={{
              backgroundColor: quantity > 0 ? themeColor : "#E5E7EB",
              color: quantity > 0 ? contrastColor : "#9CA3AF",
            }}
            disabled={quantity === 0}
            title="Decrease quantity"
            aria-label="Decrease quantity"
          >
            <MinusIcon className="w-5 h-5" />
          </button>

          <div className="flex-1 text-center">
            <span className="font-bold text-xl text-gray-900">{quantity}</span>
          </div>

          <button
            onClick={incrementQuantity}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
            style={{ backgroundColor: themeColor, color: contrastColor }}
            title="Increase quantity"
            aria-label="Increase quantity"
          >
            <PlusIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4">
          <button
            onClick={() => setShowNote(!showNote)}
            className="flex items-center gap-1.5 text-sm font-semibold transition-all duration-200 hover:gap-2"
            style={{ color: themeColor }}
          >
            <ChatBubbleLeftIcon className="w-4 h-4" />
            {showNote ? "Hide" : "Add"} special instructions
          </button>
          {showNote && (
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Any special requests? (Optional)"
              className="w-full mt-3 p-3 border-2 rounded-xl text-sm resize-none focus:outline-none focus:ring-4 transition-all duration-200"
              style={
                {
                  borderColor: note ? themeColor : "#E5E7EB",
                  "--tw-ring-color": `${themeColor}40`,
                } as React.CSSProperties
              }
              rows={3}
              maxLength={200}
            />
          )}
        </div>

        <button
          onClick={handleAddToCart}
          disabled={quantity === 0}
          style={{
            backgroundColor: quantity === 0 ? "#E5E7EB" : themeColor,
            color: quantity === 0 ? "#9CA3AF" : contrastColor,
          }}
          className="w-full font-bold py-3.5 px-4 rounded-xl disabled:cursor-not-allowed transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg disabled:hover:scale-100 disabled:hover:shadow-none"
        >
          {quantity === 0 ? "Select Quantity" : `Add ${quantity} to Cart`}
        </button>

        {currentQuantity > 0 && (
          <div
            className="mt-3 flex items-center justify-center gap-1.5 text-sm font-semibold py-2 rounded-lg"
            style={{
              backgroundColor: `${themeColor}15`,
              color: themeColor,
            }}
          >
            <CheckCircleIcon className="w-4 h-4" />
            {currentQuantity} in cart
          </div>
        )}
      </div>
    </div>
  )
}
