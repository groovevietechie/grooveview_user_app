"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { XMarkIcon, CheckIcon, GiftIcon, SparklesIcon } from "@heroicons/react/24/outline"
import { getCustomerId } from "@/lib/device-identity"

interface Reward {
  id: string
  reward_type: string
  reward_label: string
  reward_value?: number | string
  earned_at: string
  redeemed: boolean
  redeemed_at?: string
  cooldown_active?: boolean
  cooldown_ends_at?: string
}

interface RewardSummary {
  [key: string]: {
    reward_type: string
    reward_label: string
    reward_value?: number | string
    count: number
    redeemed: number
    unredeemed: number
    lastEarned: string
    details: Reward[]
  }
}

interface MyRewardsPanelProps {
  isOpen: boolean
  onClose: () => void
}

export default function MyRewardsPanel({ isOpen, onClose }: MyRewardsPanelProps) {
  const customerId = getCustomerId() ?? undefined
  const [isLoading, setIsLoading] = useState(false)
  const [summary, setSummary] = useState<RewardSummary | null>(null)
  const [totalRewards, setTotalRewards] = useState(0)
  const [selectedTab, setSelectedTab] = useState<"all" | "unredeemed" | "redeemed">("unredeemed")
  const [redeemingId, setRedeemingId] = useState<string | null>(null)
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

  useEffect(() => {
    if (isOpen && customerId) {
      fetchRewards()
    }
  }, [isOpen, customerId])

  const handleClose = () => {
    setIsVisible(false)
    document.body.style.overflow = 'unset'
    setTimeout(() => {
      onClose()
    }, 300)
  }

  const fetchRewards = async () => {
    if (!customerId) return

    setIsLoading(true)
    try {
      const response = await fetch(
        `/api/spins/rewards-history?customerId=${customerId}`
      )

      if (response.ok) {
        const data = await response.json()
        setSummary(data.summary)
        setTotalRewards(data.totalRewards)
        console.log("[MyRewards] Fetched rewards:", data)
      }
    } catch (error) {
      console.error("[MyRewards] Error fetching rewards:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRedeemReward = async (rewardId: string) => {
    if (!customerId) return

    setRedeemingId(rewardId)
    try {
      const response = await fetch("/api/spins/rewards-history/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rewardId, customerId }),
      })

      if (response.ok) {
        console.log("[MyRewards] Reward redeemed successfully")
        // Refresh rewards
        await fetchRewards()
      } else {
        alert("Failed to redeem reward. Please try again.")
      }
    } catch (error) {
      console.error("[MyRewards] Error redeeming reward:", error)
      alert("Error redeeming reward")
    } finally {
      setRedeemingId(null)
    }
  }

  const getRewardIcon = (rewardType: string): string => {
    const icons: Record<string, string> = {
      greenBeer: "🍺",
      blackBeer: "🍺",
      cashback200: "💰",
      cashback50: "💵",
      discount10: "🏷️",
      tryAgain: "🎯",
    }
    return icons[rewardType] || "🎁"
  }

  const getRewardColor = (rewardType: string): string => {
    const colors: Record<string, string> = {
      greenBeer: "from-emerald-500/10 to-emerald-600/5 border-emerald-400/30",
      blackBeer: "from-slate-500/10 to-slate-600/5 border-slate-400/30",
      cashback200: "from-orange-500/10 to-orange-600/5 border-orange-400/30",
      cashback50: "from-amber-500/10 to-amber-600/5 border-amber-400/30",
      discount10: "from-purple-500/10 to-purple-600/5 border-purple-400/30",
      tryAgain: "from-red-500/10 to-red-600/5 border-red-400/30",
    }
    return colors[rewardType] || "from-blue-500/10 to-blue-600/5 border-blue-400/30"
  }

  const filterRewards = () => {
    if (!summary) return []

    const allRewards: Reward[] = []
    Object.values(summary).forEach((group) => {
      group.details.forEach((reward) => {
        if (selectedTab === "unredeemed" && !reward.redeemed) {
          allRewards.push(reward)
        } else if (selectedTab === "redeemed" && reward.redeemed) {
          allRewards.push(reward)
        } else if (selectedTab === "all") {
          allRewards.push(reward)
        }
      })
    })
    return allRewards.sort(
      (a, b) => new Date(b.earned_at).getTime() - new Date(a.earned_at).getTime()
    )
  }

  const unredeemedCount = summary
    ? Object.values(summary).reduce((sum, group) => sum + group.unredeemed, 0)
    : 0

  if (!isMounted) return null
  if (!isOpen && !isVisible) return null

  const panelContent = (
    <div
      className={`fixed inset-0 z-60 flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all duration-300 ${
        isVisible
          ? "bg-black/50 backdrop-blur-sm opacity-100"
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
        {/* Panel */}
        <div className="bg-gradient-to-b from-slate-900 via-blue-950 to-black rounded-t-3xl sm:rounded-3xl border border-amber-400/30 shadow-2xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-gradient-to-r from-slate-900/95 via-blue-950/95 to-black/95 backdrop-blur-md border-b border-amber-400/20 p-6 flex items-center justify-between rounded-t-3xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400/30 to-orange-400/20 flex items-center justify-center border border-amber-400/50">
                <GiftIcon className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-amber-50">My Rewards</h2>
                <p className="text-xs text-amber-200/60">
                  {unredeemedCount} reward{unredeemedCount !== 1 ? "s" : ""} available
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-full hover:bg-white/10 transition-colors text-amber-200/70 hover:text-amber-300"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-slate-700/50 p-4 flex gap-2 bg-black/20">
            {(["unredeemed", "all", "redeemed"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all capitalize ${
                  selectedTab === tab
                    ? "bg-amber-400/30 text-amber-100 border border-amber-400/50"
                    : "bg-white/5 text-slate-300 border border-slate-600/30 hover:bg-white/10"
                }`}
              >
                {tab === "unredeemed"
                  ? `Available (${unredeemedCount})`
                  : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <SparklesIcon className="w-8 h-8 text-amber-400 mx-auto mb-3 animate-spin" />
                <p className="text-slate-300">Loading rewards...</p>
              </div>
            ) : filterRewards().length === 0 ? (
              <div className="text-center py-8">
                <GiftIcon className="w-12 h-12 text-slate-600 mx-auto mb-3 opacity-50" />
                <p className="text-slate-400 font-semibold">
                  {selectedTab === "unredeemed"
                    ? "No available rewards yet"
                    : selectedTab === "redeemed"
                      ? "No redeemed rewards yet"
                      : "No rewards yet"}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Spin to earn rewards!
                </p>
              </div>
            ) : (
              filterRewards().map((reward, idx) => (
                <div
                  key={reward.id}
                  className={`bg-gradient-to-br ${getRewardColor(
                    reward.reward_type
                  )} rounded-lg border p-4 flex items-center justify-between gap-4 transition-all ${
                    reward.redeemed ? "opacity-60" : "hover:border-opacity-100"
                  }`}
                >
                  <div className="flex items-start gap-4 flex-1">
                    <span className="text-3xl">{getRewardIcon(reward.reward_type)}</span>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold">
                        {reward.reward_label}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(reward.earned_at).toLocaleDateString()}
                      </p>
                      {reward.redeemed && (
                        <p className="text-xs text-emerald-400 mt-1 font-semibold">
                          ✓ Redeemed on{" "}
                          {new Date(reward.redeemed_at!).toLocaleDateString()}
                        </p>
                      )}
                      {reward.cooldown_active && (
                        <p className="text-xs text-amber-400 mt-1">
                          ⏰ Cooldown until{" "}
                          {new Date(reward.cooldown_ends_at!).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>

                  {!reward.redeemed && (
                    <button
                      onClick={() => handleRedeemReward(reward.id)}
                      disabled={redeemingId === reward.id || reward.cooldown_active}
                      className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all ${
                        reward.cooldown_active
                          ? "bg-slate-600/30 text-slate-400 cursor-not-allowed"
                          : redeemingId === reward.id
                            ? "bg-blue-500/50 text-blue-100"
                            : "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:shadow-lg hover:shadow-emerald-500/50 active:scale-95"
                      }`}
                    >
                      {redeemingId === reward.id ? (
                        <span className="flex items-center gap-2">
                          <SparklesIcon className="w-4 h-4 animate-spin" />
                          Redeeming...
                        </span>
                      ) : reward.cooldown_active ? (
                        "On Cooldown"
                      ) : (
                        "Redeem"
                      )}
                    </button>
                  )}

                  {reward.redeemed && (
                    <div className="flex items-center gap-2 text-emerald-400">
                      <CheckIcon className="w-5 h-5" />
                      <span className="text-sm font-semibold">Done</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Summary */}
          {summary && Object.keys(summary).length > 0 && (
            <div className="border-t border-slate-700/50 bg-black/40 p-6">
              <h3 className="text-sm font-bold text-slate-300 mb-3">Reward Summary</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(summary).map(([type, group]) => (
                  <div
                    key={type}
                    className="bg-white/5 border border-slate-600/30 rounded-lg p-3 text-center"
                  >
                    <p className="text-2xl mb-1">{getRewardIcon(type)}</p>
                    <p className="text-xs text-slate-400">{group.reward_label}</p>
                    <p className="text-lg font-bold text-amber-400 mt-2">
                      {group.unredeemed}
                    </p>
                    <p className="text-xs text-slate-500">available</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return createPortal(panelContent, document.body)
}
