import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

/**
 * GET /api/customers/[customerId]/bookings
 * Get all service bookings for a customer
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const { customerId } = await params
    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get("businessId")

    let query = supabase
      .from("service_bookings")
      .select("*")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false })

    if (businessId) {
      query = query.eq("business_id", businessId)
    }

    const { data, error } = await query

    if (error) {
      console.error("[API] Error fetching customer bookings:", error)
      return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error("[API] Error in GET /api/customers/[customerId]/bookings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
