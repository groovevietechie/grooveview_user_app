"use client"

import { XMarkIcon } from '@heroicons/react/24/outline'

interface LimitedOfferPopupProps {
  title: string
  amount: number
  description: string
  expiresIn: string
  onClose: () => void
  onConfirm: () => void
  themeColor?: string
}

export default function LimitedOfferPopup({
  title,
  amount,
  description,
  expiresIn,
  onClose,
  onConfirm,
  themeColor = '#f6c945',
}: LimitedOfferPopupProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-gradient-to-br from-orange-50 to-amber-50 rounded-3xl p-8 relative animate-scale-in border-2" style={{ borderColor: themeColor }}>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
        >
          <XMarkIcon className="w-5 h-5 text-gray-700" />
        </button>

        {/* Decorative coins */}
        <div className="absolute top-4 left-4 text-2xl opacity-60">💰</div>
        <div className="absolute bottom-32 right-4 text-xl opacity-40">💰</div>

        {/* Main heading */}
        <h2 className="text-center font-bold mb-2" style={{ color: themeColor, fontSize: '1.5rem' }}>
          {title}
        </h2>

        {/* Subtext */}
        <p className="text-center text-gray-600 text-sm font-medium mb-6">{description}</p>

        {/* Amount box */}
        <div className="bg-white border-2 border-dashed border-orange-200 rounded-2xl p-6 mb-6 text-center">
          <p className="text-gray-500 text-xs mb-2 font-medium">{description}</p>
          <p className="text-3xl font-bold" style={{ color: themeColor }}>
            ₦{amount.toLocaleString()}
          </p>
        </div>

        {/* Timer */}
        <div className="text-center mb-6">
          <p className="text-gray-600 text-sm font-medium">Ends in</p>
          <p className="text-2xl font-bold text-orange-600">{expiresIn}</p>
        </div>

        {/* Action button */}
        <button
          onClick={onConfirm}
          className="w-full py-3 rounded-full text-white font-bold text-sm transition-all hover:shadow-lg active:scale-95"
          style={{ backgroundColor: themeColor, color: '#1a1410' }}
        >
          Pick now
        </button>
      </div>
    </div>
  )
}
