import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

/**
 * GET /api/spins/rewards-history?customerId=UUID
 * Fetch all earned rewards for a customer (earned but not yet redeemed)
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

    // Get all spin results for this customer
    const { data: results, error } = await supabase
      .from("spin_results_history")
      .select("*")
      .eq("customer_id", customerId)
      .order("spun_at", { ascending: false })

    if (error) {
      console.error("[RewardsHistory] Error fetching rewards:", error)
      return NextResponse.json(
        { error: "Failed to fetch rewards history" },
        { status: 500 }
      )
    }

    // Group rewards by type and count unredeemed
    const rewardsSummary: Record<string, any> = {}

    results?.forEach((result: any) => {
      if (!rewardsSummary[result.reward_type]) {
        rewardsSummary[result.reward_type] = {
          reward_type: result.reward_type,
          reward_label: result.reward_label,
          reward_value: result.reward_value,
          count: 0,
          redeemed: 0,
          unredeemed: 0,
          lastEarned: result.spun_at,
          details: [],
        }
      }

      rewardsSummary[result.reward_type].count += 1
      if (result.redeemed) {
        rewardsSummary[result.reward_type].redeemed += 1
      } else {
        rewardsSummary[result.reward_type].unredeemed += 1
      }
      rewardsSummary[result.reward_type].details.push({
        id: result.id,
        earned_at: result.spun_at,
        redeemed: result.redeemed,
        redeemed_at: result.redeemed_at,
        cooldown_active: result.cooldown_active,
        cooldown_ends_at: result.cooldown_ends_at,
      })
    })

    return NextResponse.json({
      success: true,
      customerId,
      totalRewards: results?.length || 0,
      summary: rewardsSummary,
      details: results || [],
    })
  } catch (error) {
    console.error("[RewardsHistory] Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/spins/rewards-history/redeem
 * Mark a reward as redeemed
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { rewardId, customerId } = body

    if (!rewardId || !customerId) {
      return NextResponse.json(
        { error: "rewardId and customerId required" },
        { status: 400 }
      )
    }

    // Mark reward as redeemed
    const { error: updateError } = await supabase
      .from("spin_results_history")
      .update({
        redeemed: true,
        redeemed_at: new Date().toISOString(),
      })
      .eq("id", rewardId)
      .eq("customer_id", customerId)

    if (updateError) {
      console.error("[RedeemReward] Error redeeming reward:", updateError)
      return NextResponse.json(
        { error: "Failed to redeem reward" },
        { status: 500 }
      )
    }

    console.log(`[RedeemReward] Reward ${rewardId} redeemed for ${customerId}`)

    return NextResponse.json({
      success: true,
      message: "Reward redeemed successfully",
    })
  } catch (error) {
    console.error("[RedeemReward] Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
