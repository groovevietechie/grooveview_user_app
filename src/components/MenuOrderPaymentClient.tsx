"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import type { Business } from "@/types/database"
import { useTheme } from "@/contexts/ThemeContext"
import MenuOrderPaymentPage from "./MenuOrderPaymentPage"
import { confirmMenuOrderPayment } from "@/lib/api"

interface MenuOrderPaymentClientProps {
  business: Business
  orderId: string
  transferCode: string
  totalAmount: number
}

export default function MenuOrderPaymentClient({ 
  business, 
  orderId, 
  transferCode, 
  totalAmount 
}: MenuOrderPaymentClientProps) {
  const router = useRouter()
  const { primaryColor } = useTheme()
  const [isProcessing, setIsProcessing] = useState(false)

  // Determine order type from session storage or default to 'table'
  const getOrderType = () => {
    if (typeof window !== 'undefined') {
      const orderType = sessionStorage.getItem(`${business.id}_order_type`)
      return orderType || 'table'
    }
    return 'table'
  }

  const handlePaymentComplete = async () => {
    setIsProcessing(true)
    try {
      // Call API to confirm payment
      const success = await confirmMenuOrderPayment(orderId)
      
      if (success) {
        // Clear any stored transfer info
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem(`${business.id}_transfer_code`)
          sessionStorage.removeItem(`${business.id}_transfer_amount`)
          sessionStorage.removeItem(`${business.id}_order_type`)
        }
        
        // Redirect to order confirmation
        router.push(`/b/${business.slug}/order/${orderId}?success=true`)
      } else {
        alert("Failed to confirm payment. Please try again or contact support.")
      }
    } catch (error) {
      console.error("Error confirming payment:", error)
      alert("An error occurred while confirming payment. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBack = () => {
    router.push(`/b/${business.slug}/checkout`)
  }

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Processing payment confirmation...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <MenuOrderPaymentPage
          business={business}
          orderId={orderId}
          totalAmount={totalAmount}
          transferCode={transferCode}
          orderType={getOrderType()}
          onPaymentComplete={handlePaymentComplete}
          onBack={handleBack}
          themeColor={primaryColor}
        />
      </div>
    </div>
  )
}