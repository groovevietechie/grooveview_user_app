import { useState, useCallback, useEffect } from 'react'

export type RewardType = 
  | 'greenBeer' 
  | 'blackBeer' 
  | 'tryAgain' 
  | 'cashback200' 
  | 'cashback50' 
  | 'discount10'

export interface Reward {
  id: string
  type: RewardType
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
}

const REWARDS: Record<RewardType, Omit<Reward, 'id' | 'earnedAt' | 'redeemed'>> = {
  greenBeer: {
    type: 'greenBeer',
    label: '1 Green Bottled Beer',
    description: 'Enjoy a refreshing green bottled beer',
    icon: '🍺',
    probability: 4,
    color: '#10b981',
  },
  blackBeer: {
    type: 'blackBeer',
    label: '1 Black Bottled Beer',
    description: 'Enjoy a premium black bottled beer',
    icon: '🍺',
    probability: 3,
    color: '#1f2937',
  },
  tryAgain: {
    type: 'tryAgain',
    label: 'Try Again Tomorrow',
    description: 'Better luck next time! Come back tomorrow',
    icon: '🎲',
    probability: 80,
    color: '#6b7280',
  },
  cashback200: {
    type: 'cashback200',
    label: '₦200 Cashback',
    description: 'Get ₦200 cashback on your next order',
    value: 200,
    icon: '💰',
    probability: 5,
    color: '#f97316',
  },
  cashback50: {
    type: 'cashback50',
    label: '₦50 Cashback',
    description: 'Get ₦50 cashback on your next order',
    value: 50,
    icon: '💵',
    probability: 6,
    color: '#eab308',
  },
  discount10: {
    type: 'discount10',
    label: '10% Discount on ₦100k+ bills',
    description: 'Get 10% off on orders over ₦100,000',
    value: '10%',
    icon: '🏷️',
    probability: 2,
    color: '#ec4899',
  },
}

const STORAGE_KEY = 'dailySpinWheel'
const SPIN_COOLDOWN_MS = 24 * 60 * 60 * 1000 // 24 hours

export const useDailySpinWheel = (customerId?: string) => {
  const [lastSpinTime, setLastSpinTime] = useState<number | null>(null)
  const [spinResults, setSpinResults] = useState<SpinResult[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load spin data from localStorage
  useEffect(() => {
    const loadSpinData = () => {
      try {
        const storageKey = customerId ? `${STORAGE_KEY}_${customerId}` : STORAGE_KEY
        const data = localStorage.getItem(storageKey)
        if (data) {
          const parsed = JSON.parse(data)
          setLastSpinTime(parsed.lastSpinTime)
          setSpinResults(parsed.results || [])
        }
      } catch (error) {
        console.error('Failed to load spin data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadSpinData()
  }, [customerId])

  // Save spin data to localStorage
  const saveSpinData = useCallback((time: number, results: SpinResult[]) => {
    try {
      const storageKey = customerId ? `${STORAGE_KEY}_${customerId}` : STORAGE_KEY
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          lastSpinTime: time,
          results,
          version: 1,
        })
      )
    } catch (error) {
      console.error('Failed to save spin data:', error)
    }
  }, [customerId])

  // Check if user can spin today
  const canSpinToday = useCallback(() => {
    if (!lastSpinTime) return true
    const now = Date.now()
    return now - lastSpinTime > SPIN_COOLDOWN_MS
  }, [lastSpinTime])

  // Get time until next spin
  const getTimeUntilNextSpin = useCallback(() => {
    if (!lastSpinTime) return null
    const now = Date.now()
    const timeSinceLastSpin = now - lastSpinTime
    const timeRemaining = SPIN_COOLDOWN_MS - timeSinceLastSpin

    if (timeRemaining <= 0) return null

    const hours = Math.floor(timeRemaining / (60 * 60 * 1000))
    const minutes = Math.floor((timeRemaining % (60 * 60 * 1000)) / (60 * 1000))
    const seconds = Math.floor((timeRemaining % (60 * 1000)) / 1000)

    return { hours, minutes, seconds }
  }, [lastSpinTime])

  // Calculate weighted random reward based on probabilities
  const selectReward = useCallback((): RewardType => {
    const random = Math.random() * 100
    let cumulative = 0

    const rewardOrder: RewardType[] = ['greenBeer', 'blackBeer', 'tryAgain', 'cashback200', 'cashback50', 'discount10']

    for (const rewardType of rewardOrder) {
      cumulative += REWARDS[rewardType].probability
      if (random <= cumulative) {
        return rewardType
      }
    }

    // Fallback
    return 'tryAgain'
  }, [])

  // Execute spin
  const performSpin = useCallback((): SpinResult | null => {
    if (!canSpinToday()) {
      return null
    }

    const rewardType = selectReward()
    const rewardConfig = REWARDS[rewardType]
    const now = new Date().toISOString()

    const result: SpinResult = {
      reward: {
        id: `${rewardType}_${Date.now()}`,
        ...rewardConfig,
        earnedAt: now,
        redeemed: false,
      },
      spinTime: now,
      redeemed: false,
    }

    const newResults = [result, ...spinResults]
    const newLastSpinTime = Date.now()

    setLastSpinTime(newLastSpinTime)
    setSpinResults(newResults)
    saveSpinData(newLastSpinTime, newResults)

    return result
  }, [canSpinToday, selectReward, spinResults, saveSpinData])

  // Mark reward as redeemed
  const redeemReward = useCallback((rewardId: string) => {
    setSpinResults(prev => {
      const updated = prev.map(result => 
        result.reward.id === rewardId
          ? { ...result, reward: { ...result.reward, redeemed: true }, redeemed: true }
          : result
      )
      saveSpinData(lastSpinTime || Date.now(), updated)
      return updated
    })
  }, [lastSpinTime, saveSpinData])

  // Get unread results (not redeemed)
  const getUnredeemedRewards = useCallback(() => {
    return spinResults.filter(r => !r.redeemed)
  }, [spinResults])

  // Get all rewards for display
  const getAllRewards = useCallback(() => {
    return spinResults
  }, [spinResults])

  return {
    lastSpinTime,
    spinResults,
    canSpinToday: canSpinToday(),
    timeUntilNextSpin: getTimeUntilNextSpin(),
    performSpin,
    redeemReward,
    getUnredeemedRewards,
    getAllRewards,
    isLoading,
    REWARDS,
  }
}
