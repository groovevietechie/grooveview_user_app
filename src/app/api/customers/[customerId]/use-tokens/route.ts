import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ customerId: string }> }
) {
  try {
    const { customerId } = await context.params
    const { token_amount } = await request.json()

    if (!token_amount || token_amount <= 0) {
      return NextResponse.json(
        { error: "Invalid token amount" },
        { status: 400 }
      )
    }

    // Get current customer balance
    const { data: customer, error: fetchError } = await supabase
      .from("customers")
      .select("reward_tokens")
      .eq("id", customerId)
      .single()

    if (fetchError || !customer) {
      console.error("[UseTokens] Error fetching customer:", fetchError)
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      )
    }

    // Check if customer has enough tokens
    const currentBalance = customer.reward_tokens || 0
    if (currentBalance < token_amount) {
      return NextResponse.json(
        { error: "Insufficient token balance", success: false },
        { status: 400 }
      )
    }

    // Deduct tokens
    const { error: updateError } = await supabase
      .from("customers")
      .update({ reward_tokens: currentBalance - token_amount })
      .eq("id", customerId)

    if (updateError) {
      console.error("[UseTokens] Error deducting tokens:", updateError)
      return NextResponse.json(
        { error: "Failed to deduct tokens", success: false },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      new_balance: currentBalance - token_amount,
    })
  } catch (error) {
    console.error("[UseTokens] Error:", error)
    return NextResponse.json(
      { error: "Internal server error", success: false },
      { status: 500 }
    )
  }
}
