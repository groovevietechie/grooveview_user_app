"use client"

import { useState, useEffect } from 'react'
import { useDailySpinWheel } from '@/hooks/useDailySpinWheel'
import { getCustomerId } from '@/lib/device-identity'
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'

interface RewardRedemptionProps {
  themeColor?: string
}

export default function RewardRedemption({ themeColor = '#f6c945' }: RewardRedemptionProps) {
  const customerId = getCustomerId()
  const { getAllRewards, getUnredeemedRewards, redeemReward, isLoading } = useDailySpinWheel(customerId)
  const [rewards, setRewards] = useState<any[]>([])
  const [unredeemedCount, setUnredeemedCount] = useState(0)

  useEffect(() => {
    if (!isLoading) {
      const allRewards = getAllRewards()
      const unredeemed = getUnredeemedRewards()
      setRewards(allRewards)
      setUnredeemedCount(unredeemed.length)
    }
  }, [isLoading, getAllRewards, getUnredeemedRewards])

  const handleRedeem = (rewardId: string) => {
    redeemReward(rewardId)
    setRewards(prev => 
      prev.map(r => 
        r.reward.id === rewardId 
          ? { ...r, reward: { ...r.reward, redeemed: true }, redeemed: true }
          : r
      )
    )
    setUnredeemedCount(prev => Math.max(0, prev - 1))
  }

  if (isLoading) {
    return null
  }

  if (rewards.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* Unredeemed Rewards Banner */}
      {unredeemedCount > 0 && (
        <div
          className="px-4 py-3 rounded-lg text-white font-semibold flex items-center justify-between"
          style={{ backgroundColor: themeColor }}
        >
          <div>
            <span className="text-lg">🎁</span>
            <span className="ml-2">{unredeemedCount} unredeemed reward{unredeemedCount !== 1 ? 's' : ''}</span>
          </div>
          <span className="text-sm opacity-80">Click to redeem</span>
        </div>
      )}

      {/* Rewards Grid */}
      <div className="space-y-2">
        {rewards.map((result) => {
          const reward = result.reward
          const earnedDate = new Date(reward.earnedAt)
          const formattedDate = earnedDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })

          return (
            <div
              key={reward.id}
              className={`p-4 rounded-lg border-2 transition-all ${
                reward.redeemed
                  ? 'bg-gray-900/50 border-gray-700 opacity-60'
                  : 'border-gray-700 hover:border-gray-500 cursor-pointer hover:shadow-lg'
              }`}
              onClick={() => !reward.redeemed && handleRedeem(reward.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  {/* Icon */}
                  <div className="text-2xl mt-1">{reward.icon}</div>

                  {/* Content */}
                  <div className="flex-1">
                    <h4 className="font-bold text-white text-sm mb-1">{reward.label}</h4>
                    <p className="text-xs text-white/60 mb-2">{reward.description}</p>
                    <p className="text-xs text-white/40">{formattedDate}</p>
                  </div>
                </div>

                {/* Status */}
                <div className="flex-shrink-0">
                  {reward.redeemed ? (
                    <div className="flex flex-col items-center gap-1">
                      <CheckCircleIcon className="w-6 h-6 text-green-500" />
                      <span className="text-xs text-green-500 font-semibold">Redeemed</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className="w-6 h-6 rounded-full border-2 flex items-center justify-center"
                        style={{ borderColor: themeColor, backgroundColor: `${themeColor}20` }}
                      >
                        <span className="text-xs font-bold" style={{ color: themeColor }}>
                          ✓
                        </span>
                      </div>
                      <span className="text-xs font-semibold" style={{ color: themeColor }}>
                        Ready
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Empty State */}
      {rewards.length === 0 && (
        <div className="text-center py-8 px-4 bg-gray-900/50 rounded-lg border border-gray-700">
          <p className="text-white/60 text-sm">No rewards yet. Play the daily spin wheel to earn rewards!</p>
        </div>
      )}
    </div>
  )
}
