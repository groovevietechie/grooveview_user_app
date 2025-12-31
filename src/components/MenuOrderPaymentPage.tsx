"use client"

import { useState, useEffect } from "react"
import { ClipboardDocumentIcon, CheckIcon, BanknotesIcon, ClockIcon, PhoneIcon } from "@heroicons/react/24/outline"
import type { Business } from "@/types/database"
import { confirmMenuOrderPayment } from "@/lib/api"

interface MenuOrderPaymentPageProps {
  business: Business
  orderId: string
  totalAmount: number
  transferCode: string
  orderType: string
  onPaymentComplete: () => void
  onBack: () => void
  themeColor: string
}

export default function MenuOrderPaymentPage({ 
  business, 
  orderId, 
  totalAmount, 
  transferCode,
  orderType,
  onPaymentComplete,
  onBack,
  themeColor 
}: MenuOrderPaymentPageProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [timeRemaining, setTimeRemaining] = useState(30 * 60) // 30 minutes in seconds
  const [isConfirming, setIsConfirming] = useState(false)

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
    setIsConfirming(true)
    try {
      const success = await confirmMenuOrderPayment(orderId)
      if (success) {
        onPaymentComplete()
      } else {
        alert("Failed to confirm payment. Please try again or contact support.")
      }
    } catch (error) {
      console.error("Error confirming payment:", error)
      alert("An error occurred while confirming payment. Please try again.")
    } finally {
      setIsConfirming(false)
    }
  }

  const getOrderTypeLabel = () => {
    switch (orderType) {
      case 'table': return 'Table Order'
      case 'room': return 'Room Service'
      case 'home': return 'Home Delivery'
      default: return 'Order'
    }
  }

  return (
    <div className="max-w-md mx-auto space-y-6 py-4">
      {/* Header */}
      <div className="text-center space-y-2">
        <div 
          className="w-16 h-16 mx-auto rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${themeColor}20` }}
        >
          <BanknotesIcon 
            className="w-8 h-8" 
            style={{ color: themeColor }} 
          />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">
          Complete Payment
        </h2>
        <p className="text-gray-600">
          Transfer the amount below to confirm your {getOrderTypeLabel().toLowerCase()}
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
          style={{ color: themeColor }}
        >
          {formatPrice(totalAmount)}
        </div>
        <p className="text-xs text-gray-500">
          Order ID: {orderId.slice(0, 8).toUpperCase()} • {getOrderTypeLabel()}
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
              style={{ color: themeColor }}
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
              style={{ color: themeColor }}
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
              style={{ color: themeColor }}
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
          <PhoneIcon className="w-5 h-5" style={{ color: themeColor }} />
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
          style={{ backgroundColor: themeColor }}
        >
          {isConfirming ? "Confirming Payment..." : "I've Made Payment"}
        </button>
        
        <button
          onClick={onBack}
          className="w-full py-3 rounded-lg border border-gray-300 text-gray-700 font-medium transition-all hover:bg-gray-50"
        >
          Back to Order
        </button>
      </div>

      {/* Warning */}
      {timeRemaining <= 300 && ( // Show warning when 5 minutes or less
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
          <p className="text-red-800 font-medium">
            ⚠️ Payment time is running out!
          </p>
          <p className="text-sm text-red-600 mt-1">
            Complete your payment soon to avoid order cancellation
          </p>
        </div>
      )}
    </div>
  )
}