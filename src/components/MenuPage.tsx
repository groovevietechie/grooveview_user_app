"use client"

import { useState, useEffect, Suspense } from "react"
import type { Business, Menu, MenuCategory, MenuItem } from "@/types/database"
import { useCartStore } from "@/store/cartStore"
import { useServiceStore } from "@/store/serviceStore"
import { useTheme } from "@/contexts/ThemeContext"
import { getMenuItemOrderCounts } from "@/lib/api"
import { getDeviceId, getCustomerId } from "@/lib/device-identity"
import { trackActivity, updateDeviceActivity } from "@/lib/customer-api"
import { getDeviceOrders } from "@/lib/order-storage"
import { useCustomerProfile } from "@/hooks/useCustomerProfile"
import MenuHeader from "./MenuHeader"
import MenuList from "./MenuList"
import CartSidebar from "./CartSidebar"
import ServiceSidebar from "./ServiceSidebar"
import FloatingOrderButton from "./FloatingOrderButton"
import BackButtonHandler from "./BackButtonHandler"
import DeviceSyncModal from "./DeviceSyncModal"
import { ShoppingCartIcon, MapPinIcon, SparklesIcon, ShieldCheckIcon, BoltIcon, HeartIcon } from "@heroicons/react/24/outline"
import { useMenuNavigation } from "@/hooks/useMenuNavigation"

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
  const [orderCounts, setOrderCounts] = useState<Record<string, number>>({})
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false)
  const [heroSlide, setHeroSlide] = useState(0)
  const heroImages = ["/back1.png", "/back2.png", "/back3.png"]
  const { getItemCount, setBusinessId } = useCartStore()
  const { getServiceItemCount, setBusinessId: setServiceBusinessId } = useServiceStore()
  const { setPrimaryColor } = useTheme()
  const { handleBack } = useMenuNavigation()
  
  // Pre-load customer profile data on mount
  const customerProfile = useCustomerProfile()

  // Auto-advance hero carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setHeroSlide((prev) => (prev + 1) % heroImages.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [heroImages.length])

  useEffect(() => {
    setBusinessId(business.id)
    setServiceBusinessId(business.id)
    setPrimaryColor(business.theme_color_hex)

    // Initialize device tracking
    const deviceId = getDeviceId()
    const customerId = getCustomerId()

    // Track page view
    if (customerId) {
      trackActivity(customerId, deviceId, "view", { businessId: business.id }, business.id)
      updateDeviceActivity(customerId, deviceId)
    }

    const checkRecentOrder = () => {
      // Show button if user has ever placed an order for this business (persisted in localStorage)
      const hasOrders = getDeviceOrders(business.id).length > 0
      setShowFloatingButton(hasOrders)
    }

    checkRecentOrder()

    // Fetch order counts
    getMenuItemOrderCounts(business.id).then(setOrderCounts)

    // Listen for device sync event from MenuTabsView
    const handleOpenDeviceSync = () => {
      setIsSyncModalOpen(true)
    }
    window.addEventListener('openDeviceSync', handleOpenDeviceSync)

    return () => {
      window.removeEventListener('openDeviceSync', handleOpenDeviceSync)
    }
  }, [business.id, business.theme_color_hex, setBusinessId, setServiceBusinessId, setPrimaryColor])

  const itemCount = getItemCount()
  const serviceItemCount = getServiceItemCount()

  // Determine which sidebar to show based on current mode and item counts
  const getSidebarContent = () => {
    if (serviceItemCount > 0) {
      return <ServiceSidebar business={business} />
    }
    return <CartSidebar business={business} />
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BackButtonHandler onBack={handleBack}>
        <div id="top" className="lounge-shell min-h-screen relative overflow-hidden">
          <div className="lounge-ambient lounge-ambient-one" />
          <div className="lounge-ambient lounge-ambient-two" />
          
          {/* Content wrapper */}
          <div className="relative z-10">
            {/* Header */}
            <MenuHeader business={business} />

            <section className="lounge-hero max-w-6xl mx-3 sm:mx-auto mt-4 overflow-hidden">
              {heroImages.map((src, index) => (
                <div
                  key={src}
                  className={`lounge-hero-image ${index === heroSlide ? "is-active" : ""}`}
                  style={{ backgroundImage: `linear-gradient(90deg, rgba(2, 8, 18, .98) 0%, rgba(2, 8, 18, .86) 45%, rgba(2, 8, 18, .3) 100%), linear-gradient(135deg, rgba(1, 7, 18, .3), rgba(84, 16, 146, .3)), url('${src}')` }}
                />
              ))}
              <div className="lounge-hero-glow" />
              <div className="relative z-10 px-6 py-10 sm:px-10 sm:py-16 max-w-2xl">
                <div className="lounge-kicker"><SparklesIcon className="w-4 h-4" /> Welcome to</div>
                <h2>{business.name.replace(/serviced lounge/i, "").trim() || business.name}<br /><span>Serviced Lounge</span></h2>
                <p className="lounge-hero-values">Good Drinks <b>•</b> Great Vibes <b>•</b> Unforgettable Moments</p>
                {business.address && <div className="lounge-location"><MapPinIcon className="w-5 h-5" /> {business.address}</div>}
                <a href="#lounge-menu" className="lounge-hero-cta">Explore the menu <span>→</span></a>
              </div>
              <div className="lounge-hero-orb" />
              <div className="lounge-hero-dots">
                {heroImages.map((src, index) => (
                  <button
                    key={src}
                    type="button"
                    aria-label={`Show slide ${index + 1}`}
                    onClick={() => setHeroSlide(index)}
                    className={`lounge-hero-dot ${index === heroSlide ? "is-active" : ""}`}
                  />
                ))}
              </div>
            </section>

            <div id="lounge-experience" className="sr-only">Premium lounge experiences and curated service.</div>
            <div id="lounge-contact" className="sr-only">Contact information is available from the lounge.</div>

            {/* Main Content */}
            <div id="lounge-menu" className="max-w-6xl mx-auto px-3 sm:px-5 py-8">
              <div className="flex gap-2">
                {/* Menu Content */}
                <div className="flex-1">
                  <MenuList
                    business={business}
                    menus={menuData.menus}
                    categories={menuData.categories}
                    items={menuData.items}
                    themeColor={business.theme_color_hex}
                    orderCounts={orderCounts}
                  />
                </div>

                {/* Desktop Cart/Service Sidebar */}
                <div className="hidden lg:block w-80 flex-shrink-0">
                  {getSidebarContent()}
                </div>
              </div>
            </div>

            {/* Trust / Feature Strip */}
            <div className="max-w-6xl mx-auto px-3 sm:px-5 pb-10">
              <div className="lounge-trust-strip">
                <div className="lounge-trust-item">
                  <ShieldCheckIcon className="w-5 h-5" />
                  <div>
                    <p className="lounge-trust-title">Quality Drinks</p>
                    <p className="lounge-trust-sub">Premium brands only</p>
                  </div>
                </div>
                <div className="lounge-trust-item">
                  <BoltIcon className="w-5 h-5" />
                  <div>
                    <p className="lounge-trust-title">Fast Service</p>
                    <p className="lounge-trust-sub">Quick & easy ordering</p>
                  </div>
                </div>
                <div className="lounge-trust-item">
                  <HeartIcon className="w-5 h-5" />
                  <div>
                    <p className="lounge-trust-title">Relaxed Vibes</p>
                    <p className="lounge-trust-sub">Your comfort, our priority</p>
                  </div>
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
              <div className="absolute right-0 top-0 h-full w-full max-w-sm lounge-mobile-cart shadow-xl overflow-y-auto">
                <CartSidebar business={business} onClose={() => setIsCartOpen(false)} />
              </div>
            </div>
          )}

          {showFloatingButton && (
            <FloatingOrderButton businessSlug={business.slug} primaryColor={business.theme_color_hex} />
          )}

          {/* Device Sync Modal */}
          <DeviceSyncModal 
            isOpen={isSyncModalOpen} 
            onClose={() => setIsSyncModalOpen(false)}
            preloadedCustomer={customerProfile.customer}
            preloadedDevices={customerProfile.devices}
            onDataChange={customerProfile.refreshCustomerData}
          />
        </div>
      </BackButtonHandler>
    </Suspense>
  )
}
