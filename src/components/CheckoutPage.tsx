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
import { useCustomerProfile } from "@/hooks/useCustomerProfile"
import { getCustomerId, getDeviceId } from "@/lib/device-identity"
import BackButton from "@/components/BackButton"
import { HomeIcon, BuildingOfficeIcon, TruckIcon, PhoneIcon, CurrencyDollarIcon, UserCircleIcon } from "@heroicons/react/24/outline"
import { getAvailableWaiters } from "@/lib/api"
import type { Waiter } from "@/types/database"

interface CheckoutPageProps {
  business: Business
}

type OrderType = "table" | "room" | "home"

export default function CheckoutPage({ business }: CheckoutPageProps) {
  const router = useRouter()
  const { items, getTotal, clearCart } = useCartStore()
  const { primaryColor } = useTheme()
  const { customer, refreshCustomerData } = useCustomerProfile()
  
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
  const [useTokens, setUseTokens] = useState(false)
  const [tokenAmount, setTokenAmount] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [waiters, setWaiters] = useState<Waiter[]>([])
  const [selectedWaiterId, setSelectedWaiterId] = useState<string>("")

  // Load customer data on mount
  useEffect(() => {
    refreshCustomerData()
    getAvailableWaiters(business.id).then(setWaiters)
  }, [])

  const total = getTotal()
  const deliveryFee = orderType === "home" ? 1500 : 0
  const subtotal = total + deliveryFee

  // Calculate token usage
  const availableTokens = customer?.reward_tokens || 0
  const maxTokensToUse = Math.min(availableTokens, subtotal)
  const actualTokenAmount = useTokens ? tokenAmount : 0
  const finalTotal = subtotal - actualTokenAmount

  // Update token amount when useTokens changes
  useEffect(() => {
    if (useTokens && maxTokensToUse > 0) {
      setTokenAmount(maxTokensToUse)
    } else {
      setTokenAmount(0)
    }
  }, [useTokens, maxTokensToUse])

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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400 mx-auto mb-4"></div>
          <p className="text-amber-200">Redirecting...</p>
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

    // Validate token payment
    if (useTokens && actualTokenAmount > availableTokens) {
      alert("Insufficient token balance")
      return
    }

    // Handle bank transfer payment - go to payment page first
    if (paymentMethod === "transfer" && finalTotal > 0) {
      // Store order data in session storage for payment page
      const seatLabel = orderType === "table" 
        ? `Table ${tableNumber}` 
        : orderType === "room" 
        ? `Room ${roomNumber}` 
        : "Home Delivery"

      const orderData = {
        businessId: business.id,
        customerId: customer?.id || getCustomerId() || undefined,
        deviceId: getDeviceId() || undefined,
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
        tokenPaymentAmount: actualTokenAmount,
        deliveryAddress: orderType === "home" ? deliveryAddress : undefined,
        waiterId: selectedWaiterId || undefined,
      }

      // Store order data and total for payment page
      sessionStorage.setItem(`${business.id}_pending_order`, JSON.stringify(orderData))
      sessionStorage.setItem(`${business.id}_order_total`, finalTotal.toString())
      sessionStorage.setItem(`${business.id}_order_type`, orderType)

      // Redirect to payment page
      router.push(`/b/${business.slug}/payment?amount=${finalTotal}`)
      return
    }

    // Handle cash/token payments - place order immediately
    setIsSubmitting(true)

    try {
      const seatLabel = orderType === "table" 
        ? `Table ${tableNumber}` 
        : orderType === "room" 
        ? `Room ${roomNumber}` 
        : "Home Delivery"

      const orderData = {
        businessId: business.id,
        customerId: customer?.id || getCustomerId() || undefined,
        deviceId: getDeviceId() || undefined,
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
        paymentMethod: paymentMethod,
        tokenPaymentAmount: actualTokenAmount,
        deliveryAddress: orderType === "home" ? deliveryAddress : undefined,
        waiterId: selectedWaiterId || undefined,
      }

      const orderId = await submitOrder(orderData)
      
      if (orderId) {
        console.log("[v0] Order placed successfully:", orderId)
        saveDeviceOrder(business.id, orderId)
        sessionStorage.setItem(`${business.id}_recent_order`, "true")
        sessionStorage.setItem(`${business.id}_last_order_id`, orderId)
        
        // Refresh customer data to update token balance
        if (useTokens) {
          refreshCustomerData()
        }
        
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
    <div className="lounge-checkout min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-black">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <BackButton 
            label="Back to Menu"
            fallbackRoute={`/b/${business.slug}`}
            className="mb-4"
          />
          <h1 className="text-2xl font-bold text-amber-50">Checkout</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Order Type */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg shadow-sm border border-amber-400/30 p-6">
            <h2 className="text-lg font-semibold mb-4 text-amber-50">Order Type</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 border border-amber-400/20 rounded-lg cursor-pointer hover:bg-slate-700/50 transition-colors bg-slate-700/30">
                <input
                  type="radio"
                  value="table"
                  checked={orderType === "table"}
                  onChange={(e) => handleOrderTypeChange(e.target.value as OrderType)}
                  style={{ accentColor: '#fbbf24' }}
                />
                <BuildingOfficeIcon className="w-5 h-5 text-amber-400" />
                <div>
                  <span className="font-medium text-amber-50">Dining in (Table order)</span>
                  <p className="text-sm text-amber-200/70">Order for your table in the lounge</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 border border-amber-400/20 rounded-lg cursor-pointer hover:bg-slate-700/50 transition-colors bg-slate-700/30">
                <input
                  type="radio"
                  value="room"
                  checked={orderType === "room"}
                  onChange={(e) => handleOrderTypeChange(e.target.value as OrderType)}
                  style={{ accentColor: '#fbbf24' }}
                />
                <HomeIcon className="w-5 h-5 text-amber-400" />
                <div>
                  <span className="font-medium text-amber-50">Room service (Service order)</span>
                  <p className="text-sm text-amber-200/70">Delivery to your booked room</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 border border-amber-400/20 rounded-lg cursor-pointer hover:bg-slate-700/50 transition-colors bg-slate-700/30">
                <input
                  type="radio"
                  value="home"
                  checked={orderType === "home"}
                  onChange={(e) => handleOrderTypeChange(e.target.value as OrderType)}
                  style={{ accentColor: '#fbbf24' }}
                />
                <TruckIcon className="w-5 h-5 text-amber-400" />
                <div>
                  <span className="font-medium text-amber-50">Home delivery</span>
                  <p className="text-sm text-amber-200/70">Delivery to your home address</p>
                </div>
              </label>
            </div>

            {/* Table Number */}
            {orderType === "table" && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-amber-50 mb-2">Table Number *</label>
                <input
                  type="text"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="e.g., 5"
                  className="w-full p-3 border border-amber-400/30 rounded-md bg-slate-700/50 text-amber-50 placeholder-amber-200/50 focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                  required
                />
              </div>
            )}

            {/* Room Number/Name */}
            {orderType === "room" && (
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-amber-50 mb-2">Room Number/Name *</label>
                  <input
                    type="text"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    placeholder="e.g., 101, A-205, Presidential Suite"
                    className="w-full p-3 border border-amber-400/30 rounded-md bg-slate-700/50 text-amber-50 placeholder-amber-200/50 focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                    required
                  />
                  <p className="text-sm text-amber-200/70 mt-1">
                    Enter your room number or name for room service delivery
                  </p>
                </div>
                
                {/* Room Service Info */}
                <div className="bg-amber-900/30 border border-amber-400/40 rounded-lg p-4">
                  <h4 className="font-medium text-amber-200 mb-2">Room Service Information</h4>
                  <ul className="text-sm text-amber-200/80 space-y-1">
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
                  <label className="block text-sm font-medium text-amber-50 mb-2">Delivery Address *</label>
                  <textarea
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Enter your full delivery address including landmarks"
                    rows={3}
                    className="w-full p-3 border border-amber-400/30 rounded-md bg-slate-700/50 text-amber-50 placeholder-amber-200/50 focus:ring-2 focus:ring-amber-400 focus:border-transparent resize-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-amber-50 mb-2">
                    <PhoneIcon className="w-4 h-4 inline mr-1" />
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={deliveryPhone}
                    onChange={(e) => setDeliveryPhone(e.target.value)}
                    placeholder="e.g., +234 801 234 5678"
                    className="w-full p-3 border border-amber-400/30 rounded-md bg-slate-700/50 text-amber-50 placeholder-amber-200/50 focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                    required
                  />
                  <p className="text-sm text-amber-200/70 mt-1">
                    We'll call you when we arrive for delivery
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Waiter Selection */}
          {waiters.length > 0 && (
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg shadow-sm border border-amber-400/30 p-6">
              <h2 className="text-lg font-semibold mb-1 text-amber-50">Choose Your Waiter</h2>
              <p className="text-sm text-amber-200/70 mb-4">Optional — select who will serve you today</p>
              <div className="flex gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => setSelectedWaiterId("")}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all"
                  style={
                    !selectedWaiterId
                      ? { borderColor: '#fbbf24', backgroundColor: 'rgba(251, 191, 36, 0.1)' }
                      : { borderColor: 'rgba(251, 191, 36, 0.2)' }
                  }
                >
                  <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center">
                    <UserCircleIcon className="w-8 h-8 text-amber-400" />
                  </div>
                  <span className="text-xs font-medium text-amber-200">Any</span>
                </button>
                {waiters.map((waiter) => (
                  <button
                    key={waiter.id}
                    type="button"
                    onClick={() => setSelectedWaiterId(waiter.id)}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all"
                    style={
                      selectedWaiterId === waiter.id
                        ? { borderColor: '#fbbf24', backgroundColor: 'rgba(251, 191, 36, 0.1)' }
                        : { borderColor: 'rgba(251, 191, 36, 0.2)' }
                    }
                  >
                    {waiter.profile_image_url ? (
                      <img
                        src={waiter.profile_image_url}
                        alt={waiter.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center">
                        <UserCircleIcon className="w-8 h-8 text-amber-400" />
                      </div>
                    )}
                    <span className="text-xs font-medium text-amber-200 max-w-[60px] truncate">{waiter.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Order Summary */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg shadow-sm border border-amber-400/30 p-6">            
            <h2 className="text-lg font-semibold mb-4 text-amber-50">Order Summary</h2>
            <div className="space-y-3 text-amber-50">
              {items.map((cartItem) => (
                <div key={cartItem.menuItem.id} className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium">{cartItem.menuItem.name}</p>
                    <p className="text-sm text-amber-200/70">
                      ₦{cartItem.menuItem.price.toLocaleString()} × {cartItem.quantity}
                    </p>
                    {cartItem.note && <p className="text-sm text-amber-200/70 italic">Note: {cartItem.note}</p>}
                  </div>
                  <p className="font-medium">₦{(cartItem.menuItem.price * cartItem.quantity).toLocaleString()}</p>
                </div>
              ))}
              
              {/* Subtotal */}
              <div className="border-t border-amber-400/20 pt-3 flex justify-between items-center">
                <span className="font-medium">Subtotal:</span>
                <span className="font-medium">₦{total.toLocaleString()}</span>
              </div>
              
              {/* Delivery Fee for Home Delivery */}
              {orderType === "home" && (
                <div className="flex justify-between items-center">
                  <span className="font-medium">Delivery Fee:</span>
                  <span className="font-medium">₦{deliveryFee.toLocaleString()}</span>
                </div>
              )}

              {/* Token Payment Section */}
              {customer && availableTokens > 0 && (
                <div className="border-t border-amber-400/20 pt-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CurrencyDollarIcon className="w-5 h-5 text-amber-400" />
                      <span className="font-medium">Use Reward Tokens</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useTokens}
                        onChange={(e) => setUseTokens(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-400/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-amber-400 after:border-amber-400 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                    </label>
                  </div>
                  
                  {useTokens && (
                    <div className="bg-amber-900/30 border border-amber-400/40 rounded-lg p-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-amber-200">Available Tokens:</span>
                        <span className="font-semibold text-amber-300">₦{availableTokens.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-amber-200">Using:</span>
                        <span className="font-semibold text-amber-300">-₦{actualTokenAmount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max={maxTokensToUse}
                        step="0.01"
                        value={tokenAmount}
                        onChange={(e) => setTokenAmount(parseFloat(e.target.value))}
                        className="w-full"
                        style={{ accentColor: '#fbbf24' }}
                      />
                      <p className="text-xs text-amber-200/80">
                        💡 Slide to adjust token amount (max: ₦{maxTokensToUse.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Final Total */}
              <div className="border-t border-amber-400/20 pt-3 flex justify-between items-center">
                <span className="font-semibold text-lg">Total to Pay:</span>
                <span className="font-semibold text-lg text-amber-400">₦{finalTotal.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>

              {useTokens && actualTokenAmount > 0 && (
                <div className="bg-green-900/30 border border-green-400/40 rounded-lg p-2">
                  <p className="text-xs text-green-300 text-center">
                    🎉 You're saving ₦{actualTokenAmount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} with tokens!
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Customer Note */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg shadow-sm border border-amber-400/30 p-6">
            <label className="block text-sm font-medium text-amber-50 mb-2">
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
              className="w-full p-3 border border-amber-400/30 rounded-md bg-slate-700/50 text-amber-50 placeholder-amber-200/50 focus:ring-2 focus:ring-amber-400 focus:border-transparent resize-none"
              maxLength={500}
            />
            {orderType === "room" && (
              <p className="text-sm text-amber-200/70 mt-2">
                💡 Tip: Let us know if you prefer contactless delivery or have specific delivery preferences
              </p>
            )}
          </div>

          {/* Payment Method */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg shadow-sm border border-amber-400/30 p-6">
            <h2 className="text-lg font-semibold mb-4 text-amber-50">Payment Method</h2>
            
            {/* Table and Room Service Payment Options */}
            {(orderType === "table" || orderType === "room") && (
              <div className="space-y-3">
                <label className="flex items-center gap-3 text-amber-50">
                  <input
                    type="radio"
                    value="cash"
                    checked={paymentMethod === "cash"}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    style={{ accentColor: '#fbbf24' }}
                  />
                  <span>
                    {orderType === "table" ? "Pay in place (Cash / POS)" : "Pay on delivery (Cash)"}
                  </span>
                </label>
                <label className="flex items-center gap-3 text-amber-50">
                  <input
                    type="radio"
                    value="transfer"
                    checked={paymentMethod === "transfer"}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    style={{ accentColor: '#fbbf24' }}
                  />
                  <span>Bank Transfer</span>
                </label>
                {paymentMethod === "transfer" && (
                  <div className="ml-6 mt-2 p-3 bg-amber-900/30 border border-amber-400/40 rounded-lg">
                    <p className="text-sm text-amber-200">
                      💡 You'll proceed to payment first, then your order will be placed after payment confirmation
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Home Delivery Payment Options */}
            {orderType === "home" && (
              <div className="space-y-3">
                <label className="flex items-center gap-3 text-amber-50">
                  <input
                    type="radio"
                    value="transfer"
                    checked={paymentMethod === "transfer"}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    style={{ accentColor: '#fbbf24' }}
                    disabled
                  />
                  <span>Bank Transfer (Required for home delivery)</span>
                </label>
                <div className="ml-6 p-3 bg-amber-900/30 border border-amber-400/40 rounded-lg">
                  <p className="text-sm text-amber-200">
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
            className="w-full text-slate-900 py-4 px-6 rounded-lg disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors font-semibold text-lg bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 shadow-lg hover:shadow-amber-500/50"
          >
            {isSubmitting 
              ? "Processing..." 
              : finalTotal === 0
                ? "Place Order (Paid with Tokens)"
                : paymentMethod === "transfer" && finalTotal > 0
                  ? `Proceed to Payment - ₦${finalTotal.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : `Place Order - ₦${finalTotal.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            }
          </button>
        </form>
      </div>
    </div>
  )
}
