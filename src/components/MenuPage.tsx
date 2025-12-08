'use client'

import { useState, useEffect } from 'react'
import { Business, Menu, MenuCategory, MenuItem } from '@/types/database'
import { useCartStore } from '@/store/cartStore'
import { useTheme } from '@/contexts/ThemeContext'
import MenuHeader from './MenuHeader'
import MenuList from './MenuList'
import CartSidebar from './CartSidebar'
import { ShoppingCartIcon } from '@heroicons/react/24/outline'

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
  const { items, getItemCount, setBusinessId } = useCartStore()
  const { setPrimaryColor } = useTheme()

  useEffect(() => {
    setBusinessId(business.id)
    setPrimaryColor(business.theme_color_hex)
  }, [business.id, business.theme_color_hex, setBusinessId, setPrimaryColor])

  const itemCount = getItemCount()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <MenuHeader business={business} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Menu Content */}
          <div className="flex-1">
            <MenuList
              menus={menuData.menus}
              categories={menuData.categories}
              items={menuData.items}
            />
          </div>

          {/* Desktop Cart Sidebar */}
          <div className="hidden lg:block w-80">
            <CartSidebar business={business} />
          </div>
        </div>
      </div>

      {/* Mobile Cart Button */}
      {itemCount > 0 && (
        <div className="fixed bottom-4 right-4 lg:hidden">
          <button
            onClick={() => setIsCartOpen(true)}
            className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
          >
            <ShoppingCartIcon className="w-6 h-6" />
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
              {itemCount}
            </span>
          </button>
        </div>
      )}

      {/* Mobile Cart Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setIsCartOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-white shadow-xl">
            <CartSidebar business={business} onClose={() => setIsCartOpen(false)} />
          </div>
        </div>
      )}
    </div>
  )
}