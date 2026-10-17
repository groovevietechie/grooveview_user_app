import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

/**
 * POST /api/spins/use
 * Deduct spin from customer and record result
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerId, rewardType, rewardLabel, rewardValue } = body

    if (!customerId || !rewardType) {
      return NextResponse.json(
        { error: "customerId and rewardType required" },
        { status: 400 }
      )
    }

    console.log(
      `[SpinUse] Customer ${customerId} used spin, won: ${rewardType}`
    )

    // Deduct spin from balance
    const { data: currentBalance, error: fetchError } = await supabase
      .from("customer_spins")
      .select("spin_balance, total_spins_used")
      .eq("customer_id", customerId)
      .single()

    if (fetchError) {
      console.error("[SpinUse] Error fetching balance:", fetchError)
      return NextResponse.json(
        { error: "Failed to fetch spin balance" },
        { status: 500 }
      )
    }

    if (!currentBalance || currentBalance.spin_balance <= 0) {
      return NextResponse.json(
        { error: "Insufficient spin balance" },
        { status: 400 }
      )
    }

    const newBalance = currentBalance.spin_balance - 1
    const newUsed = (currentBalance.total_spins_used || 0) + 1

    // Update balance
    const { error: updateError } = await supabase
      .from("customer_spins")
      .update({
        spin_balance: newBalance,
        total_spins_used: newUsed,
        updated_at: new Date().toISOString(),
      })
      .eq("customer_id", customerId)

    if (updateError) {
      console.error("[SpinUse] Error updating balance:", updateError)
      return NextResponse.json(
        { error: "Failed to update spin balance" },
        { status: 500 }
      )
    }

    // Check weekly cooldown for green drink if that's the reward
    let canRedeemGreenDrink = true
    let greenDrinkCooldownEndTime = null

    if (
      rewardType === "greenBeer" ||
      rewardLabel?.includes("Green") ||
      rewardLabel?.includes("green")
    ) {
      // Check if user redeemed green drink in the last 7 days
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const { data: recentGreen, error: greenError } = await supabase
        .from("spin_results_history")
        .select("spun_at, redeemed, redeemed_at")
        .eq("customer_id", customerId)
        .eq("reward_type", "greenBeer")
        .filter(
          "redeemed_at",
          "gte",
          sevenDaysAgo.toISOString()
        )
        .order("redeemed_at", { ascending: false })
        .limit(1)

      if (greenError) {
        console.warn("[SpinUse] Error checking green drink cooldown:", greenError)
      } else if (recentGreen && recentGreen.length > 0) {
        const lastRedeem = new Date(recentGreen[0].redeemed_at || recentGreen[0].spun_at)
        const nextAvailable = new Date(lastRedeem)
        nextAvailable.setDate(nextAvailable.getDate() + 7)

        canRedeemGreenDrink = false
        greenDrinkCooldownEndTime = nextAvailable.toISOString()

        console.log(
          `[SpinUse] Green drink cooldown active until ${greenDrinkCooldownEndTime}`
        )
      }
    }

    // Record spin result
    const { data: result, error: resultError } = await supabase
      .from("spin_results_history")
      .insert({
        customer_id: customerId,
        reward_type: rewardType,
        reward_label: rewardLabel || rewardType,
        reward_value: rewardValue || 0,
        cooldown_active:
          rewardType === "greenBeer" && !canRedeemGreenDrink ? true : false,
        cooldown_ends_at: greenDrinkCooldownEndTime,
      })
      .select()
      .single()

    if (resultError) {
      console.warn("[SpinUse] Error recording result:", resultError)
    }

    console.log(`[SpinUse] Updated balance for ${customerId}: ${newBalance} spins`)

    return NextResponse.json({
      success: true,
      newBalance,
      result,
      greenDrinkCooldown: {
        active: !canRedeemGreenDrink,
        cooldownEndsAt: greenDrinkCooldownEndTime,
      },
    })
  } catch (error) {
    console.error("[SpinUse] Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * GET /api/spins/use/history?customerId=UUID
 * Fetch spin usage history for customer
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get("customerId")

    if (!customerId) {
      return NextResponse.json(
        { error: "customerId parameter required" },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from("spin_results_history")
      .select("*")
      .eq("customer_id", customerId)
      .order("spun_at", { ascending: false })
      .limit(20)

    if (error) {
      console.error("[SpinHistory] Error fetching history:", error)
      return NextResponse.json(
        { error: "Failed to fetch spin history" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      history: data || [],
    })
  } catch (error) {
    console.error("[SpinHistory] Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
