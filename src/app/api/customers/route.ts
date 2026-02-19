import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

/**
 * POST /api/customers
 * Create a new customer profile with device
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sync_passcode, device_id, device_fingerprint, device_name } = body

    // Create customer
    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .insert({ sync_passcode })
      .select()
      .single()

    if (customerError) {
      console.error("[API] Error creating customer:", customerError)
      return NextResponse.json({ error: "Failed to create customer" }, { status: 500 })
    }

    // Create device
    const { data: device, error: deviceError } = await supabase
      .from("customer_devices")
      .insert({
        customer_id: customer.id,
        device_id,
        device_fingerprint,
        device_name,
      })
      .select()
      .single()

    if (deviceError) {
      console.error("[API] Error creating device:", deviceError)
      return NextResponse.json({ error: "Failed to create device" }, { status: 500 })
    }

    return NextResponse.json({ customer, device })
  } catch (error) {
    console.error("[API] Error in POST /api/customers:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
