"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import type { Business } from "@/types/database"
import { useTheme } from "@/contexts/ThemeContext"
import SuccessToast from "@/components/SuccessToast"

interface OrderConfirmationPageProps {
  business: Business
  orderId: string
  showSuccess?: boolean
}

export default function OrderConfirmationPage({ business, orderId, showSuccess }: OrderConfirmationPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { primaryColor } = useTheme()
  const [showToast, setShowToast] = useState(showSuccess || searchParams.get("success") === "true")

  // ... rest of existing code ...

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
        {/* ... rest of existing component ... */}
      </div>
    </>
  )
}
