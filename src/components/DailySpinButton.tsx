"use client"

import { useState, useEffect } from 'react'
import { useDailySpinWheel } from '@/hooks/useDailySpinWheel'
import { getCustomerId } from '@/lib/device-identity'

interface DailySpinButtonProps {
  onOpenSpin: () => void
  themeColor?: string
}

export default function DailySpinButton({ onOpenSpin, themeColor = '#f6c945' }: DailySpinButtonProps) {
  const customerId = getCustomerId()
  const { canSpinToday, timeUntilNextSpin, isLoading } = useDailySpinWheel(customerId)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  if (isLoading || !isLoaded) return null

  return (
    <button
      onClick={onOpenSpin}
      disabled={!canSpinToday}
      className="fixed bottom-20 right-6 z-40 group relative"
      title={canSpinToday ? 'Play Daily Spin Wheel' : 'Already spun today'}
    >
      {/* Glow effect */}
      {canSpinToday && (
        <div
          className="absolute inset-0 rounded-full blur-lg opacity-50 group-hover:opacity-75 transition-opacity"
          style={{ backgroundColor: themeColor }}
        />
      )}

      {/* Button */}
      <div
        className={`relative w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold transition-all ${
          canSpinToday
            ? 'shadow-lg hover:scale-110 active:scale-95 cursor-pointer'
            : 'opacity-50 cursor-not-allowed'
        }`}
        style={{ backgroundColor: themeColor, color: '#1a1410' }}
      >
        🎡
      </div>

      {/* Badge */}
      {!canSpinToday && timeUntilNextSpin && (
        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
          ⏰
        </div>
      )}

      {/* Tooltip */}
      <div
        className="absolute bottom-full right-0 mb-2 px-3 py-2 rounded-lg bg-gray-900 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-gray-700"
        style={{ color: 'white' }}
      >
        {canSpinToday ? 'Daily Spin' : `Wait ${timeUntilNextSpin?.hours || 0}h`}
      </div>
    </button>
  )
}
