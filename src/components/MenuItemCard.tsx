"use client"

import Image from "next/image"
import { useState } from "react"
import type { MenuItem, SelectedOption } from "@/types/database"
import { useCartStore } from "@/store/cartStore"
import { HeartIcon, LockClosedIcon, CogIcon, CheckCircleIcon, ShoppingBagIcon } from "@heroicons/react/24/outline"
import MenuItemOptionsModal from "./MenuItemOptionsModal"

interface MenuItemCardProps {
  item: MenuItem
  themeColor: string
  orderCount?: number
}

export default function MenuItemCard({ item, themeColor, orderCount = 0 }: MenuItemCardProps) {
  const [showOptionsModal, setShowOptionsModal] = useState(false)
  const { addItem, items } = useCartStore()
  const hasOptions = Boolean(item.option_categories?.length)
  const cartQuantity = items.find((cartItem) => cartItem.menuItem.id === item.id)?.quantity || 0
  const isAccent = themeColor.toLowerCase() === "#f6c945" || themeColor.toLowerCase() === "#facc15"

  const addToCart = (quantity: number, selectedOptions?: SelectedOption[], note?: string) => {
    addItem(item, quantity, selectedOptions || [], note)
    setShowOptionsModal(false)
  }

  const handleOrder = () => {
    if (hasOptions) setShowOptionsModal(true)
    else addToCart(1)
  }

  return (
    <>
      <article className="lounge-product-card menu-card group" style={{ "--card-accent": isAccent ? "#f6c945" : themeColor } as React.CSSProperties}>
        <div className="lounge-product-media">
          {item.image_url ? (
            <Image src={item.image_url} alt={item.name} fill sizes="(max-width: 640px) 50vw, 360px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950 text-3xl" aria-hidden="true"><ShoppingBagIcon /></div>
          )}
          <div className="lounge-product-scrim" aria-hidden="true" />
          <div className="menu-card-topline">
            <span className="lounge-order-badge"><LockClosedIcon />{orderCount} {orderCount === 1 ? "Order" : "Orders"}</span>
            <button type="button" className="lounge-heart-button" aria-label={`Save ${item.name}`}><HeartIcon /></button>
          </div>
          <div className="menu-card-overlay">
            <div className="min-w-0">
              <h3 className="truncate">{item.name}</h3>
              {item.description && <p className="line-clamp-1">{item.description}</p>}
            </div>
            <button type="button" onClick={handleOrder} className="lounge-order-button shrink-0">Order Now <span aria-hidden="true">›</span></button>
          </div>
        </div>
        <div className="lounge-product-footer">
          <span className="lounge-product-price">₦{item.price.toLocaleString()}+</span>
          {hasOptions && <span className="lounge-options-label"><CogIcon /> Customizable</span>}
          {cartQuantity > 0 && <span className="lounge-cart-status"><CheckCircleIcon /> {cartQuantity} in cart</span>}
        </div>
      </article>
      <MenuItemOptionsModal isOpen={showOptionsModal} onClose={() => setShowOptionsModal(false)} item={item} themeColor={themeColor} onAddToCart={addToCart} initialQuantity={1} />
    </>
  )
}
