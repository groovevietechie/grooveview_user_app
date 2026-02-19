import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

/**
 * GET /api/customers/by-device/[deviceId]
 * Get customer by device ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  try {
    // Await params in Next.js 15
    const { deviceId } = await params
    
    console.log("[API] Looking up customer for device:", deviceId)

    // Find the device in customer_devices table
    const { data: device, error: deviceError } = await supabase
      .from("customer_devices")
      .select("customer_id")
      .eq("device_id", deviceId)
      .single()

    if (deviceError || !device) {
      console.log("[API] No customer found for device:", deviceId)
      return NextResponse.json({ error: "Device not linked to any customer" }, { status: 404 })
    }

    console.log("[API] Found customer ID:", device.customer_id)

    // Get the customer data
    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("*")
      .eq("id", device.customer_id)
      .single()

    if (customerError || !customer) {
      console.log("[API] Customer not found:", device.customer_id)
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    console.log("[API] Returning customer data with passcode:", customer.sync_passcode)
    return NextResponse.json(customer)
  } catch (error) {
    console.error("[API] Error in GET /api/customers/by-device:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
