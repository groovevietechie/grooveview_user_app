"use client"

import { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface SpinWheelPopupProps {
  title: string
  subtitle: string
  onClose: () => void
  onConfirm: () => void
  themeColor?: string
}

const WHEEL_SEGMENTS = [
  { label: '1 more chance', color: '#e8d4a8' },
  { label: '₦300,000', color: '#ff7043', highlight: true },
  { label: '0000₦', color: '#e8d4a8' },
  { label: '₦150,000', color: '#e8d4a8' },
]

export default function SpinWheelPopup({
  title,
  subtitle,
  onClose,
  onConfirm,
  themeColor = '#f6c945',
}: SpinWheelPopupProps) {
  const [isSpinning, setIsSpinning] = useState(false)
  const [rotation, setRotation] = useState(0)

  const handleSpin = () => {
    if (isSpinning) return

    setIsSpinning(true)
    const randomSpin = Math.random() * 360 + 1800 // At least 5 full rotations
    setRotation(randomSpin)

    setTimeout(() => {
      setIsSpinning(false)
    }, 3000)
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end">
      <div className="w-full max-w-md mx-auto bg-gradient-to-b from-gray-900 to-black rounded-t-3xl p-6 pb-8 animate-slide-up border border-t-2" style={{ borderColor: themeColor }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors"
        >
          <XMarkIcon className="w-5 h-5 text-white" />
        </button>

        {/* Title */}
        <div className="text-center mb-6">
          <h3 className="text-white font-bold text-xl mb-1">{title}</h3>
          <p className="text-white/60 text-sm">{subtitle}</p>
        </div>

        {/* Spin Wheel */}
        <div className="flex justify-center mb-8">
          <div className="relative w-64 h-64">
            {/* Wheel */}
            <svg
              className="w-full h-full"
              viewBox="0 0 300 300"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: isSpinning ? 'transform 3s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none',
              }}
            >
              {WHEEL_SEGMENTS.map((segment, index) => {
                const angle = (360 / WHEEL_SEGMENTS.length) * index
                const sliceAngle = 360 / WHEEL_SEGMENTS.length
                const startAngle = angle * (Math.PI / 180)
                const endAngle = (angle + sliceAngle) * (Math.PI / 180)

                const x1 = 150 + 130 * Math.cos(startAngle)
                const y1 = 150 + 130 * Math.sin(startAngle)
                const x2 = 150 + 130 * Math.cos(endAngle)
                const y2 = 150 + 130 * Math.sin(endAngle)

                const largeArc = sliceAngle > 180 ? 1 : 0

                return (
                  <g key={index}>
                    {/* Slice */}
                    <path
                      d={`M 150 150 L ${x1} ${y1} A 130 130 0 ${largeArc} 1 ${x2} ${y2} Z`}
                      fill={segment.color}
                      stroke="#f5e6d3"
                      strokeWidth="2"
                    />
                    {/* Text */}
                    <text
                      x={150 + 90 * Math.cos((startAngle + endAngle) / 2)}
                      y={150 + 90 * Math.sin((startAngle + endAngle) / 2)}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={segment.highlight ? 'white' : '#8b6f47'}
                      fontSize="13"
                      fontWeight="bold"
                      className="pointer-events-none"
                    >
                      {segment.label}
                    </text>
                  </g>
                )
              })}
            </svg>

            {/* Center Circle */}
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                transform: `rotate(${-rotation}deg)`,
              }}
            >
              <button
                onClick={handleSpin}
                disabled={isSpinning}
                className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-900 to-black border-4 flex items-center justify-center font-bold text-white text-xs hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
                style={{ borderColor: themeColor }}
              >
                Spin
              </button>
            </div>

            {/* Pointer */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-6 bg-white rounded-b-sm" style={{ background: themeColor }} />
          </div>
        </div>

        {/* Description */}
        <p className="text-center text-white/50 text-xs mb-6">
          The reward is provided for qualifying orders only.
        </p>

        {/* Action Button */}
        <button
          onClick={onConfirm}
          className="w-full py-3 rounded-full text-white font-bold text-sm transition-all hover:shadow-lg active:scale-95"
          style={{ backgroundColor: themeColor, color: '#1a1410' }}
        >
          Stop
        </button>
      </div>
    </div>
  )
}
