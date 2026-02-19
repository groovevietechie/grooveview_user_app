import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

/**
 * GET /api/customers/[customerId]/activities
 * Get customer activities
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get("businessId")

    let query = supabase
      .from("customer_activities")
      .select("*")
      .eq("customer_id", params.customerId)
      .order("created_at", { ascending: false })

    if (businessId) {
      query = query.eq("business_id", businessId)
    }

    const { data, error } = await query

    if (error) {
      console.error("[API] Error fetching activities:", error)
      return NextResponse.json({ error: "Failed to fetch activities" }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error("[API] Error in GET /api/customers/[customerId]/activities:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * POST /api/customers/[customerId]/activities
 * Track a new activity
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    const body = await request.json()
    const { device_id, business_id, activity_type, activity_data } = body

    const { data, error } = await supabase
      .from("customer_activities")
      .insert({
        customer_id: params.customerId,
        device_id,
        business_id,
        activity_type,
        activity_data,
      })
      .select()
      .single()

    if (error) {
      console.error("[API] Error creating activity:", error)
      return NextResponse.json({ error: "Failed to create activity" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[API] Error in POST /api/customers/[customerId]/activities:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
