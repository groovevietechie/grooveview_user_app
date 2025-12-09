"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { Business } from "@/types/database"
import { useCartStore } from "@/store/cartStore"
import { useTheme } from "@/contexts/ThemeContext"
import { getContrastColor, lightenColor } from "@/lib/color-utils"
import { XMarkIcon, TrashIcon, ShoppingBagIcon } from "@heroicons/react/24/outline"
import Image from "next/image"

interface CartSidebarProps {
  business: Business
  onClose?: () => void
}

export default function CartSidebar({ business, onClose }: CartSidebarProps) {
  const router = useRouter()
  const { items, removeItem, updateQuantity, getTotal, clearCart } = useCartStore()
  const { primaryColor } = useTheme()
  const [isProcessing] = useState(false)

  const total = getTotal()
  const textColor = getContrastColor(primaryColor)
  const lightBg = lightenColor(primaryColor, 90)

  const handleCheckout = () => {
    router.push(`/b/${business.slug}/checkout`)
    onClose?.()
  }

  const handleClearCart = () => {
    if (confirm("Are you sure you want to clear your cart?")) {
      clearCart()
    }
  }

  if (items.length === 0) {
    return (
      <div style={{ backgroundColor: lightBg }} className="rounded-2xl shadow-lg border p-6 h-fit animate-slide-in">
        <div className="text-center py-8">
          <ShoppingBagIcon style={{ color: primaryColor }} className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p style={{ color: textColor }} className="mb-4 font-medium">
            Your cart is empty
          </p>
          <p style={{ color: textColor, opacity: 0.7 }} className="text-sm">
            Add some items to get started!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{ backgroundColor: lightBg }}
      className="rounded-2xl shadow-lg border h-fit overflow-hidden animate-slide-in"
    >
      {/* Header */}
      <div style={{ backgroundColor: primaryColor }} className="p-4 flex items-center justify-between">
        <h3 style={{ color: textColor }} className="font-semibold text-lg">
          Your Order
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            style={{ color: textColor }}
            className="p-1 hover:opacity-75 rounded transition-opacity"
            title="Close cart"
            aria-label="Close cart"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Cart Items */}
      <div className="max-h-96 overflow-y-auto p-4 space-y-4">
        {items.map((cartItem) => (
          <div key={cartItem.menuItem.id} className="flex gap-3 bg-white p-3 rounded-lg">
            {/* Item Image */}
            {cartItem.menuItem.image_url && (
              <Image
                src={cartItem.menuItem.image_url || "/placeholder.svg"}
                alt={cartItem.menuItem.name}
                width={48}
                height={48}
                className="rounded object-cover flex-shrink-0"
              />
            )}

            {/* Item Details */}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm text-gray-900 truncate">{cartItem.menuItem.name}</h4>
              <p style={{ color: primaryColor }} className="text-sm font-semibold">
                ₦{cartItem.menuItem.price.toLocaleString()}
              </p>

              {/* Quantity Controls */}
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => updateQuantity(cartItem.menuItem.id, cartItem.quantity - 1)}
                  style={{ borderColor: primaryColor, color: primaryColor }}
                  className="w-6 h-6 rounded border flex items-center justify-center text-xs hover:opacity-75 font-semibold"
                >
                  -
                </button>
                <span className="text-sm w-6 text-center font-semibold text-gray-900">{cartItem.quantity}</span>
                <button
                  onClick={() => updateQuantity(cartItem.menuItem.id, cartItem.quantity + 1)}
                  style={{ borderColor: primaryColor, color: primaryColor }}
                  className="w-6 h-6 rounded border flex items-center justify-center text-xs hover:opacity-75 font-semibold"
                >
                  +
                </button>
              </div>

              {/* Special Note */}
              {cartItem.note && <p className="text-xs text-gray-600 mt-1 italic">Note: {cartItem.note}</p>}
            </div>

            {/* Remove Button */}
            <button
              onClick={() => removeItem(cartItem.menuItem.id)}
              className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Remove item"
              aria-label="Remove item"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 bg-white space-y-4">
        {/* Total */}
        <div className="flex justify-between items-center border-t pt-4">
          <span style={{ color: textColor }} className="font-semibold">
            Total:
          </span>
          <span style={{ color: primaryColor }} className="font-bold text-lg">
            ₦{total.toLocaleString()}
          </span>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={handleCheckout}
            disabled={isProcessing}
            style={isProcessing ? {} : { backgroundColor: primaryColor, color: textColor }}
            className="w-full py-3 px-4 rounded-md disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-semibold text-base"
          >
            {isProcessing ? "Processing..." : "Checkout"}
          </button>

          <button
            onClick={handleClearCart}
            style={{ color: primaryColor, borderColor: primaryColor }}
            className="w-full py-2 px-4 rounded-md border hover:opacity-75 transition-opacity text-sm font-medium"
          >
            Clear Cart
          </button>
        </div>
      </div>
    </div>
  )
}
