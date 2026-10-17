import { useState, useCallback, useEffect } from 'react'

export type RewardType = string

export interface Reward {
  id: string
  reward_type: RewardType
  label: string
  description: string
  value?: number | string
  icon?: string
  probability: number
  color: string
  earnedAt: string
  redeemed: boolean
}

export interface SpinResult {
  reward: Reward
  spinTime: string
  redeemed: boolean
  greenDrinkCooldown?: {
    active: boolean
    cooldownEndsAt: string | null
    timeRemaining?: {
      days: number
      hours: number
      minutes: number
      seconds: number
    } | null
  } | null
}

const STORAGE_KEY = 'dailySpinWheel'

// Default rewards fallback if database is unavailable
const DEFAULT_REWARDS: Record<string, any> = {
  greenBeer: {
    reward_type: 'greenBeer',
    label: '🍺 Green Bottled Drink',
    description: 'Free green bottled drink - redeemable once a week',
    icon: '🍺',
    probability: 25,
    color: '#34d399',
    value: 1,
  },
  blackBeer: {
    reward_type: 'blackBeer',
    label: '🍺 Black Bottled Drink',
    description: 'Free black bottled drink',
    icon: '🍺',
    probability: 15,
    color: '#6b7280',
    value: 1,
  },
  cashback200: {
    reward_type: 'cashback200',
    label: '₦200 Cashback',
    description: 'Get ₦200 cashback on your next order',
    value: 200,
    icon: '💰',
    probability: 20,
    color: '#f97316',
  },
  cashback50: {
    reward_type: 'cashback50',
    label: '₦50 Cashback',
    description: 'Get ₦50 cashback on your next order',
    value: 50,
    icon: '💵',
    probability: 20,
    color: '#fbbf24',
  },
  discount10: {
    reward_type: 'discount10',
    label: '10% Discount',
    description: 'Get 10% discount on your next order',
    value: 10,
    icon: '🏷️',
    probability: 15,
    color: '#8b5cf6',
  },
  tryAgain: {
    reward_type: 'tryAgain',
    label: '🎯 Try Again',
    description: 'Spin again for free!',
    icon: '🎯',
    probability: 5,
    color: '#ef4444',
    value: 0,
  },
}

export const useDailySpinWheel = (customerId?: string) => {
  const [spinResults, setSpinResults] = useState<SpinResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [rewards, setRewards] = useState<Record<string, any>>(DEFAULT_REWARDS)
  const [spinBalance, setSpinBalance] = useState(0)

  // Load rewards from database
  useEffect(() => {
    const fetchRewards = async () => {
      try {
        const response = await fetch('/api/spins/rewards')
        if (response.ok) {
          const data = await response.json()
          const rewardsMap: Record<string, any> = {}
          
          data.rewards?.forEach((reward: any) => {
            rewardsMap[reward.reward_type] = {
              reward_type: reward.reward_type,
              label: reward.label,
              description: reward.description,
              icon: reward.icon,
              probability: reward.probability,
              color: reward.color,
              value: reward.value,
            }
          })

          if (Object.keys(rewardsMap).length > 0) {
            setRewards(rewardsMap)
            console.log('[useDailySpinWheel] Loaded rewards from database')
          }
        }
      } catch (error) {
        console.warn('[useDailySpinWheel] Failed to fetch rewards, using defaults:', error)
      }
    }

    fetchRewards()
  }, [])

  // Load spin balance for customer
  useEffect(() => {
    if (!customerId) return

    const fetchSpinBalance = async () => {
      try {
        const response = await fetch(`/api/spins/balance?customerId=${customerId}`)
        if (response.ok) {
          const data = await response.json()
          setSpinBalance(data.balance?.spin_balance || 0)
          console.log(`[useDailySpinWheel] Spin balance for ${customerId}: ${data.balance?.spin_balance || 0}`)
        }
      } catch (error) {
        console.warn('[useDailySpinWheel] Failed to fetch spin balance:', error)
      }
    }

    fetchSpinBalance()
    setIsLoading(false)
  }, [customerId])

  // Check if user can spin
  const canSpinToday = useCallback(() => {
    if (spinBalance <= 0) return false
    return true
  }, [spinBalance])

  // Calculate weighted random reward based on probabilities
  const selectReward = useCallback((): string => {
    const rewardEntries = Object.entries(rewards)
    if (rewardEntries.length === 0) return 'tryAgain'

    const random = Math.random() * 100
    let cumulative = 0

    for (const [key, reward] of rewardEntries) {
      cumulative += reward.probability
      if (random <= cumulative) {
        return key
      }
    }

    // Fallback
    return 'tryAgain'
  }, [rewards])

  // Execute spin - deducts from balance and records result
  const performSpin = useCallback(async (customerId: string): Promise<SpinResult | null> => {
    if (!canSpinToday()) {
      console.warn('[useDailySpinWheel] Cannot spin: no balance')
      return null
    }

    const rewardType = selectReward()
    const rewardConfig = rewards[rewardType]
    const now = new Date().toISOString()

    // Deduct spin from balance via API
    try {
      const response = await fetch('/api/spins/use', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          rewardType,
          rewardLabel: rewardConfig.label,
          rewardValue: rewardConfig.value,
        }),
      })

      if (!response.ok) {
        console.error('[useDailySpinWheel] Failed to use spin')
        return null
      }

      const data = await response.json()
      setSpinBalance(data.newBalance)

      const result: SpinResult = {
        reward: {
          id: `${rewardType}_${Date.now()}`,
          reward_type: rewardType,
          ...rewardConfig,
          earnedAt: now,
          redeemed: false,
        },
        spinTime: now,
        redeemed: false,
        greenDrinkCooldown: data.greenDrinkCooldown || null,
      }

      const newResults = [result, ...spinResults]
      setSpinResults(newResults)

      return result
    } catch (error) {
      console.error('[useDailySpinWheel] Error performing spin:', error)
      return null
    }
  }, [canSpinToday, selectReward, rewards, spinResults])

  return {
    canSpinToday: canSpinToday(),
    performSpin,
    rewards,
    REWARDS: rewards,
    spinBalance,
    isLoading,
    spinResults,
  }
}
