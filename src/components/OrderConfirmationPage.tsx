'use client'

import { useRouter } from 'next/navigation'
import { Business } from '@/types/database'
import { useTheme } from '@/contexts/ThemeContext'
import { CheckCircleIcon } from '@heroicons/react/24/solid'

interface OrderConfirmationPageProps {
  business: Business
  orderId: string
}

export default function OrderConfirmationPage({ business, orderId }: OrderConfirmationPageProps) {
  const router = useRouter()
  const { primaryColor } = useTheme()

  const handleBackToMenu = () => {
    router.push(`/b/${business.slug}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-sm border p-8 text-center">
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <CheckCircleIcon className="w-16 h-16 text-green-500" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
        <p className="text-gray-600 mb-6">
          Your order has been successfully placed at {business.name}
        </p>

        {/* Order Details */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-600">Order ID</p>
          <p className="font-mono text-lg font-semibold text-gray-900">{orderId}</p>
        </div>

        {/* Instructions */}
        <div className="text-left space-y-3 mb-8">
          <h3 className="font-semibold text-gray-900">What’s next?</h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>• You’ll receive updates on your order status</li>
            <li>• Our team will prepare your order shortly</li>
            <li>• Payment will be collected as selected</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleBackToMenu}
            style={{ backgroundColor: primaryColor }}
            className="w-full text-white py-3 px-6 rounded-lg transition-colors font-semibold"
          >
            Order More Items
          </button>

          <button
            onClick={() => router.push('/')}
            className="w-full text-gray-600 py-2 px-6 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Back to Home
          </button>
        </div>

        {/* Business Contact */}
        {(business.phone || business.address) && (
          <div className="mt-8 pt-6 border-t text-left">
            <h4 className="font-semibold text-gray-900 mb-2">Need help?</h4>
            <div className="text-sm text-gray-600 space-y-1">
              {business.phone && <p>📞 {business.phone}</p>}
              {business.address && <p>📍 {business.address}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}