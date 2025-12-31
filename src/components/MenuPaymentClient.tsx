"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import type { Business } from "@/types/database"
import { useTheme } from "@/contexts/ThemeContext"
import { useCartStore } from "@/store/cartStore"
import { submitOrder } from "@/lib/api"
import { saveDeviceOrder } from "@/lib/order-storage"
import { ClipboardDocumentIcon, CheckIcon, BanknotesIcon, ClockIcon, PhoneIcon, ArrowLeftIcon } from "@heroicons/react/24/outline"

interface MenuPaymentClientProps {
  business: Business
  totalAmount: number
}

export default function MenuPaymentClient({ 
  business, 
  totalAmount 
}: MenuPaymentClientProps) {
  const router = useRouter()
  const { primaryColor } = useTheme()
  const { clearCart } = useCartStore()
  
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [timeRemaining, setTimeRemaining] = useState(30 * 60) // 30 minutes in seconds
  const [isConfirming, setIsConfirming] = useState(false)
  const [transferCode, setTransferCode] = useState("")
  const [orderData, setOrderData] = useState<any>(null)

  useEffect(() => {
    // Generate transfer code and get order data from session storage
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    setTransferCode(code)

    // Get pending order data
    const pendingOrder = sessionStorage.getItem(`${business.id}_pending_order`)
    if (pendingOrder) {
      setOrderData(JSON.parse(pendingOrder))
    } else {
      // No pending order, redirect back to checkout
      router.push(`/b/${business.slug}/checkout`)
    }
  }, [business.id, router])

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const handlePaymentComplete = async () => {
    if (!orderData) {
      alert("Order data not found. Please try again.")
      return
    }

    setIsConfirming(true)
    try {
      console.log("[MenuPayment] Placing order after payment confirmation:", orderData)
      
      const orderId = await submitOrder(orderData)
      
      if (orderId) {
        console.log("[MenuPayment] Order placed successfully:", orderId)
        
        // Save order and clear session data
        saveDeviceOrder(business.id, orderId)
        sessionStorage.setItem(`${business.id}_recent_order`, "true")
        sessionStorage.setItem(`${business.id}_last_order_id`, orderId)
        
        // Clear pending order data
        sessionStorage.removeItem(`${business.id}_pending_order`)
        sessionStorage.removeItem(`${business.id}_order_total`)
        sessionStorage.removeItem(`${business.id}_order_type`)
        
        // Clear cart
        clearCart()
        
        // Redirect to order confirmation
        router.push(`/b/${business.slug}/order/${orderId}?success=true`)
      } else {
        alert("Failed to place order. Please try again or contact support.")
      }
    } catch (error) {
      console.error("Error placing order:", error)
      alert("An error occurred while placing your order. Please try again.")
    } finally {
      setIsConfirming(false)
    }
  }

  const handleBack = () => {
    router.push(`/b/${business.slug}/checkout`)
  }

  if (isConfirming) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Placing your order...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Checkout
          </button>
        </div>

        <div className="max-w-md mx-auto space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div 
              className="w-16 h-16 mx-auto rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${primaryColor}20` }}
            >
              <BanknotesIcon 
                className="w-8 h-8" 
                style={{ color: primaryColor }} 
              />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Complete Payment
            </h2>
            <p className="text-gray-600">
              Transfer the amount below to complete your order
            </p>
          </div>

          {/* Timer */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <ClockIcon className="w-5 h-5 text-yellow-600" />
              <span className="font-semibold text-yellow-800">Time Remaining</span>
            </div>
            <div className="text-2xl font-bold text-yellow-900">
              {formatTime(timeRemaining)}
            </div>
            <p className="text-sm text-yellow-700 mt-1">
              Complete payment within this time to secure your order
            </p>
          </div>

          {/* Amount to Pay */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center">
            <p className="text-sm text-gray-500 mb-2">Amount to Pay</p>
            <div 
              className="text-3xl font-bold mb-2"
              style={{ color: primaryColor }}
            >
              {formatPrice(totalAmount)}
            </div>
            <p className="text-xs text-gray-500">
              Transfer Code: {transferCode}
            </p>
          </div>

          {/* Bank Details */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
            <h3 className="font-semibold text-lg text-gray-900 text-center">
              Bank Transfer Details
            </h3>
            
            {/* Account Number */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Account Number</label>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <span className="flex-1 font-mono text-lg font-semibold">
                  {business.payment_account_number || "Not Available"}
                </span>
                <button
                  onClick={() => copyToClipboard(business.payment_account_number || "", "account")}
                  className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                  style={{ color: primaryColor }}
                >
                  {copiedField === "account" ? (
                    <CheckIcon className="w-5 h-5 text-green-600" />
                  ) : (
                    <ClipboardDocumentIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Account Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Account Name</label>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <span className="flex-1 font-semibold">
                  {business.payment_account_name || "Not Available"}
                </span>
                <button
                  onClick={() => copyToClipboard(business.payment_account_name || "", "name")}
                  className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                  style={{ color: primaryColor }}
                >
                  {copiedField === "name" ? (
                    <CheckIcon className="w-5 h-5 text-green-600" />
                  ) : (
                    <ClipboardDocumentIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Bank Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Bank Name</label>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <span className="flex-1 font-semibold">
                  {business.payment_bank || "Not Available"}
                </span>
                <button
                  onClick={() => copyToClipboard(business.payment_bank || "", "bank")}
                  className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                  style={{ color: primaryColor }}
                >
                  {copiedField === "bank" ? (
                    <CheckIcon className="w-5 h-5 text-green-600" />
                  ) : (
                    <ClipboardDocumentIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Transfer Code */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Transfer Remark/Reference</label>
              <div className="flex items-center gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <span className="flex-1 font-mono text-xl font-bold text-blue-900">
                  {transferCode}
                </span>
                <button
                  onClick={() => copyToClipboard(transferCode, "code")}
                  className="p-2 rounded-lg hover:bg-blue-200 transition-colors text-blue-600"
                >
                  {copiedField === "code" ? (
                    <CheckIcon className="w-5 h-5 text-green-600" />
                  ) : (
                    <ClipboardDocumentIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-blue-700 bg-blue-50 p-2 rounded">
                <strong>Important:</strong> Use this code as your transfer remark/reference so we can identify your payment
              </p>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
            <h4 className="font-semibold text-gray-900">Payment Instructions</h4>
            <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
              <li>Copy the account details above</li>
              <li>Open your banking app or visit the bank</li>
              <li>Transfer the exact amount: <strong>{formatPrice(totalAmount)}</strong></li>
              <li>Use <strong>{transferCode}</strong> as your transfer remark/reference</li>
              <li>Click "I've Made Payment" below after completing the transfer</li>
            </ol>
          </div>

          {/* Contact Info */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <PhoneIcon className="w-5 h-5" style={{ color: primaryColor }} />
              <span className="font-semibold text-gray-900">Need Help?</span>
            </div>
            <div className="space-y-1 text-sm text-gray-600">
              <p><span className="font-medium">Business:</span> {business.name}</p>
              {business.phone && (
                <p><span className="font-medium">Phone:</span> {business.phone}</p>
              )}
              <p className="text-xs text-gray-500 mt-2">
                Contact us if you encounter any issues with the payment process
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handlePaymentComplete}
              disabled={isConfirming}
              className="w-full py-4 rounded-lg text-white font-semibold text-lg transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: primaryColor }}
            >
              {isConfirming ? "Placing Order..." : "I've Made Payment"}
            </button>
            
            <button
              onClick={handleBack}
              className="w-full py-3 rounded-lg border border-gray-300 text-gray-700 font-medium transition-all hover:bg-gray-50"
            >
              Back to Checkout
            </button>
          </div>

          {/* Warning */}
          {timeRemaining <= 300 && ( // Show warning when 5 minutes or less
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
              <p className="text-red-800 font-medium">
                ⚠️ Payment time is running out!
              </p>
              <p className="text-sm text-red-600 mt-1">
                Complete your payment soon to avoid losing your order
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}