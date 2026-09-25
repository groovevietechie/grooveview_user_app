"use client"

import { useEffect } from 'react'

interface PremiumDealPopupProps {
  title: string
  subtitle: string
  amount: number
  onClose: () => void
  autoClose?: number
  themeColor?: string
}

export default function PremiumDealPopup({
  title,
  subtitle,
  amount,
  onClose,
  autoClose = 3000,
  themeColor = '#f6c945',
}: PremiumDealPopupProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, autoClose)
    return () => clearTimeout(timer)
  }, [autoClose, onClose])

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-xs animate-pop-in">
        {/* Glow effect */}
        <div
          className="absolute inset-0 rounded-3xl blur-3xl opacity-40"
          style={{ backgroundColor: themeColor }}
        />

        {/* Main card */}
        <div className="relative bg-gradient-to-br from-amber-900 to-black rounded-3xl p-8 text-center border border-amber-700 overflow-hidden">
          {/* Light rays effect */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 opacity-20"
            style={{
              background: `linear-gradient(180deg, ${themeColor} 0%, transparent 100%)`,
            }}
          />

          {/* Decorative particles */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-ping"
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: themeColor,
                  opacity: 0.7,
                  left: `${15 + i * 12}%`,
                  top: `${20 + (i % 3) * 30}%`,
                  animationDuration: `${2 + i * 0.2}s`,
                }}
              />
            ))}
          </div>

          <div className="relative z-10">
            {/* Main title */}
            <h2 className="text-white font-bold text-3xl mb-2 italic tracking-wide">{title}</h2>

            {/* Subtitle */}
            <p className="text-white/80 text-sm mb-6">{subtitle}</p>

            {/* Amount highlight */}
            <div className="inline-block px-6 py-3 rounded-full bg-gradient-to-r from-orange-400 to-yellow-400 mb-4">
              <p className="text-gray-900 font-bold text-lg">
                ₦{amount.toLocaleString()}
              </p>
            </div>

            {/* Call to action */}
            <p className="text-white/70 text-xs mt-6">
              Get it with {Math.floor(Math.random() * 3) + 1} orders
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
