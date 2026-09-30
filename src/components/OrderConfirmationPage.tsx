"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import type { Business } from "@/types/database"
import { useBackNavigation } from "@/hooks/useBackNavigation"
import SuccessToast from "./SuccessToast"

interface OrderConfirmationPageProps {
  business: Business
  orderId: string
  showSuccess?: boolean
}

export default function OrderConfirmationPage({ business, orderId, showSuccess }: OrderConfirmationPageProps) {
  const router = useRouter()
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

      <div className="lounge-followup min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-black flex items-center justify-center px-4">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-lg border border-amber-400/30 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 bg-gradient-to-r from-amber-400 to-amber-500">
            <svg className="w-8 h-8 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-amber-50 mb-2">Order Confirmed!</h1>
          <p className="text-amber-200/70 mb-6">Your order has been received and is being prepared.</p>

          <div className="bg-slate-700/50 rounded-lg p-4 mb-6 border border-amber-400/20">
            <p className="text-sm text-amber-200/70 mb-1">Order ID</p>
            <p className="font-mono font-semibold text-lg text-amber-400">{orderId}</p>
          </div>

          <button
            onClick={() => router.push(`/b/${business.slug}/orders`)}
            className="w-full text-slate-900 py-3 px-4 rounded-lg font-semibold hover:opacity-90 transition-opacity mb-3 bg-gradient-to-r from-amber-400 to-amber-500 shadow-lg hover:shadow-amber-500/50"
          >
            Track Your Order
          </button>

          <button
            onClick={() => router.push(`/b/${business.slug}`)}
            className="w-full text-amber-300 py-3 px-4 rounded-lg font-semibold border border-amber-400/40 hover:bg-slate-700/30 transition-colors bg-slate-700/20"
          >
            Back to Menu
          </button>
        </div>
      </div>
    </>
  )
}
