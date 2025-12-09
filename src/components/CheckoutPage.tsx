"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { Business, PaymentMethod } from "@/types/database"
import { useCartStore } from "@/store/cartStore"
import { useTheme } from "@/contexts/ThemeContext"
import { submitOrder } from "@/lib/api"
import { ArrowLeftIcon } from "@heroicons/react/24/outline"

interface CheckoutPageProps {
  business: Business
}

type OrderType = "table" | "home"

export default function CheckoutPage({ business }: CheckoutPageProps) {
  const router = useRouter()
  const { items, getTotal, clearCart } = useCartStore()
  const { primaryColor } = useTheme()

  const [orderType, setOrderType] = useState<OrderType>("table")
  const [tableNumber, setTableNumber] = useState("")
  const [deliveryAddress, setDeliveryAddress] = useState("")
  const [customerNote, setCustomerNote] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const total = getTotal()

  // Redirect if cart is empty
  if (items.length === 0) {
    router.push(`/b/${business.slug}`)
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (orderType === "table" && !tableNumber.trim()) {
      alert("Please enter your table number")
      return
    }

    if (orderType === "home" && !deliveryAddress.trim()) {
      alert("Please enter your delivery address")
      return
    }

    setIsSubmitting(true)

    try {
      const seatLabel = orderType === "table" ? `Table ${tableNumber}` : "Home Delivery"

      const orderData = {
        businessId: business.id,
        items: items.map((cartItem) => ({
          menuItemId: cartItem.menuItem.id,
          quantity: cartItem.quantity,
          unitPrice: cartItem.menuItem.price,
          note: cartItem.note,
        })),
        seatLabel,
        customerNote: customerNote.trim() || undefined,
        paymentMethod,
        deliveryAddress: orderType === "home" ? deliveryAddress : undefined,
      }

      console.log("[v0] Order data prepared:", orderData)
      const orderId = await submitOrder(orderData)

      if (orderId) {
        console.log("[v0] Order placed successfully:", orderId)
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
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Menu
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Order Type */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Order Type</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="radio"
                  value="table"
                  checked={orderType === "table"}
                  onChange={(e) => setOrderType(e.target.value as OrderType)}
                  style={{ accentColor: primaryColor }}
                />
                <span>Dining in (Table order)</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="radio"
                  value="home"
                  checked={orderType === "home"}
                  onChange={(e) => setOrderType(e.target.value as OrderType)}
                  style={{ accentColor: primaryColor }}
                />
                <span>Home delivery</span>
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

            {/* Delivery Address */}
            {orderType === "home" && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Address *</label>
                <textarea
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Enter your full delivery address"
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  required
                />
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Special Instructions (Optional)</label>
            <textarea
              value={customerNote}
              onChange={(e) => setCustomerNote(e.target.value)}
              placeholder="Any special requests for your order..."
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              maxLength={500}
            />
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Payment Method</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="radio"
                  value="cash"
                  checked={paymentMethod === "cash"}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  style={{ accentColor: primaryColor }}
                />
                <span>{orderType === "table" ? "Pay in place (cash)" : "Pay on delivery (cash)"}</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="radio"
                  value="card"
                  checked={paymentMethod === "card"}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  style={{ accentColor: primaryColor }}
                />
                <span>Pay in app (card)</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="radio"
                  value="mobile"
                  checked={paymentMethod === "mobile"}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  style={{ accentColor: primaryColor }}
                />
                <span>Pay in app (mobile)</span>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            style={isSubmitting ? {} : { backgroundColor: primaryColor }}
            className="w-full text-white py-4 px-6 rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-semibold text-lg"
          >
            {isSubmitting ? "Placing Order..." : `Place Order - ₦${total.toLocaleString()}`}
          </button>
        </form>
      </div>
    </div>
  )
}
