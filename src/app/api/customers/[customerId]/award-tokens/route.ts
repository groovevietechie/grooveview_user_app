import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

const TOKEN_NOTE_PATTERN = /\[reward_tokens_used:(\d+(?:\.\d+)?)\]/i
const CUSTOMER_PROFILE_NOTE_PATTERN = /\[customer_profile_id:([^\]]+)\]/i
const TOKEN_REDEEMED_MARKER = "[reward_tokens_redeemed]"

function getTokenAmountFromNote(note?: string | null): number {
  const match = note?.match(TOKEN_NOTE_PATTERN)
  return match ? Number(match[1]) || 0 : 0
}

function noteBelongsToCustomer(note: string | null | undefined, customerId: string): boolean {
  const match = note?.match(CUSTOMER_PROFILE_NOTE_PATTERN)
  return match?.[1] === customerId
}

function hasRedeemedMarker(note?: string | null): boolean {
  return note?.toLowerCase().includes(TOKEN_REDEEMED_MARKER) === true
}

function appendRedeemedMarker(note?: string | null): string {
  const cleanNote = note?.trim()
  if (!cleanNote) return TOKEN_REDEEMED_MARKER
  if (hasRedeemedMarker(cleanNote)) return cleanNote
  return `${cleanNote}\n${TOKEN_REDEEMED_MARKER}`
}

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
    let { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, status, total_amount, tokens_awarded, device_id, customer_note")
      .eq("id", order_id)
      .single()

    if (orderError) {
      const fallback = await supabase
        .from("orders")
        .select("id, status, total_amount, device_id, customer_note")
        .eq("id", order_id)
        .single()

      order = fallback.data ? { ...fallback.data, tokens_awarded: false } : null
      orderError = fallback.error
    }

    if (orderError || !order) {
      console.error("[AwardTokens] Order fetch error:", orderError)
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    console.log(`[AwardTokens] Order: status=${order.status}, tokens_awarded=${order.tokens_awarded}, device_id=${order.device_id}`)

    // Idempotency check — tokens_awarded column may be null if migration hasn't run
    if (order.tokens_awarded === true) {
      const { data: customer } = await supabase
        .from("customers")
        .select("*")
        .eq("id", customerId)
        .single()
      return NextResponse.json({ success: true, already_awarded: true, new_balance: customer?.reward_tokens ?? 0 })
    }

    // Verify this customer owns this order via customer_devices
    let ownsOrderViaDevice = false
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
      ownsOrderViaDevice = device?.customer_id === customerId
    }

    // Calculate 2% token reward
    const tokensToAward = Math.round(order_total * 0.02 * 100) / 100

    // Get current balance
    const { data: customer, error: fetchError } = await supabase
      .from("customers")
      .select("*")
      .eq("id", customerId)
      .single()

    if (fetchError || !customer) {
      console.error("[AwardTokens] Customer fetch error:", fetchError)
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    const tokenAmountUsed = getTokenAmountFromNote(order.customer_note)
    const shouldRedeemUsedTokens =
      tokenAmountUsed > 0 &&
      !hasRedeemedMarker(order.customer_note) &&
      (ownsOrderViaDevice || noteBelongsToCustomer(order.customer_note, customerId))

    const balanceAfterRedemption = Math.max(
      0,
      (customer.reward_tokens || 0) - (shouldRedeemUsedTokens ? tokenAmountUsed : 0)
    )
    const newBalance = balanceAfterRedemption + tokensToAward
    const currentUsedTokens = Number((customer as { reward_tokens_used?: number }).reward_tokens_used || 0)
    console.log(
      `[AwardTokens] Redeeming ${shouldRedeemUsedTokens ? tokenAmountUsed : 0}, awarding ${tokensToAward}, balance: ${customer.reward_tokens} -> ${newBalance}`
    )

    // Update customer balance and mark order awarded
    let balanceResult = await supabase.from("customers").update({
      reward_tokens: newBalance,
      reward_tokens_used: currentUsedTokens + (shouldRedeemUsedTokens ? tokenAmountUsed : 0),
    }).eq("id", customerId)

    if (balanceResult.error) {
      balanceResult = await supabase.from("customers").update({ reward_tokens: newBalance }).eq("id", customerId)
    }

    const orderUpdate: Record<string, unknown> = { tokens_awarded: true }
    if (shouldRedeemUsedTokens) {
      orderUpdate.customer_note = appendRedeemedMarker(order.customer_note)
    }

    const flagResult = await supabase.from("orders").update(orderUpdate).eq("id", order_id)

    if (balanceResult.error) {
      console.error("[AwardTokens] Balance update error:", balanceResult.error)
      return NextResponse.json({ error: "Failed to update balance" }, { status: 500 })
    }

    if (flagResult.error) {
      console.warn("[AwardTokens] Could not set tokens_awarded flag:", flagResult.error.message)
      if (shouldRedeemUsedTokens) {
        await supabase
          .from("orders")
          .update({ customer_note: appendRedeemedMarker(order.customer_note) })
          .eq("id", order_id)
      }
    }

    return NextResponse.json({ success: true, tokens_awarded: tokensToAward, new_balance: newBalance })
  } catch (error) {
    console.error("[AwardTokens] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
