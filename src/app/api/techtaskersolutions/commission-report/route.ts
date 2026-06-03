import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

type RawOrder = {
  id: string
  business_id: string
  seat_label?: string | null
  status: string
  total_amount: number
  created_at: string
  updated_at?: string | null
}

type BusinessLookup = Record<string, { name: string; slug?: string }>

function getMonthWindow(monthParam: string | null) {
  const now = new Date()
  const normalized = monthParam && /^\d{4}-\d{2}$/.test(monthParam)
    ? monthParam
    : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`

  const [year, month] = normalized.split("-").map(Number)
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0))
  const end = new Date(Date.UTC(year, month, 1, 0, 0, 0))

  return { normalized, start, end }
}

function getWeekStart(date: Date) {
  const local = new Date(date)
  const day = local.getDay()
  const diff = day === 0 ? -6 : 1 - day
  local.setDate(local.getDate() + diff)
  local.setHours(0, 0, 0, 0)
  return local
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

function formatWeekRange(start: Date) {
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return `${start.toLocaleDateString("en-NG", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-NG", { month: "short", day: "numeric" })}`
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const { normalized, start, end } = getMonthWindow(searchParams.get("month"))

    const { data: orders, error } = await supabase
      .from("orders")
      .select("id, business_id, seat_label, status, total_amount, created_at, updated_at")
      .eq("status", "served")
      .gte("created_at", start.toISOString())
      .lt("created_at", end.toISOString())
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[TechTaskerReport] Failed to fetch orders:", error)
      return NextResponse.json({ error: "Failed to fetch commission orders" }, { status: 500 })
    }

    const businessIds = Array.from(new Set((orders || []).map((order) => order.business_id).filter(Boolean)))
    let businessLookup: BusinessLookup = {}

    if (businessIds.length > 0) {
      const { data: businesses } = await supabase
        .from("businesses")
        .select("id, name, slug")
        .in("id", businessIds)

      businessLookup = Object.fromEntries(
        (businesses || []).map((business) => [
          business.id,
          { name: business.name || "Unknown Business", slug: business.slug },
        ])
      )
    }

    const rows = ((orders || []) as RawOrder[]).map((order) => {
      const completedAt = new Date(order.created_at)
      const weekStart = getWeekStart(completedAt)
      const orderAmount = Number(order.total_amount || 0)
      const commissionAmount = Math.round(orderAmount * 0.01 * 100) / 100
      const business = businessLookup[order.business_id]

      return {
        id: order.id,
        shortId: order.id.slice(0, 8),
        businessId: order.business_id,
        businessName: business?.name || "Unknown Business",
        businessSlug: business?.slug || null,
        seatLabel: order.seat_label || "Not specified",
        completedAt: completedAt.toISOString(),
        weekStart: toDateKey(weekStart),
        weekRange: formatWeekRange(weekStart),
        orderAmount,
        commissionRate: 0.01,
        commissionAmount,
      }
    })

    const weeklyMap = new Map<string, {
      weekStart: string
      weekRange: string
      orderCount: number
      orderAmount: number
      commissionAmount: number
    }>()

    for (const row of rows) {
      const current = weeklyMap.get(row.weekStart) || {
        weekStart: row.weekStart,
        weekRange: row.weekRange,
        orderCount: 0,
        orderAmount: 0,
        commissionAmount: 0,
      }

      current.orderCount += 1
      current.orderAmount += row.orderAmount
      current.commissionAmount += row.commissionAmount
      weeklyMap.set(row.weekStart, current)
    }

    const weekly = Array.from(weeklyMap.values())
      .sort((a, b) => a.weekStart.localeCompare(b.weekStart))
      .map((week) => ({
        ...week,
        orderAmount: Math.round(week.orderAmount * 100) / 100,
        commissionAmount: Math.round(week.commissionAmount * 100) / 100,
      }))

    const totalOrderAmount = rows.reduce((sum, row) => sum + row.orderAmount, 0)
    const totalCommissionAmount = rows.reduce((sum, row) => sum + row.commissionAmount, 0)

    return NextResponse.json({
      month: normalized,
      generatedAt: new Date().toISOString(),
      summary: {
        orderCount: rows.length,
        totalOrderAmount: Math.round(totalOrderAmount * 100) / 100,
        totalCommissionAmount: Math.round(totalCommissionAmount * 100) / 100,
        commissionRate: 0.01,
        averageOrderAmount: rows.length ? Math.round((totalOrderAmount / rows.length) * 100) / 100 : 0,
      },
      weekly,
      orders: rows,
    })
  } catch (error) {
    console.error("[TechTaskerReport] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
