"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import type { Business } from "@/types/database"
import { useTheme } from "@/contexts/ThemeContext"
import { useBackNavigation } from "@/hooks/useBackNavigation"
import SuccessToast from "./SuccessToast"

interface OrderConfirmationPageProps {
  business: Business
  orderId: string
  showSuccess?: boolean
}

export default function OrderConfirmationPage({ business, orderId, showSuccess }: OrderConfirmationPageProps) {
  const router = useRouter()
  const { primaryColor } = useTheme()
  const [showToast, setShowToast] = useState(showSuccess || false)

  // Use the back navigation hook - back should go to menu
  useBackNavigation({
    fallbackRoute: `/b/${business.slug}`
  })

  return (
    <>
      {showToast && (
        <SuccessToast
          message="Your order has been placed successfully!"
          orderId={orderId}
          businessSlug={business.slug}
          onDismiss={() => {
            setShowToast(false)
            setTimeout(() => router.push(`/b/${business.slug}`), 500)
          }}
        />
      )}

      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div
            style={{ backgroundColor: primaryColor, color: "white" }}
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
          <p className="text-gray-600 mb-6">Your order has been received and is being prepared.</p>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-1">Order ID</p>
            <p className="font-mono font-semibold text-lg text-gray-900">{orderId}</p>
          </div>

          <button
            onClick={() => router.push(`/b/${business.slug}/orders`)}
            style={{ backgroundColor: primaryColor }}
            className="w-full text-white py-3 px-4 rounded-lg font-semibold hover:opacity-90 transition-opacity mb-3"
          >
            Track Your Order
          </button>

          <button
            onClick={() => router.push(`/b/${business.slug}`)}
            className="w-full text-gray-600 py-3 px-4 rounded-lg font-semibold border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Back to Menu
          </button>
        </div>
      </div>
    </>
  )
}
