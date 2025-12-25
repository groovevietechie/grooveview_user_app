"use client"

import { useState, useEffect } from "react"
import type { Business, Menu, MenuCategory, MenuItem } from "@/types/database"
import { useCartStore } from "@/store/cartStore"
import { useTheme } from "@/contexts/ThemeContext"
import MenuHeader from "./MenuHeader"
import MenuList from "./MenuList"
import CartSidebar from "./CartSidebar"
import FloatingOrderButton from "./FloatingOrderButton"
import { ShoppingCartIcon } from "@heroicons/react/24/outline"

interface MenuPageProps {
  business: Business
  menuData: {
    menus: Menu[]
    categories: MenuCategory[]
    items: MenuItem[]
  }
}

export default function MenuPage({ business, menuData }: MenuPageProps) {
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [showFloatingButton, setShowFloatingButton] = useState(false)
  const { getItemCount, setBusinessId } = useCartStore()
  const { setPrimaryColor } = useTheme()

  useEffect(() => {
    setBusinessId(business.id)
    setPrimaryColor(business.theme_color_hex)

    const checkRecentOrder = () => {
      const hasRecentOrder = sessionStorage.getItem(`${business.id}_recent_order`) === "true"
      setShowFloatingButton(hasRecentOrder)
    }

    checkRecentOrder()
  }, [business.id, business.theme_color_hex, setBusinessId, setPrimaryColor])

  const itemCount = getItemCount()

  return (
    <div 
      className="min-h-screen relative"
      style={{
        backgroundImage: 'url(/menu_page_background.jpeg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Background overlay for opacity */}
      <div className="absolute inset-0 bg-white opacity-70"></div>
      
      {/* Content wrapper */}
      <div className="relative z-10">
        {/* Header */}
        <MenuHeader business={business} />

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex gap-6">
            {/* Menu Content */}
            <div className="flex-1">
              <MenuList
                menus={menuData.menus}
                categories={menuData.categories}
                items={menuData.items}
                themeColor={business.theme_color_hex}
              />
            </div>

            {/* Desktop Cart Sidebar */}
            <div className="hidden lg:block w-80 flex-shrink-0">
              <CartSidebar business={business} />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Cart Button */}
      {itemCount > 0 && (
        <div className="fixed bottom-6 right-6 lg:hidden z-40">
          <button
            onClick={() => setIsCartOpen(true)}
            style={{ backgroundColor: business.theme_color_hex }}
            className="text-white p-4 rounded-full shadow-xl hover:shadow-2xl transition-all hover:scale-110 flex items-center justify-center relative"
            aria-label={`View cart with ${itemCount} items`}
          >
            <ShoppingCartIcon className="w-6 h-6" />
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
              {itemCount}
            </span>
          </button>
        </div>
      )}

      {/* Mobile Cart Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setIsCartOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-white shadow-xl overflow-y-auto">
            <CartSidebar business={business} onClose={() => setIsCartOpen(false)} />
          </div>
        </div>
      )}

      {showFloatingButton && (
        <FloatingOrderButton businessSlug={business.slug} primaryColor={business.theme_color_hex} />
      )}
    </div>
  )
}
