'use client'

import Image from 'next/image'
import { useState } from 'react'
import { MenuItem } from '@/types/database'
import { useCartStore } from '@/store/cartStore'
import { useTheme } from '@/contexts/ThemeContext'
import { PlusIcon, MinusIcon } from '@heroicons/react/24/outline'

interface MenuItemCardProps {
  item: MenuItem
}

export default function MenuItemCard({ item }: MenuItemCardProps) {
  const [quantity, setQuantity] = useState(0)
  const [note, setNote] = useState('')
  const [showNote, setShowNote] = useState(false)
  const { addItem, items } = useCartStore()
  const { primaryColor } = useTheme()

  // Check if item is already in cart
  const cartItem = items.find(cartItem => cartItem.menuItem.id === item.id)
  const currentQuantity = cartItem?.quantity || 0

  const handleAddToCart = () => {
    if (quantity > 0) {
      addItem(item, quantity, note.trim() || undefined)
      setQuantity(0)
      setNote('')
      setShowNote(false)
    }
  }

  const incrementQuantity = () => setQuantity(prev => prev + 1)
  const decrementQuantity = () => setQuantity(prev => Math.max(0, prev - 1))

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
      {/* Item Image */}
      {item.image_url && (
        <div className="relative h-48">
          <Image
            src={item.image_url}
            alt={item.name}
            fill
            className="object-cover"
          />
        </div>
      )}

      <div className="p-4">
        {/* Item Info */}
        <div className="mb-3">
          <h4 className="font-medium text-gray-900 text-lg">{item.name}</h4>
          {item.description && (
            <p className="text-gray-600 text-sm mt-1">{item.description}</p>
          )}
          <p className="text-lg font-semibold text-gray-900 mt-2">
            ₦{item.price.toLocaleString()}
          </p>
        </div>

        {/* Quantity Selector */}
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={decrementQuantity}
            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
            disabled={quantity === 0}
            title="Decrease quantity"
            aria-label="Decrease quantity"
          >
            <MinusIcon className="w-4 h-4" />
          </button>

          <span className="w-8 text-center font-medium">{quantity}</span>

          <button
            onClick={incrementQuantity}
            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
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
            style={{ color: primaryColor }}
            className="text-sm font-medium"
          >
            {showNote ? 'Hide' : 'Add'} special instructions
          </button>
          {showNote && (
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Any special requests..."
              className="w-full mt-2 p-2 border border-gray-300 rounded-md text-sm resize-none"
              rows={2}
              maxLength={200}
            />
          )}
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          disabled={quantity === 0}
          style={quantity === 0 ? {} : { backgroundColor: primaryColor }}
          className="w-full text-white py-2 px-4 rounded-md disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          Add to Cart {quantity > 0 && `(${quantity})`}
        </button>

        {/* Current cart quantity indicator */}
        {currentQuantity > 0 && (
          <p className="text-sm text-green-600 mt-2 text-center">
            {currentQuantity} in cart
          </p>
        )}
      </div>
    </div>
  )
}