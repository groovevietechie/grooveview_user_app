"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { Business } from "@/types/database"
import { useCartStore } from "@/store/cartStore"
import { XMarkIcon, TrashIcon, ShoppingBagIcon } from "@heroicons/react/24/outline"
import Image from "next/image"

interface CartSidebarProps {
  business: Business
  onClose?: () => void
}

export default function CartSidebar({ business, onClose }: CartSidebarProps) {
  const router = useRouter()
  const { items, removeItem, updateQuantity, getTotal, clearCart } = useCartStore()
  const [isProcessing] = useState(false)

  const total = getTotal()

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
      <div className="lounge-cart rounded-2xl shadow-lg border border-amber-400/30 p-6 h-fit animate-slide-in bg-gradient-to-br from-slate-900 via-blue-950 to-black">
        <div className="text-center py-8">
          <ShoppingBagIcon className="w-12 h-12 mx-auto mb-4 opacity-50 text-amber-400" />
          <p className="mb-4 font-medium text-amber-50">
            Your cart is empty
          </p>
          <p className="text-sm text-amber-200/70">
            Add some items to get started!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="lounge-cart rounded-2xl shadow-lg border border-amber-400/30 h-fit overflow-hidden animate-slide-in bg-gradient-to-br from-slate-900 via-blue-950 to-black">
      {/* Header */}
      <div className="p-4 flex items-center justify-between bg-gradient-to-r from-amber-400 to-amber-500">
        <h3 className="font-semibold text-lg text-slate-900">
          Your Order
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:opacity-75 rounded transition-opacity text-slate-900"
            title="Close cart"
            aria-label="Close cart"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Cart Items */}
      <div className="max-h-96 overflow-y-auto p-4 space-y-4 bg-slate-800/50">
        {items.map((cartItem) => (
          <div key={cartItem.menuItem.id} className="flex gap-3 bg-slate-700/60 p-3 rounded-lg border border-amber-400/20">
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
              <h4 className="font-medium text-sm text-amber-50 truncate">{cartItem.menuItem.name}</h4>
              <p className="text-sm font-semibold text-amber-400">
                ₦{cartItem.menuItem.price.toLocaleString()}
              </p>

              {/* Quantity Controls */}
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => updateQuantity(cartItem.menuItem.id, cartItem.quantity - 1)}
                  className="w-6 h-6 rounded border border-amber-400/40 flex items-center justify-center text-xs hover:opacity-75 font-semibold text-amber-400"
                >
                  -
                </button>
                <span className="text-sm w-6 text-center font-semibold text-amber-50">{cartItem.quantity}</span>
                <button
                  onClick={() => updateQuantity(cartItem.menuItem.id, cartItem.quantity + 1)}
                  className="w-6 h-6 rounded border border-amber-400/40 flex items-center justify-center text-xs hover:opacity-75 font-semibold text-amber-400"
                >
                  +
                </button>
              </div>

              {/* Special Note */}
              {cartItem.note && <p className="text-xs text-amber-200/70 mt-1 italic">Note: {cartItem.note}</p>}
            </div>

            {/* Remove Button */}
            <button
              onClick={() => removeItem(cartItem.menuItem.id)}
              className="p-1 text-red-400 hover:bg-red-500/20 rounded transition-colors"
              title="Remove item"
              aria-label="Remove item"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 bg-slate-800/80 space-y-4 border-t border-amber-400/20">
        {/* Total */}
        <div className="flex justify-between items-center border-t border-amber-400/20 pt-4">
          <span className="font-semibold text-amber-50">
            Total:
          </span>
          <span className="font-bold text-lg text-amber-400">
            ₦{total.toLocaleString()}
          </span>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={handleCheckout}
            disabled={isProcessing}
            className="w-full py-3 px-4 rounded-md disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors font-semibold text-base bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-900 shadow-lg hover:shadow-amber-500/50"
          >
            {isProcessing ? "Processing..." : "Checkout"}
          </button>

          <button
            onClick={handleClearCart}
            className="w-full py-2 px-4 rounded-md border border-amber-400/40 hover:bg-amber-400/10 transition-colors text-sm font-medium text-amber-300"
          >
            Clear Cart
          </button>
        </div>
      </div>
    </div>
  )
}
