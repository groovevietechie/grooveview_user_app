"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { XMarkIcon, CheckCircleIcon, SparklesIcon } from "@heroicons/react/24/outline"

interface HowToEarnSpinsModalProps {
  isOpen: boolean
  onClose: () => void
  themeColor?: string
}

export default function HowToEarnSpinsModal({
  isOpen,
  onClose,
  themeColor = "#fbbf24",
}: HowToEarnSpinsModalProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      document.body.style.overflow = 'hidden'
    }
  }, [isOpen])

  const handleClose = () => {
    setIsVisible(false)
    document.body.style.overflow = 'unset'
    setTimeout(() => {
      onClose()
    }, 300)
  }

  if (!isMounted) return null
  if (!isOpen && !isVisible) return null

  const modalContent = (
    <div
      className={`fixed inset-0 z-60 flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all duration-300 ${
        isVisible
          ? "bg-black/95 backdrop-blur-md opacity-100"
          : "bg-black/0 backdrop-blur-0 opacity-0 pointer-events-none"
      }`}
      onClick={handleClose}
    >
      <div
        className={`relative w-full sm:max-w-2xl mx-auto transform transition-all duration-300 ${
          isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Card */}
        <div className="bg-gradient-to-b from-slate-900 via-blue-950 to-black rounded-t-3xl sm:rounded-3xl border border-amber-400/30 shadow-2xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-gradient-to-r from-slate-900/95 via-blue-950/95 to-black/95 backdrop-blur-md border-b border-amber-400/20 p-6 flex items-center justify-between rounded-t-3xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400/30 to-orange-400/20 flex items-center justify-center border border-amber-400/50">
                <SparklesIcon className="w-6 h-6 text-amber-400" />
              </div>
              <h2 className="text-xl font-bold text-amber-50">How to Earn Spins</h2>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-full hover:bg-white/10 transition-colors text-amber-200/70 hover:text-amber-300"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 sm:p-8 space-y-8">
            {/* Section 1: How to Earn */}
            <div>
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-400/20 border border-amber-400/50 flex items-center justify-center">
                  <span className="text-sm font-bold text-amber-400">1</span>
                </div>
                How to Earn Spins
              </h3>

              <div className="bg-gradient-to-br from-slate-800/40 to-blue-900/40 border border-amber-400/20 rounded-2xl p-6 space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-400/30 to-emerald-600/20 border border-emerald-400/50">
                      <CheckCircleIcon className="h-6 w-6 text-emerald-400" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-semibold mb-1">Complete an Order Above ₦10,000</h4>
                    <p className="text-slate-300 text-sm">
                      Whenever you complete any order with a total value above ₦10,000, you automatically earn
                      <span className="font-bold text-amber-400 mx-1">1 SPIN</span>
                      instantly!
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-700/50 pt-4">
                  <p className="text-sm text-slate-400 flex items-start gap-2">
                    <span className="text-amber-400 font-bold flex-shrink-0">💡</span>
                    <span>
                      The spin will appear in your account when the order status changes to{" "}
                      <span className="text-amber-400 font-semibold">Completed</span>
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Section 2: How to Use Spins */}
            <div>
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-400/20 border border-amber-400/50 flex items-center justify-center">
                  <span className="text-sm font-bold text-amber-400">2</span>
                </div>
                How to Use Your Spins
              </h3>

              <div className="bg-gradient-to-br from-slate-800/40 to-blue-900/40 border border-amber-400/20 rounded-2xl p-6 space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-gradient-to-br from-blue-400/30 to-blue-600/20 border border-blue-400/50">
                      <span className="text-sm font-bold text-blue-400">1</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-semibold mb-1">Go to Spin Section</h4>
                    <p className="text-slate-300 text-sm">
                      Navigate to the{" "}
                      <span className="text-amber-400 font-semibold">Spin & Win</span>
                      section in the menu
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-gradient-to-br from-blue-400/30 to-blue-600/20 border border-blue-400/50">
                      <span className="text-sm font-bold text-blue-400">2</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-semibold mb-1">Check Your Balance</h4>
                    <p className="text-slate-300 text-sm">
                      You'll see how many spins you have available
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-gradient-to-br from-blue-400/30 to-blue-600/20 border border-blue-400/50">
                      <span className="text-sm font-bold text-blue-400">3</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-semibold mb-1">Tap "Spin Now"</h4>
                    <p className="text-slate-300 text-sm">
                      Click the spin button to use 1 spin and reveal your reward
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-400/30 to-emerald-600/20 border border-emerald-400/50">
                      <span className="text-sm font-bold text-emerald-400">4</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-semibold mb-1">Win Amazing Rewards!</h4>
                    <p className="text-slate-300 text-sm">
                      You could win free drinks, cashback, discounts, and more!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Available Rewards */}
            <div>
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-400/20 border border-amber-400/50 flex items-center justify-center">
                  <span className="text-sm font-bold text-amber-400">3</span>
                </div>
                What Can You Win?
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Green Beer */}
                <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-400/30 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">🍺</span>
                    <div className="flex-1">
                      <p className="font-semibold text-white">Free Green Drink</p>
                      <p className="text-xs text-slate-400 mt-1">
                        ✅ Redeemable once per week
                      </p>
                    </div>
                  </div>
                </div>

                {/* Black Beer */}
                <div className="bg-gradient-to-br from-slate-500/10 to-slate-600/5 border border-slate-400/30 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">🍺</span>
                    <div className="flex-1">
                      <p className="font-semibold text-white">Free Black Drink</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Premium quality beverage
                      </p>
                    </div>
                  </div>
                </div>

                {/* Cashback 200 */}
                <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-400/30 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">💰</span>
                    <div className="flex-1">
                      <p className="font-semibold text-white">₦200 Cashback</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Use on your next order
                      </p>
                    </div>
                  </div>
                </div>

                {/* Cashback 50 */}
                <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-400/30 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">💵</span>
                    <div className="flex-1">
                      <p className="font-semibold text-white">₦50 Cashback</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Quick bonus for your next purchase
                      </p>
                    </div>
                  </div>
                </div>

                {/* Discount */}
                <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-400/30 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">🏷️</span>
                    <div className="flex-1">
                      <p className="font-semibold text-white">10% Discount</p>
                      <p className="text-xs text-slate-400 mt-1">
                        On your next order
                      </p>
                    </div>
                  </div>
                </div>

                {/* Try Again */}
                <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-400/30 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">🎯</span>
                    <div className="flex-1">
                      <p className="font-semibold text-white">Try Again</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Spin another time for free!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: Tips */}
            <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-400/30 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-amber-100 mb-4 flex items-center gap-2">
                <span>💡</span>
                Pro Tips
              </h3>

              <ul className="space-y-3">
                <li className="flex gap-3 text-sm">
                  <span className="text-amber-400 font-bold">→</span>
                  <span className="text-slate-300">
                    Each order over ₦10,000 gives you 1 spin - place multiple orders to earn more spins!
                  </span>
                </li>
                <li className="flex gap-3 text-sm">
                  <span className="text-amber-400 font-bold">→</span>
                  <span className="text-slate-300">
                    Green drink reward is limited to once per week per customer
                  </span>
                </li>
                <li className="flex gap-3 text-sm">
                  <span className="text-amber-400 font-bold">→</span>
                  <span className="text-slate-300">
                    Rewards are automatically credited to your account after spinning
                  </span>
                </li>
                <li className="flex gap-3 text-sm">
                  <span className="text-amber-400 font-bold">→</span>
                  <span className="text-slate-300">
                    Keep playing to accumulate more spins and increase your chances of winning!
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gradient-to-t from-black/80 to-transparent border-t border-slate-700/50 p-6">
            <button
              onClick={handleClose}
              className="w-full px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 hover:shadow-lg hover:shadow-amber-400/50 transition-all duration-200 active:scale-95"
            >
              Got It! Ready to Earn Spins
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
