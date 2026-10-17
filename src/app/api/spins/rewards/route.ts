import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

/**
 * GET /api/spins/rewards
 * Fetch all enabled spin reward options from database
 * Used to populate the spin wheel dynamically
 */
export async function GET(request: NextRequest) {
  try {
    console.log("[SpinRewards] Fetching rewards from database")

    const { data, error } = await supabase
      .from("spin_rewards")
      .select("*")
      .eq("enabled", true)
      .order("probability", { ascending: false })

    if (error) {
      console.error("[SpinRewards] Error fetching rewards:", error)
      return NextResponse.json(
        { error: "Failed to fetch spin rewards" },
        { status: 500 }
      )
    }

    console.log(`[SpinRewards] Found ${data?.length || 0} enabled rewards`)

    return NextResponse.json({
      success: true,
      rewards: data || [],
      count: data?.length || 0,
    })
  } catch (error) {
    console.error("[SpinRewards] Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/spins/rewards
 * Admin: Create or update spin reward option
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      reward_type,
      label,
      description,
      icon,
      value,
      color,
      probability,
      enabled,
    } = body

    if (!reward_type || !label) {
      return NextResponse.json(
        { error: "Missing required fields: reward_type, label" },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from("spin_rewards")
      .upsert(
        {
          reward_type,
          label,
          description,
          icon,
          value,
          color,
          probability: probability || 1.0,
          enabled: enabled !== false,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "reward_type" }
      )
      .select()
      .single()

    if (error) {
      console.error("[SpinRewards] Error upserting reward:", error)
      return NextResponse.json(
        { error: "Failed to save reward" },
        { status: 500 }
      )
    }

    console.log(`[SpinRewards] Updated reward: ${reward_type}`)
    return NextResponse.json({ success: true, reward: data })
  } catch (error) {
    console.error("[SpinRewards] Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
