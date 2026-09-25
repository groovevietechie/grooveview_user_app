"use client"

import { useEffect } from 'react'

interface RewardNotificationPopupProps {
  title: string
  subtitle: string
  onClose: () => void
  autoClose?: number
  themeColor?: string
}

export default function RewardNotificationPopup({
  title,
  subtitle,
  onClose,
  autoClose = 4000,
  themeColor = '#f6c945',
}: RewardNotificationPopupProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, autoClose)
    return () => clearTimeout(timer)
  }, [autoClose, onClose])

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-xs animate-pop-in">
        {/* Glow effect */}
        <div
          className="absolute inset-0 rounded-3xl blur-2xl opacity-30"
          style={{ backgroundColor: themeColor }}
        />

        {/* Main card */}
        <div className="relative bg-gradient-to-b from-gray-900 to-black rounded-3xl p-8 text-center border border-gray-700">
          {/* Top accent light */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 rounded-full blur-xl opacity-50"
            style={{ backgroundColor: themeColor }}
          />

          {/* Congratulation icon/emoji */}
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 mb-4">
              <span className="text-2xl">🎉</span>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-white font-bold text-2xl mb-2 italic">{title}</h2>

          {/* Subtitle */}
          <p
            className="text-lg font-bold mb-6"
            style={{ color: themeColor }}
          >
            {subtitle}
          </p>

          {/* Decorative particles */}
          <div className="absolute inset-0 overflow-hidden rounded-3xl">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-float"
                style={{
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  backgroundColor: themeColor,
                  opacity: 0.6,
                  left: `${20 + i * 15}%`,
                  top: `${30 + (i % 2) * 40}%`,
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
