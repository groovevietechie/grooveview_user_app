import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

/**
 * GET /api/customers/[customerId]/orders
 * Get all orders for a customer across all devices
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get("businessId")

    let query = supabase
      .from("orders")
      .select(`
        *,
        order_items (
          id,
          menu_item_id,
          quantity,
          unit_price,
          item_note,
          menu_items (
            name
          )
        )
      `)
      .eq("customer_id", params.customerId)
      .order("created_at", { ascending: false })

    if (businessId) {
      query = query.eq("business_id", businessId)
    }

    const { data, error } = await query

    if (error) {
      console.error("[API] Error fetching customer orders:", error)
      return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
    }

    // Transform the data to match expected format
    const orders = (data || []).map((order: any) => ({
      ...order,
      items: (order.order_items || []).map((item: any) => ({
        id: item.id,
        name: item.menu_items?.name || "Unknown Item",
        quantity: item.quantity,
        unit_price: item.unit_price,
        item_note: item.item_note,
      })),
    }))

    return NextResponse.json(orders)
  } catch (error) {
    console.error("[API] Error in GET /api/customers/[customerId]/orders:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
