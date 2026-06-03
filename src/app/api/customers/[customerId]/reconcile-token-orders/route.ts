import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

const TOKEN_NOTE_PATTERN = /\[reward_tokens_used:(\d+(?:\.\d+)?)\]/i
const CUSTOMER_PROFILE_NOTE_PATTERN = /\[customer_profile_id:([^\]]+)\]/i
const TOKEN_REDEEMED_MARKER = "[reward_tokens_redeemed]"

function getTokenAmountFromNote(note?: string | null): number {
  const match = note?.match(TOKEN_NOTE_PATTERN)
  return match ? Number(match[1]) || 0 : 0
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

function noteBelongsToCustomer(note: string | null | undefined, customerId: string): boolean {
  const match = note?.match(CUSTOMER_PROFILE_NOTE_PATTERN)
  return match?.[1] === customerId
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const { customerId } = await params

    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("*")
      .eq("id", customerId)
      .single()

    if (customerError || !customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    const { data: devices } = await supabase
      .from("customer_devices")
      .select("device_id")
      .eq("customer_id", customerId)

    const deviceIds = (devices || []).map((device) => device.device_id).filter(Boolean)

    const orderMap = new Map<string, { id: string; customer_note?: string | null }>()

    const { data: customerOrders } = await supabase
      .from("orders")
      .select("id, customer_note")
      .eq("customer_profile_id", customerId)
      .eq("status", "served")

    for (const order of customerOrders || []) {
      orderMap.set(order.id, order)
    }

    if (deviceIds.length > 0) {
      const { data: deviceOrders } = await supabase
        .from("orders")
        .select("id, customer_note")
        .in("device_id", deviceIds)
        .eq("status", "served")

      for (const order of deviceOrders || []) {
        orderMap.set(order.id, order)
      }
    }

    const { data: noteLinkedOrders } = await supabase
      .from("orders")
      .select("id, customer_note")
      .eq("status", "served")
      .ilike("customer_note", `%[customer_profile_id:${customerId}]%`)

    for (const order of noteLinkedOrders || []) {
      orderMap.set(order.id, order)
    }

    let tokensToRedeem = 0
    const updates: Array<{ id: string; customer_note: string }> = []

    for (const order of orderMap.values()) {
      const tokenAmount = getTokenAmountFromNote(order.customer_note)
      if (tokenAmount <= 0 || hasRedeemedMarker(order.customer_note)) continue
      if (!noteBelongsToCustomer(order.customer_note, customerId) && !deviceIds.length) continue

      tokensToRedeem += tokenAmount
      updates.push({ id: order.id, customer_note: appendRedeemedMarker(order.customer_note) })
    }

    if (tokensToRedeem <= 0) {
      return NextResponse.json({
        success: true,
        tokens_redeemed: 0,
        new_balance: customer.reward_tokens || 0,
      })
    }

    const currentUsedTokens = Number((customer as { reward_tokens_used?: number }).reward_tokens_used || 0)
    const newBalance = Math.max(0, (customer.reward_tokens || 0) - tokensToRedeem)

    let { error: balanceError } = await supabase
      .from("customers")
      .update({
        reward_tokens: newBalance,
        reward_tokens_used: currentUsedTokens + tokensToRedeem,
      })
      .eq("id", customerId)

    if (balanceError) {
      const fallback = await supabase
        .from("customers")
        .update({ reward_tokens: newBalance })
        .eq("id", customerId)
      balanceError = fallback.error
    }

    if (balanceError) {
      console.error("[ReconcileTokens] Balance update error:", balanceError)
      return NextResponse.json({ error: "Failed to update token balance" }, { status: 500 })
    }

    for (const update of updates) {
      await supabase
        .from("orders")
        .update({ customer_note: update.customer_note })
        .eq("id", update.id)
    }

    return NextResponse.json({
      success: true,
      tokens_redeemed: tokensToRedeem,
      new_balance: newBalance,
    })
  } catch (error) {
    console.error("[ReconcileTokens] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
