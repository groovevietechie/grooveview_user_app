import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

/**
 * GET /api/customers/[customerId]/devices
 * Get all devices for a customer
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const { customerId } = await params
    
    const { data, error } = await supabase
      .from("customer_devices")
      .select("*")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[API] Error fetching devices:", error)
      return NextResponse.json({ error: "Failed to fetch devices" }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error("[API] Error in GET /api/customers/[customerId]/devices:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * POST /api/customers/[customerId]/devices
 * Link a new device to customer
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const { customerId } = await params
    const body = await request.json()
    const { device_id, device_fingerprint, device_name } = body

    // Check if device already exists
    const { data: existing } = await supabase
      .from("customer_devices")
      .select("*")
      .eq("device_id", device_id)
      .single()

    if (existing) {
      // Update existing device
      const { data, error } = await supabase
        .from("customer_devices")
        .update({
          customer_id: customerId,
          device_fingerprint,
          device_name,
          last_active_at: new Date().toISOString(),
        })
        .eq("device_id", device_id)
        .select()
        .single()

      if (error) {
        console.error("[API] Error updating device:", error)
        return NextResponse.json({ error: "Failed to update device" }, { status: 500 })
      }

      return NextResponse.json(data)
    }

    // Create new device
    const { data, error } = await supabase
      .from("customer_devices")
      .insert({
        customer_id: customerId,
        device_id,
        device_fingerprint,
        device_name,
      })
      .select()
      .single()

    if (error) {
      console.error("[API] Error creating device:", error)
      return NextResponse.json({ error: "Failed to create device" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[API] Error in POST /api/customers/[customerId]/devices:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
