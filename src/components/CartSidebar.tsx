'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Business } from '@/types/database'
import { useCartStore } from '@/store/cartStore'
import { XMarkIcon, TrashIcon } from '@heroicons/react/24/outline'
import Image from 'next/image'

interface CartSidebarProps {
  business: Business
  onClose?: () => void
}

export default function CartSidebar({ business, onClose }: CartSidebarProps) {
  const router = useRouter()
  const { items, removeItem, updateQuantity, getTotal, clearCart } = useCartStore()
  const [isProcessing, setIsProcessing] = useState(false)

  const total = getTotal()

  const handleCheckout = () => {
    router.push(`/b/${business.slug}/checkout`)
    onClose?.()
  }

  const handleClearCart = () => {
    if (confirm('Are you sure you want to clear your cart?')) {
      clearCart()
    }
  }

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6 h-fit">
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">Your cart is empty</p>
          <p className="text-sm text-gray-400">Add some items to get started!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border h-fit">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold text-lg">Your Order</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
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
          <div key={cartItem.menuItem.id} className="flex gap-3">
            {/* Item Image */}
            {cartItem.menuItem.image_url && (
              <Image
                src={cartItem.menuItem.image_url}
                alt={cartItem.menuItem.name}
                width={48}
                height={48}
                className="rounded object-cover flex-shrink-0"
              />
            )}

            {/* Item Details */}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm truncate">{cartItem.menuItem.name}</h4>
              <p className="text-sm text-gray-600">₦{cartItem.menuItem.price.toLocaleString()}</p>

              {/* Quantity Controls */}
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => updateQuantity(cartItem.menuItem.id, cartItem.quantity - 1)}
                  className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center text-xs hover:bg-gray-50"
                >
                  -
                </button>
                <span className="text-sm w-6 text-center">{cartItem.quantity}</span>
                <button
                  onClick={() => updateQuantity(cartItem.menuItem.id, cartItem.quantity + 1)}
                  className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center text-xs hover:bg-gray-50"
                >
                  +
                </button>
              </div>

              {/* Special Note */}
              {cartItem.note && (
                <p className="text-xs text-gray-500 mt-1 italic">Note: {cartItem.note}</p>
              )}
            </div>

            {/* Remove Button */}
            <button
              onClick={() => removeItem(cartItem.menuItem.id)}
              className="p-1 text-red-500 hover:bg-red-50 rounded"
              title="Remove item"
              aria-label="Remove item"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t space-y-4">
        {/* Total */}
        <div className="flex justify-between items-center">
          <span className="font-semibold">Total:</span>
          <span className="font-semibold text-lg">₦{total.toLocaleString()}</span>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={handleCheckout}
            disabled={isProcessing}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isProcessing ? 'Processing...' : 'Checkout'}
          </button>

          <button
            onClick={handleClearCart}
            className="w-full text-red-600 py-2 px-4 rounded-md hover:bg-red-50 transition-colors text-sm"
          >
            Clear Cart
          </button>
        </div>
      </div>
    </div>
  )
}