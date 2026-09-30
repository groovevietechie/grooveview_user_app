"use client"

import type React from "react"
import Image from "next/image"
import { useState } from "react"
import type { MenuItem, SelectedOption } from "@/types/database"
import { useCartStore } from "@/store/cartStore"
import { PlusIcon, MinusIcon, CogIcon } from "@heroicons/react/24/outline"
import { getContrastColor, lightenColor } from "@/lib/color-utils"
import MenuItemOptionsModal from "./MenuItemOptionsModal"

interface MenuItemCardProps {
  item: MenuItem
  themeColor: string
  orderCount?: number
}

export default function MenuItemCard({ item, themeColor, orderCount = 0 }: MenuItemCardProps) {
  const [quantity, setQuantity] = useState(0)
  const [showOptionsModal, setShowOptionsModal] = useState(false)
  const { addItem } = useCartStore()

  const contrastColor = getContrastColor(themeColor)
  const lightBg = lightenColor(themeColor, 96)

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

  const handleAddClick = () => {
    if (quantity > 0) {
      if (hasRequiredOptions) {
        setShowOptionsModal(true)
      } else if (hasOptions) {
        setShowOptionsModal(true)
      } else {
        handleAddToCart()
      }
    }
  }

  const incrementQuantity = () => setQuantity((prev) => prev + 1)
  const decrementQuantity = () => setQuantity((prev) => Math.max(0, prev - 1))

  return (
    <>
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-black rounded-3xl overflow-hidden shadow-2xl hover:shadow-[0_20px_40px_rgba(191,144,0,0.3)] transition-all duration-500 border border-blue-900/50 group h-full flex flex-col relative">
        {/* Futuristic top accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-amber-300 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

        {/* Image Section */}
        {item.image_url ? (
          <div className="relative h-48 bg-gradient-to-br from-slate-800 to-blue-950 overflow-hidden flex-shrink-0">
            <Image
              src={item.image_url || "/placeholder.svg"}
              alt={item.name}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-300"
            />
            {/* Enhanced gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-blue-950/40 to-transparent"></div>
            
            {/* Subtle corner accent */}
            <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-tl from-amber-400/20 to-transparent blur-2xl"></div>

            {/* Price Badge - Top Left */}
            <div
              className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg backdrop-blur-lg font-bold text-xs shadow-lg border border-amber-300/30"
              style={{
                background: 'linear-gradient(135deg, #191e3f 0%, #2d3561 100%)',
                color: '#fbbf24',
              }}
            >
              ₦{item.price.toLocaleString()}
            </div>

            {/* Order Count Badge - Top Right */}
            {orderCount > 0 && (
              <div 
                className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-lg backdrop-blur-lg font-bold text-xs shadow-lg border border-amber-300/30"
                style={{
                  background: 'linear-gradient(135deg, #191e3f 0%, #2d3561 100%)',
                  color: '#fbbf24',
                }}
              >
                {orderCount} {orderCount === 1 ? 'O' : 'O'}
              </div>
            )}

            {/* Title & Description - Bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <h4 className="text-white font-bold text-base leading-tight">{item.name}</h4>
              {item.description && (
                <p className="text-white/70 text-xs mt-0.5 line-clamp-1">{item.description}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="h-48 flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-blue-950 flex-shrink-0 relative">
            <div className="text-5xl mb-3">🍽️</div>
            <h4 className="text-white font-bold text-sm text-center mb-2 px-2">{item.name}</h4>
            <div
              className="px-2.5 py-1 rounded-lg font-bold text-xs border border-amber-300/30"
              style={{
                background: 'linear-gradient(135deg, #191e3f 0%, #2d3561 100%)',
                color: '#fbbf24',
              }}
            >
              ₦{item.price.toLocaleString()}
            </div>

            {orderCount > 0 && (
              <div 
                className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-lg font-bold text-xs border border-amber-300/30"
                style={{
                  background: 'linear-gradient(135deg, #191e3f 0%, #2d3561 100%)',
                  color: '#fbbf24',
                }}
              >
                {orderCount} O
              </div>
            )}
          </div>
        )}

        {/* Content Section */}
        <div className="flex-1 flex flex-col p-3 gap-2.5">
          {/* Options indicator */}
          {hasOptions && (
            <div 
              className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-md border border-amber-300/20"
              style={{ 
                color: '#fbbf24',
                background: 'linear-gradient(135deg, rgba(25, 30, 63, 0.8) 0%, rgba(45, 53, 97, 0.8) 100%)',
              }}
            >
              <CogIcon className="w-3 h-3" />
              <span className="text-xs">{hasRequiredOptions ? 'Custom' : 'Options'}</span>
            </div>
          )}

          {/* Quantity Control - Compact Version */}
          <div
            className="flex items-center gap-1.5 p-2 rounded-lg border transition-all duration-200 bg-gradient-to-r"
            style={{
              borderColor: quantity > 0 ? '#fbbf24' : '#3b4563',
              background: quantity > 0 
                ? 'linear-gradient(135deg, rgba(191, 144, 0, 0.15) 0%, rgba(191, 144, 0, 0.08) 100%)'
                : 'linear-gradient(135deg, rgba(25, 30, 63, 0.6) 0%, rgba(45, 53, 97, 0.6) 100%)',
            }}
          >
            <button
              onClick={decrementQuantity}
              className="w-6 h-6 rounded-md flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 text-xs font-bold"
              style={{
                backgroundColor: quantity > 0 ? '#fbbf24' : '#3b4563',
                color: quantity > 0 ? '#0f172a' : '#9ca3af',
              }}
              disabled={quantity === 0}
              title="Decrease quantity"
              aria-label="Decrease quantity"
            >
              <MinusIcon className="w-3 h-3" />
            </button>

            <div className="flex-1 text-center">
              <span className="font-bold text-sm text-amber-300" style={{ color: quantity > 0 ? '#fbbf24' : '#9ca3af' }}>{quantity}</span>
            </div>

            <button
              onClick={incrementQuantity}
              className="w-6 h-6 rounded-md flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 text-xs font-bold text-slate-900"
              style={{ backgroundColor: '#fbbf24' }}
              title="Increase quantity"
              aria-label="Increase quantity"
            >
              <PlusIcon className="w-3 h-3" />
            </button>
          </div>

          {/* Add to Cart Button - Compact Version */}
          {quantity > 0 && (
            <button
              onClick={handleAddClick}
              style={{
                background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                color: '#0f172a',
              }}
              className="w-full font-bold py-2 px-3 rounded-lg transition-all duration-200 hover:shadow-[0_8px_20px_rgba(191,144,0,0.4)] active:scale-[0.98] text-xs flex items-center justify-center gap-1.5"
            >
              Add {quantity}
              {hasOptions && <CogIcon className="w-3 h-3" />}
            </button>
          )}

          {/* Empty State */}
          {quantity === 0 && (
            <p className="text-white/30 text-xs text-center py-1.5">+ to add</p>
          )}
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
