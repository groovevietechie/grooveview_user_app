import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

/**
 * POST /api/customers/[customerId]/award-tokens
 * Award 2% reward tokens to a customer for a completed (served) order.
 * Looks up customer via customer_devices since orders.customer_id references auth.users.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ customerId: string }> }
) {
  try {
    const { customerId } = await context.params
    const body = await request.json()
    const { order_id, order_total } = body

    console.log(`[AwardTokens] Request: customerId=${customerId}, order_id=${order_id}, order_total=${order_total}`)

    if (!order_id || order_total === undefined || order_total === null || order_total <= 0) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    // Fetch the order — tokens_awarded may not exist if migration hasn't run
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, status, total_amount, tokens_awarded, device_id")
      .eq("id", order_id)
      .single()

    if (orderError || !order) {
      console.error("[AwardTokens] Order fetch error:", orderError)
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    console.log(`[AwardTokens] Order: status=${order.status}, tokens_awarded=${order.tokens_awarded}, device_id=${order.device_id}`)

    // Idempotency check — tokens_awarded column may be null if migration hasn't run
    if (order.tokens_awarded === true) {
      const { data: customer } = await supabase
        .from("customers")
        .select("reward_tokens")
        .eq("id", customerId)
        .single()
      return NextResponse.json({ success: true, already_awarded: true, new_balance: customer?.reward_tokens ?? 0 })
    }

    // Verify this customer owns this order via customer_devices
    if (order.device_id) {
      const { data: device } = await supabase
        .from("customer_devices")
        .select("customer_id")
        .eq("device_id", order.device_id)
        .single()

      if (device && device.customer_id !== customerId) {
        console.error(`[AwardTokens] Device belongs to different customer: ${device.customer_id} vs ${customerId}`)
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
      }
    }

    // Calculate 2% token reward
    const tokensToAward = Math.round(order_total * 0.02 * 100) / 100

    // Get current balance
    const { data: customer, error: fetchError } = await supabase
      .from("customers")
      .select("reward_tokens")
      .eq("id", customerId)
      .single()

    if (fetchError || !customer) {
      console.error("[AwardTokens] Customer fetch error:", fetchError)
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    const newBalance = (customer.reward_tokens || 0) + tokensToAward
    console.log(`[AwardTokens] Awarding ₦${tokensToAward}, balance: ${customer.reward_tokens} -> ${newBalance}`)

    // Update customer balance and mark order awarded
    const [balanceResult, flagResult] = await Promise.all([
      supabase.from("customers").update({ reward_tokens: newBalance }).eq("id", customerId),
      supabase.from("orders").update({ tokens_awarded: true }).eq("id", order_id),
    ])

    if (balanceResult.error) {
      console.error("[AwardTokens] Balance update error:", balanceResult.error)
      return NextResponse.json({ error: "Failed to update balance" }, { status: 500 })
    }

    if (flagResult.error) {
      console.warn("[AwardTokens] Could not set tokens_awarded flag:", flagResult.error.message)
    }

    return NextResponse.json({ success: true, tokens_awarded: tokensToAward, new_balance: newBalance })

    // Update customer balance
    const { error: balanceError } = await supabase
      .from("customers")
      .update({ reward_tokens: newBalance })
      .eq("id", customerId)

    if (balanceError) {
      console.error("[AwardTokens] Balance update error:", balanceError)
      return NextResponse.json({ error: "Failed to update balance" }, { status: 500 })
    }

    // Mark order as awarded — column may not exist yet if migration hasn't run
    const { error: flagError } = await supabase
      .from("orders")
      .update({ tokens_awarded: true })
      .eq("id", order_id)

    if (flagError) {
      console.warn("[AwardTokens] tokens_awarded column missing — run database_migration_tokens_awarded.sql:", flagError?.message)
      // Still return success since balance was updated; client uses localStorage as fallback
    }

    return NextResponse.json({
      success: true,
      tokens_awarded: tokensToAward,
      new_balance: newBalance,
      flag_saved: flagError == null,
    })
  } catch (error) {
    console.error("[AwardTokens] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
