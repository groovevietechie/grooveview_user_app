"use client"

import { XMarkIcon } from '@heroicons/react/24/outline'

interface CouponOfferPopupProps {
  title: string
  amount: number
  description: string
  expiresIn: string
  onClose: () => void
  onConfirm: () => void
  themeColor?: string
}

export default function CouponOfferPopup({
  title,
  amount,
  description,
  expiresIn,
  onClose,
  onConfirm,
  themeColor = '#f6c945',
}: CouponOfferPopupProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-8 relative animate-scale-in border-2" style={{ borderColor: themeColor }}>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
        >
          <XMarkIcon className="w-5 h-5 text-gray-700" />
        </button>

        {/* Avatar */}
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center text-xl font-bold text-white ring-4 ring-orange-200">
            🎯
          </div>
        </div>

        {/* Badge */}
        <div className="flex justify-center mb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 rounded-full">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-green-700 font-bold text-xs">Sh'em</span>
          </div>
        </div>

        {/* Amount */}
        <h3 className="text-center text-3xl font-bold text-orange-600 mb-2">
          ₦{amount.toLocaleString()}
        </h3>

        {/* Description */}
        <p className="text-center text-gray-600 font-medium mb-6">{description}</p>

        {/* Details grid */}
        <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
          <div>
            <p className="text-gray-500 text-xs">From</p>
            <p className="text-gray-700 font-semibold">Event</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Type</p>
            <p className="text-gray-700 font-semibold">Coupons</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Date</p>
            <p className="text-gray-700 font-semibold">{expiresIn}</p>
          </div>
        </div>

        {/* Action button */}
        <button
          onClick={onConfirm}
          className="w-full py-3 rounded-full text-white font-bold text-sm transition-all hover:shadow-lg active:scale-95 mb-3"
          style={{ backgroundColor: themeColor, color: '#1a1410' }}
        >
          Confirm Now
        </button>

        {/* Footer text */}
        <p className="text-center text-xs text-gray-600">
          With qualifying orders{' '}
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-300 text-gray-600 text-xs">
            ⓘ
          </span>
        </p>
      </div>
    </div>
  )
}
