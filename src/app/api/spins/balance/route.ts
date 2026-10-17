import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

/**
 * GET /api/spins/balance?customerId=UUID
 * Fetch spin balance for a customer
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

    console.log(`[SpinBalance] Fetching balance for customer: ${customerId}`)

    let { data, error } = await supabase
      .from("customer_spins")
      .select("*")
      .eq("customer_id", customerId)
      .single()

    // If no record exists, create one with default values
    if (error && error.code === "PGRST116") {
      console.log(`[SpinBalance] No record found, creating new for customer: ${customerId}`)
      
      const { data: newRecord, error: insertError } = await supabase
        .from("customer_spins")
        .insert({
          customer_id: customerId,
          spin_balance: 0,
          total_spins_earned: 0,
          total_spins_used: 0,
        })
        .select()
        .single()

      if (insertError) {
        console.error("[SpinBalance] Error creating spin record:", insertError)
        return NextResponse.json(
          { error: "Failed to create spin balance" },
          { status: 500 }
        )
      }

      data = newRecord
    } else if (error) {
      console.error("[SpinBalance] Error fetching balance:", error)
      return NextResponse.json(
        { error: "Failed to fetch spin balance" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      balance: data,
    })
  } catch (error) {
    console.error("[SpinBalance] Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/spins/balance/award
 * Award spins to customer when order is completed (amount > 10,000)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerId, spinCount = 1, source, sourceId } = body

    if (!customerId) {
      return NextResponse.json(
        { error: "customerId required" },
        { status: 400 }
      )
    }

    console.log(
      `[SpinBalance] Awarding ${spinCount} spins to customer ${customerId}`
    )

    // Get or create customer spin record
    let { data: spinRecord, error: fetchError } = await supabase
      .from("customer_spins")
      .select("*")
      .eq("customer_id", customerId)
      .single()

    if (fetchError && fetchError.code === "PGRST116") {
      // Create new record
      const { data: newRecord } = await supabase
        .from("customer_spins")
        .insert({
          customer_id: customerId,
          spin_balance: spinCount,
          total_spins_earned: spinCount,
        })
        .select()
        .single()

      spinRecord = newRecord
    } else if (fetchError) {
      console.error("[SpinBalance] Error fetching record:", fetchError)
      return NextResponse.json(
        { error: "Failed to fetch spin balance" },
        { status: 500 }
      )
    }

    // Update balance
    const newBalance = (spinRecord?.spin_balance || 0) + spinCount
    const newEarned = (spinRecord?.total_spins_earned || 0) + spinCount

    const { data: updated, error: updateError } = await supabase
      .from("customer_spins")
      .update({
        spin_balance: newBalance,
        total_spins_earned: newEarned,
        updated_at: new Date().toISOString(),
      })
      .eq("customer_id", customerId)
      .select()
      .single()

    if (updateError) {
      console.error("[SpinBalance] Error updating balance:", updateError)
      return NextResponse.json(
        { error: "Failed to update spin balance" },
        { status: 500 }
      )
    }

    // Record usage history
    await supabase.from("spin_usage_history").insert({
      customer_id: customerId,
      spin_count: spinCount,
      source: source || "order_completion",
      source_id: sourceId,
    })

    console.log(
      `[SpinBalance] Updated balance for ${customerId}: ${newBalance} spins`
    )

    return NextResponse.json({
      success: true,
      spinBalance: updated,
      awarded: spinCount,
      newBalance,
    })
  } catch (error) {
    console.error("[SpinBalance] Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
