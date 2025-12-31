"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { Business, PaymentMethod } from "@/types/database"
import { useCartStore } from "@/store/cartStore"
import { useTheme } from "@/contexts/ThemeContext"
import { submitOrder } from "@/lib/api"
import { saveDeviceOrder } from "@/lib/order-storage"
import { useBackNavigation } from "@/hooks/useBackNavigation"
import BackButton from "@/components/BackButton"
import { HomeIcon, BuildingOfficeIcon, TruckIcon, PhoneIcon } from "@heroicons/react/24/outline"

interface CheckoutPageProps {
  business: Business
}

type OrderType = "table" | "room" | "home"

export default function CheckoutPage({ business }: CheckoutPageProps) {
  const router = useRouter()
  const { items, getTotal, clearCart } = useCartStore()
  const { primaryColor } = useTheme()
  
  // Use the back navigation hook
  useBackNavigation({
    fallbackRoute: `/b/${business.slug}`
  })

  const [orderType, setOrderType] = useState<OrderType>("table")
  const [tableNumber, setTableNumber] = useState("")
  const [roomNumber, setRoomNumber] = useState("")
  const [deliveryAddress, setDeliveryAddress] = useState("")
  const [deliveryPhone, setDeliveryPhone] = useState("")
  const [customerNote, setCustomerNote] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)

  // Handle empty cart redirect in useEffect to avoid render-time navigation
  useEffect(() => {
    if (items.length === 0 && !isRedirecting) {
      setIsRedirecting(true)
      router.push(`/b/${business.slug}`)
    }
  }, [items.length, business.slug, router, isRedirecting])

  // Show loading state while redirecting
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    )
  }

  // Update payment method when order type changes
  const handleOrderTypeChange = (newOrderType: OrderType) => {
    setOrderType(newOrderType)
    // Set default payment method based on order type
    if (newOrderType === "home") {
      setPaymentMethod("transfer") // Home delivery only supports transfer
    } else {
      setPaymentMethod("cash") // Table and room default to cash
    }
  }

  const total = getTotal()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (orderType === "table" && !tableNumber.trim()) {
      alert("Please enter your table number")
      return
    }

    if (orderType === "room" && !roomNumber.trim()) {
      alert("Please enter your room number/name")
      return
    }

    if (orderType === "home" && !deliveryAddress.trim()) {
      alert("Please enter your delivery address")
      return
    }

    if (orderType === "home" && !deliveryPhone.trim()) {
      alert("Please enter your phone number for delivery")
      return
    }

    // Basic phone number validation for home delivery
    if (orderType === "home" && deliveryPhone.trim()) {
      const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,}$/
      if (!phoneRegex.test(deliveryPhone.trim())) {
        alert("Please enter a valid phone number")
        return
      }
    }

    // Handle bank transfer payment - go to payment page first
    if (paymentMethod === "transfer") {
      // Store order data in session storage for payment page
      const seatLabel = orderType === "table" 
        ? `Table ${tableNumber}` 
        : orderType === "room" 
        ? `Room ${roomNumber}` 
        : "Home Delivery"

      const orderData = {
        businessId: business.id,
        items: items.map((cartItem) => ({
          menuItemId: cartItem.menuItem.id,
          quantity: cartItem.quantity,
          unitPrice: cartItem.menuItem.price,
          note: cartItem.note,
        })),
        seatLabel,
        customerNote: orderType === "home" 
          ? `Phone: ${deliveryPhone}${customerNote.trim() ? `\n\nSpecial Instructions: ${customerNote.trim()}` : ''}`
          : customerNote.trim() || undefined,
        paymentMethod,
        deliveryAddress: orderType === "home" ? deliveryAddress : undefined,
      }

      // Store order data and total for payment page
      sessionStorage.setItem(`${business.id}_pending_order`, JSON.stringify(orderData))
      sessionStorage.setItem(`${business.id}_order_total`, total.toString())
      sessionStorage.setItem(`${business.id}_order_type`, orderType)

      // Redirect to payment page
      router.push(`/b/${business.slug}/payment?amount=${total}`)
      return
    }

    // Handle cash payments - place order immediately
    setIsSubmitting(true)

    try {
      const seatLabel = orderType === "table" 
        ? `Table ${tableNumber}` 
        : orderType === "room" 
        ? `Room ${roomNumber}` 
        : "Home Delivery"

      const orderData = {
        businessId: business.id,
        items: items.map((cartItem) => ({
          menuItemId: cartItem.menuItem.id,
          quantity: cartItem.quantity,
          unitPrice: cartItem.menuItem.price,
          note: cartItem.note,
        })),
        seatLabel,
        customerNote: orderType === "home" 
          ? `Phone: ${deliveryPhone}${customerNote.trim() ? `\n\nSpecial Instructions: ${customerNote.trim()}` : ''}`
          : customerNote.trim() || undefined,
        paymentMethod,
        deliveryAddress: orderType === "home" ? deliveryAddress : undefined,
      }

      const orderId = await submitOrder(orderData)
      
      if (orderId) {
        console.log("[v0] Order placed successfully:", orderId)
        saveDeviceOrder(business.id, orderId)
        sessionStorage.setItem(`${business.id}_recent_order`, "true")
        sessionStorage.setItem(`${business.id}_last_order_id`, orderId)
        clearCart()
        router.push(`/b/${business.slug}/order/${orderId}?success=true`)
      } else {
        console.error("[v0] Order submission returned null - Check browser console for details")
        alert(
          "Failed to place order. Please check your connection and try again. If the problem persists, the restaurant may not have online ordering enabled.",
        )
      }
    } catch (error) {
      console.error("[v0] Order submission error:", error)
      alert("An error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <BackButton 
            label="Back to Menu"
            fallbackRoute={`/b/${business.slug}`}
            className="mb-4"
          />
          <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Order Type */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Order Type</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  value="table"
                  checked={orderType === "table"}
                  onChange={(e) => handleOrderTypeChange(e.target.value as OrderType)}
                  style={{ accentColor: primaryColor }}
                />
                <BuildingOfficeIcon className="w-5 h-5 text-gray-600" />
                <div>
                  <span className="font-medium">Dining in (Table order)</span>
                  <p className="text-sm text-gray-500">Order for your table in the restaurant</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  value="room"
                  checked={orderType === "room"}
                  onChange={(e) => handleOrderTypeChange(e.target.value as OrderType)}
                  style={{ accentColor: primaryColor }}
                />
                <HomeIcon className="w-5 h-5 text-gray-600" />
                <div>
                  <span className="font-medium">Room service (Service order)</span>
                  <p className="text-sm text-gray-500">Delivery to your hotel room</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  value="home"
                  checked={orderType === "home"}
                  onChange={(e) => handleOrderTypeChange(e.target.value as OrderType)}
                  style={{ accentColor: primaryColor }}
                />
                <TruckIcon className="w-5 h-5 text-gray-600" />
                <div>
                  <span className="font-medium">Home delivery</span>
                  <p className="text-sm text-gray-500">Delivery to your home address</p>
                </div>
              </label>
            </div>

            {/* Table Number */}
            {orderType === "table" && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Table Number *</label>
                <input
                  type="text"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="e.g., 5"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            )}

            {/* Room Number/Name */}
            {orderType === "room" && (
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Room Number/Name *</label>
                  <input
                    type="text"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    placeholder="e.g., 101, A-205, Presidential Suite"
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Enter your room number or name for room service delivery
                  </p>
                </div>
                
                {/* Room Service Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Room Service Information</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Estimated delivery time: 20-30 minutes</li>
                    <li>• Service available 24/7</li>
                    <li>• Please ensure someone is available to receive the order</li>
                    <li>• Contact reception if you need assistance</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Delivery Address and Phone */}
            {orderType === "home" && (
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Address *</label>
                  <textarea
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Enter your full delivery address including landmarks"
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <PhoneIcon className="w-4 h-4 inline mr-1" />
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={deliveryPhone}
                    onChange={(e) => setDeliveryPhone(e.target.value)}
                    placeholder="e.g., +234 801 234 5678"
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    We'll call you when we arrive for delivery
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
            <div className="space-y-3">
              {items.map((cartItem) => (
                <div key={cartItem.menuItem.id} className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium">{cartItem.menuItem.name}</p>
                    <p className="text-sm text-gray-600">
                      ₦{cartItem.menuItem.price.toLocaleString()} × {cartItem.quantity}
                    </p>
                    {cartItem.note && <p className="text-sm text-gray-500 italic">Note: {cartItem.note}</p>}
                  </div>
                  <p className="font-medium">₦{(cartItem.menuItem.price * cartItem.quantity).toLocaleString()}</p>
                </div>
              ))}
              <div className="border-t pt-3 flex justify-between items-center">
                <span className="font-semibold text-lg">Total:</span>
                <span className="font-semibold text-lg">₦{total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Customer Note */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {orderType === "room" 
                ? "Special Instructions for Room Service (Optional)" 
                : "Special Instructions (Optional)"}
            </label>
            <textarea
              value={customerNote}
              onChange={(e) => setCustomerNote(e.target.value)}
              placeholder={
                orderType === "room" 
                  ? "Any special requests for your room service order (e.g., 'Please knock softly', 'Leave outside door')..." 
                  : "Any special requests for your order..."
              }
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              maxLength={500}
            />
            {orderType === "room" && (
              <p className="text-sm text-gray-500 mt-2">
                💡 Tip: Let us know if you prefer contactless delivery or have specific delivery preferences
              </p>
            )}
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Payment Method</h2>
            
            {/* Table and Room Service Payment Options */}
            {(orderType === "table" || orderType === "room") && (
              <div className="space-y-3">
                <label className="flex items-center gap-3">
                  <input
                    type="radio"
                    value="cash"
                    checked={paymentMethod === "cash"}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    style={{ accentColor: primaryColor }}
                  />
                  <span>
                    {orderType === "table" ? "Pay in place (Cash / POS)" : "Pay on delivery (Cash)"}
                  </span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="radio"
                    value="transfer"
                    checked={paymentMethod === "transfer"}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    style={{ accentColor: primaryColor }}
                  />
                  <span>Bank Transfer</span>
                </label>
                {paymentMethod === "transfer" && (
                  <div className="ml-6 mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      💡 You'll proceed to payment first, then your order will be placed after payment confirmation
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Home Delivery Payment Options */}
            {orderType === "home" && (
              <div className="space-y-3">
                <label className="flex items-center gap-3">
                  <input
                    type="radio"
                    value="transfer"
                    checked={paymentMethod === "transfer"}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    style={{ accentColor: primaryColor }}
                    disabled
                  />
                  <span>Bank Transfer (Required for home delivery)</span>
                </label>
                <div className="ml-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Home delivery requires advance payment via bank transfer.</strong><br />
                    You'll proceed to payment first, then your order will be placed after payment confirmation.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            style={isSubmitting ? {} : { backgroundColor: primaryColor }}
            className="w-full text-white py-4 px-6 rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-semibold text-lg"
          >
            {isSubmitting 
              ? "Processing..." 
              : paymentMethod === "transfer" 
                ? `Proceed to Payment - ₦${total.toLocaleString()}`
                : `Place Order - ₦${total.toLocaleString()}`
            }
          </button>
        </form>
      </div>
    </div>
  )
}
