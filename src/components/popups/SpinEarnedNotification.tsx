"use client"

import { useState, useEffect } from "react"
import { SparklesIcon, CheckCircleIcon, XMarkIcon } from "@heroicons/react/24/outline"

interface SpinEarnedNotificationProps {
  isOpen: boolean
  onClose: () => void
  spinCount: number
  orderAmount: number
  themeColor?: string
}

export default function SpinEarnedNotification({
  isOpen,
  onClose,
  spinCount,
  orderAmount,
  themeColor = "#fbbf24",
}: SpinEarnedNotificationProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      // Auto-close after 4 seconds
      const timer = setTimeout(() => {
        handleClose()
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => {
      onClose()
    }, 300)
  }

  if (!isOpen && !isVisible) return null

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
        isVisible
          ? "bg-black/40 backdrop-blur-sm opacity-100"
          : "bg-black/0 backdrop-blur-0 opacity-0 pointer-events-none"
      }`}
    >
      <div
        className={`relative w-full max-w-md mx-auto transform transition-all duration-300 ${
          isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        {/* Main Card */}
        <div className="relative bg-gradient-to-br from-slate-900 via-blue-950 to-black rounded-3xl border border-amber-400/30 shadow-2xl overflow-hidden">
          {/* Animated Background Glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-amber-400/0 via-amber-400/5 to-amber-400/0 animate-pulse"></div>

          {/* Content */}
          <div className="relative p-8 sm:p-10">
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors text-amber-400/70 hover:text-amber-300"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>

            {/* Icon with Animation */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                {/* Outer rotating ring */}
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-amber-400 border-r-amber-400 animate-spin"></div>

                {/* Middle pulsing ring */}
                <div className="absolute inset-2 rounded-full border border-amber-400/30 animate-pulse"></div>

                {/* Inner icon */}
                <div
                  className="relative w-20 h-20 rounded-full flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${themeColor}20, ${themeColor}40)`,
                    border: `2px solid ${themeColor}`,
                  }}
                >
                  <SparklesIcon className="w-10 h-10 text-amber-400 animate-bounce" />
                </div>
              </div>
            </div>

            {/* Text Content */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent mb-2">
                Spin Earned!
              </h2>
              <p className="text-slate-300 text-lg font-semibold mb-1">
                Congratulations! 🎉
              </p>
              <p className="text-slate-400 text-sm">
                Your order of ₦{orderAmount.toLocaleString()} qualifies you for a spin
              </p>
            </div>

            {/* Spin Count Display */}
            <div className="bg-gradient-to-r from-amber-400/10 to-orange-400/10 border border-amber-400/30 rounded-2xl p-6 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400/30 to-orange-400/20 flex items-center justify-center border border-amber-400/50">
                    <span className="text-2xl font-black text-amber-400">
                      {spinCount}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-300">
                      Spin{spinCount > 1 ? "s" : ""} Earned
                    </p>
                    <p className="text-sm text-slate-400">
                      Ready to spin!
                    </p>
                  </div>
                </div>
                <CheckCircleIcon className="w-8 h-8 text-emerald-400" />
              </div>
            </div>

            {/* How It Works */}
            <div className="space-y-3 mb-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
                What's Next?
              </p>

              <div className="flex gap-3 items-start">
                <div className="w-6 h-6 rounded-full bg-amber-400/20 border border-amber-400/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-amber-400">1</span>
                </div>
                <p className="text-sm text-slate-300">
                  Go to the <span className="text-amber-400 font-semibold">Spin</span> section in your menu
                </p>
              </div>

              <div className="flex gap-3 items-start">
                <div className="w-6 h-6 rounded-full bg-amber-400/20 border border-amber-400/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-amber-400">2</span>
                </div>
                <p className="text-sm text-slate-300">
                  Tap <span className="text-amber-400 font-semibold">Spin Now</span> to use your spin
                </p>
              </div>

              <div className="flex gap-3 items-start">
                <div className="w-6 h-6 rounded-full bg-amber-400/20 border border-amber-400/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-amber-400">3</span>
                </div>
                <p className="text-sm text-slate-300">
                  Win rewards like free drinks, discounts, or cashback!
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleClose}
                className="w-full px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 hover:shadow-lg hover:shadow-amber-400/50 transition-all duration-200 active:scale-95"
              >
                Got It! Let's Spin
              </button>

              <button
                onClick={handleClose}
                className="w-full px-6 py-3 rounded-xl font-semibold text-amber-400 border border-amber-400/40 hover:bg-amber-400/10 transition-all duration-200"
              >
                Later
              </button>
            </div>

            {/* Fun Footer */}
            <p className="text-center text-xs text-slate-500 mt-4">
              ✨ Keep placing orders to earn more spins!
            </p>
          </div>
        </div>

        {/* Decorative Corners */}
        <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-amber-400/30 rounded-tl-lg pointer-events-none"></div>
        <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-amber-400/30 rounded-tr-lg pointer-events-none"></div>
        <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-amber-400/30 rounded-bl-lg pointer-events-none"></div>
        <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-amber-400/30 rounded-br-lg pointer-events-none"></div>
      </div>
    </div>
  )
}
