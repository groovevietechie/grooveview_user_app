import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

/**
 * GET /api/spins/cooldown?customerId=UUID&rewardType=greenBeer
 * Check if a reward has an active cooldown
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get("customerId")
    const rewardType = searchParams.get("rewardType") || "greenBeer"

    if (!customerId) {
      return NextResponse.json(
        { error: "customerId parameter required" },
        { status: 400 }
      )
    }

    // Only green drink has weekly cooldown
    if (rewardType !== "greenBeer") {
      return NextResponse.json({
        success: true,
        cooldownActive: false,
        cooldownEndsAt: null,
        timeRemaining: null,
      })
    }

    // Check if user has redeemed green drink in the last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: recentGreen, error: greenError } = await supabase
      .from("spin_results_history")
      .select("spun_at, redeemed, redeemed_at, cooldown_ends_at")
      .eq("customer_id", customerId)
      .eq("reward_type", rewardType)
      .gte("redeemed_at", sevenDaysAgo.toISOString())
      .order("redeemed_at", { ascending: false })
      .limit(1)

    if (greenError) {
      console.error("[SpinCooldown] Error checking cooldown:", greenError)
      return NextResponse.json(
        { error: "Failed to check cooldown status" },
        { status: 500 }
      )
    }

    // No recent redemption = no cooldown
    if (!recentGreen || recentGreen.length === 0) {
      return NextResponse.json({
        success: true,
        cooldownActive: false,
        cooldownEndsAt: null,
        timeRemaining: null,
      })
    }

    // Calculate cooldown end time (7 days from redemption)
    const lastRedeem = new Date(
      recentGreen[0].redeemed_at || recentGreen[0].spun_at
    )
    const cooldownEnds = new Date(lastRedeem)
    cooldownEnds.setDate(cooldownEnds.getDate() + 7)

    const now = new Date()
    const isActive = now < cooldownEnds

    if (isActive) {
      // Calculate time remaining
      const diff = cooldownEnds.getTime() - now.getTime()
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      console.log(
        `[SpinCooldown] Green drink cooldown active for ${customerId} until ${cooldownEnds.toISOString()}`
      )

      return NextResponse.json({
        success: true,
        cooldownActive: true,
        cooldownEndsAt: cooldownEnds.toISOString(),
        timeRemaining: { days, hours, minutes, seconds },
      })
    }

    // Cooldown has expired
    return NextResponse.json({
      success: true,
      cooldownActive: false,
      cooldownEndsAt: null,
      timeRemaining: null,
    })
  } catch (error) {
    console.error("[SpinCooldown] Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
