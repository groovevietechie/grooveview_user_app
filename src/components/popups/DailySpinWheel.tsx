"use client"

import { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useDailySpinWheel, type RewardType } from '@/hooks/useDailySpinWheel'
import { getCustomerId } from '@/lib/device-identity'

interface DailySpinWheelProps {
  isOpen: boolean
  onClose: () => void
  themeColor?: string
}

const REWARD_ORDER: RewardType[] = ['greenBeer', 'blackBeer', 'tryAgain', 'cashback200', 'cashback50', 'discount10']

export default function DailySpinWheel({
  isOpen,
  onClose,
  themeColor = '#f6c945',
}: DailySpinWheelProps) {
  const customerId = getCustomerId()
  const { canSpinToday, timeUntilNextSpin, performSpin, REWARDS, isLoading } = useDailySpinWheel(customerId)
  const [isSpinning, setIsSpinning] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [result, setResult] = useState<any>(null)
  const [showResult, setShowResult] = useState(false)

  if (!isOpen || isLoading) return null

  const handleSpin = () => {
    if (isSpinning || !canSpinToday) return

    setIsSpinning(true)
    setShowResult(false)

    // Calculate spin rotation - ensure it lands on different segments
    const spinResult = performSpin()
    if (!spinResult) {
      setIsSpinning(false)
      return
    }

    // Find the reward index and calculate rotation
    const rewardIndex = REWARD_ORDER.indexOf(spinResult.reward.type)
    const segmentAngle = 360 / REWARD_ORDER.length
    const targetRotation = (rewardIndex * segmentAngle) + (segmentAngle / 2)
    const randomSpin = Math.random() * 360 + 1800 // At least 5 full rotations

    setRotation(randomSpin + (360 - targetRotation))
    setResult(spinResult)

    setTimeout(() => {
      setIsSpinning(false)
      setShowResult(true)
    }, 3500)
  }

  const handleClose = () => {
    setResult(null)
    setShowResult(false)
    setRotation(0)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-gradient-to-b from-gray-900 to-black rounded-3xl md:rounded-3xl p-8 relative border border-gray-700 animate-slide-up md:animate-pop-in max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors z-10"
        >
          <XMarkIcon className="w-5 h-5 text-white" />
        </button>

        {!showResult ? (
          <>
            {/* Title */}
            <div className="text-center mb-8">
              <h3 className="text-white font-bold text-3xl mb-2">Daily Spin Wheel</h3>
              <p className="text-white/60 text-sm">
                {canSpinToday ? 'Spin today and win amazing rewards!' : 'Come back tomorrow for another spin!'}
              </p>
            </div>

            {/* Spinning Wheel */}
            <div className="flex justify-center mb-8">
              <div className="relative w-80 h-80">
                {/* Outer Glow */}
                <div
                  className="absolute inset-0 rounded-full blur-2xl opacity-30"
                  style={{ backgroundColor: themeColor }}
                />

                {/* Wheel Container */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 border-4 border-gray-700 shadow-2xl flex items-center justify-center">
                  {/* SVG Wheel */}
                  <svg
                    className="w-full h-full"
                    viewBox="0 0 400 400"
                    style={{
                      transform: `rotate(${rotation}deg)`,
                      transition: isSpinning ? 'transform 3.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none',
                    }}
                  >
                    {REWARD_ORDER.map((rewardType, index) => {
                      const reward = REWARDS[rewardType]
                      const sliceAngle = 360 / REWARD_ORDER.length
                      const startAngle = (index * sliceAngle) * (Math.PI / 180)
                      const endAngle = ((index + 1) * sliceAngle) * (Math.PI / 180)

                      const x1 = 200 + 180 * Math.cos(startAngle)
                      const y1 = 200 + 180 * Math.sin(startAngle)
                      const x2 = 200 + 180 * Math.cos(endAngle)
                      const y2 = 200 + 180 * Math.sin(endAngle)

                      const largeArc = sliceAngle > 180 ? 1 : 0

                      return (
                        <g key={rewardType}>
                          {/* Slice */}
                          <path
                            d={`M 200 200 L ${x1} ${y1} A 180 180 0 ${largeArc} 1 ${x2} ${y2} Z`}
                            fill={reward.color}
                            stroke="#1f2937"
                            strokeWidth="2"
                            opacity="0.9"
                          />
                          {/* Slice border highlight */}
                          <path
                            d={`M 200 200 L ${x1} ${y1} A 180 180 0 ${largeArc} 1 ${x2} ${y2} Z`}
                            fill="none"
                            stroke={reward.color}
                            strokeWidth="1"
                            opacity="0.5"
                          />
                          {/* Label */}
                          <text
                            x={200 + 120 * Math.cos((startAngle + endAngle) / 2)}
                            y={200 + 120 * Math.sin((startAngle + endAngle) / 2)}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill="white"
                            fontSize="11"
                            fontWeight="bold"
                            className="pointer-events-none select-none"
                            style={{
                              textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                            }}
                          >
                            <tspan x={200 + 120 * Math.cos((startAngle + endAngle) / 2)} dy="0">
                              {reward.icon}
                            </tspan>
                            <tspan
                              x={200 + 120 * Math.cos((startAngle + endAngle) / 2)}
                              dy="14"
                              fontSize="9"
                            >
                              {reward.label.split('\n')[0]}
                            </tspan>
                          </text>
                        </g>
                      )
                    })}

                    {/* Center circle */}
                    <circle
                      cx="200"
                      cy="200"
                      r="50"
                      fill="url(#centerGradient)"
                      stroke={themeColor}
                      strokeWidth="3"
                    />
                    <circle
                      cx="200"
                      cy="200"
                      r="40"
                      fill="#1f2937"
                    />

                    <defs>
                      <radialGradient id="centerGradient">
                        <stop offset="0%" stopColor={themeColor} />
                        <stop offset="100%" stopColor="#b8860b" />
                      </radialGradient>
                    </defs>

                    {/* Center text */}
                    <text
                      x="200"
                      y="200"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="white"
                      fontSize="24"
                      fontWeight="bold"
                      className="pointer-events-none select-none"
                    >
                      SPIN
                    </text>
                  </svg>

                  {/* Pointer */}
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-6 z-10" style={{ borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: themeColor }} />
                </div>

                {/* Outer decorative ring */}
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-gray-600 opacity-30" />
              </div>
            </div>

            {/* Spin Button or Cooldown Message */}
            <div className="text-center">
              {canSpinToday ? (
                <button
                  onClick={handleSpin}
                  disabled={isSpinning}
                  className="px-12 py-4 rounded-full text-white font-bold text-lg transition-all hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:hover:shadow-none disabled:active:scale-100 mb-4"
                  style={{ backgroundColor: themeColor, color: '#1a1410' }}
                >
                  {isSpinning ? 'Spinning...' : 'SPIN NOW'}
                </button>
              ) : (
                <div className="bg-gray-800 rounded-full p-6 mb-4">
                  <p className="text-white font-semibold mb-2">Next Spin Available In:</p>
                  <p className="text-3xl font-bold" style={{ color: themeColor }}>
                    {timeUntilNextSpin
                      ? `${String(timeUntilNextSpin.hours).padStart(2, '0')}:${String(timeUntilNextSpin.minutes).padStart(2, '0')}:${String(timeUntilNextSpin.seconds).padStart(2, '0')}`
                      : 'Loading...'}
                  </p>
                </div>
              )}
              <p className="text-white/50 text-xs">One spin per day. Come back tomorrow!</p>
            </div>
          </>
        ) : result ? (
          <>
            {/* Result Screen */}
            <div className="text-center py-8">
              {/* Celebration Animation */}
              <div className="mb-8">
                <div className="text-6xl mb-4 animate-bounce">{result.reward.icon}</div>
              </div>

              {/* Result Title */}
              <h2 className="text-3xl font-bold text-white mb-2">Congratulations!</h2>
              <p className="text-xl font-semibold mb-6" style={{ color: themeColor }}>
                {result.reward.label}
              </p>

              {/* Result Description */}
              <p className="text-white/80 text-lg mb-8">{result.reward.description}</p>

              {/* Celebration particles */}
              <div className="relative h-20 mb-8">
                {[...Array(10)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute animate-float"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      fontSize: '2rem',
                      opacity: 0.7,
                      animation: `float ${2 + Math.random() * 2}s ease-in-out infinite`,
                      animationDelay: `${Math.random() * 0.5}s`,
                    }}
                  >
                    ✨
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 flex-col sm:flex-row">
                <button
                  onClick={handleClose}
                  className="flex-1 px-6 py-3 rounded-full text-white font-semibold transition-all hover:shadow-lg active:scale-95"
                  style={{ backgroundColor: themeColor, color: '#1a1410' }}
                >
                  Claim Reward
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 px-6 py-3 rounded-full bg-gray-700 hover:bg-gray-600 text-white font-semibold transition-all"
                >
                  Done
                </button>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
