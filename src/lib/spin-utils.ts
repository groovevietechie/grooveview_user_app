/**
 * Spin System Utilities
 * Helper functions for spin mechanics, cooldowns, and rewards
 */

export interface CooldownInfo {
  isActive: boolean
  endsAt: Date | null
  timeRemaining: {
    days: number
    hours: number
    minutes: number
    seconds: number
  } | null
}

/**
 * Check if green drink cooldown is active for a customer
 * Green drink can only be redeemed once per 7 days
 */
export async function checkGreenDrinkCooldown(
  customerId: string
): Promise<CooldownInfo> {
  try {
    const response = await fetch(
      `/api/spins/cooldown?customerId=${customerId}&rewardType=greenBeer`
    )

    if (!response.ok) {
      console.warn("[SpinUtils] Failed to check cooldown")
      return {
        isActive: false,
        endsAt: null,
        timeRemaining: null,
      }
    }

    const data = await response.json()
    return {
      isActive: data.cooldownActive || false,
      endsAt: data.cooldownEndsAt ? new Date(data.cooldownEndsAt) : null,
      timeRemaining: data.timeRemaining || null,
    }
  } catch (error) {
    console.error("[SpinUtils] Error checking cooldown:", error)
    return {
      isActive: false,
      endsAt: null,
      timeRemaining: null,
    }
  }
}

/**
 * Calculate time remaining for cooldown
 */
export function calculateTimeRemaining(
  endsAt: Date | string
): {
  days: number
  hours: number
  minutes: number
  seconds: number
} | null {
  const endDate = typeof endsAt === "string" ? new Date(endsAt) : endsAt
  const now = new Date()
  const diff = endDate.getTime() - now.getTime()

  if (diff <= 0) {
    return null
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  return { days, hours, minutes, seconds }
}

/**
 * Format cooldown time for display
 */
export function formatCooldownTime(
  timeRemaining: {
    days: number
    hours: number
    minutes: number
    seconds: number
  } | null
): string {
  if (!timeRemaining) return "Expired"

  const parts = []
  if (timeRemaining.days > 0) parts.push(`${timeRemaining.days}d`)
  if (timeRemaining.hours > 0) parts.push(`${timeRemaining.hours}h`)
  if (timeRemaining.minutes > 0) parts.push(`${timeRemaining.minutes}m`)

  return parts.length > 0 ? parts.join(" ") : "Less than 1 minute"
}

/**
 * Check if spin result is a green drink
 */
export function isGreenDrinkReward(
  rewardType: string,
  rewardLabel?: string
): boolean {
  return (
    rewardType === "greenBeer" ||
    (rewardLabel && rewardLabel.includes("Green")) ||
    (rewardLabel && rewardLabel.includes("green"))
  )
}

/**
 * Determine if reward can be redeemed immediately
 */
export async function canRedeemReward(
  customerId: string,
  rewardType: string
): Promise<{ canRedeem: boolean; reason?: string }> {
  // Only green drink has cooldown restrictions
  if (!isGreenDrinkReward(rewardType)) {
    return { canRedeem: true }
  }

  const cooldown = await checkGreenDrinkCooldown(customerId)
  if (cooldown.isActive) {
    const timeStr = formatCooldownTime(cooldown.timeRemaining)
    return {
      canRedeem: false,
      reason: `Green drink available again in ${timeStr}`,
    }
  }

  return { canRedeem: true }
}
