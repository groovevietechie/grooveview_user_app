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

    if (!device_id) {
      return NextResponse.json({ error: "Device ID is required" }, { status: 400 })
    }

    // Device IDs are unique. Returning the existing profile makes this endpoint
    // safe to retry after a timeout or a browser/server restart, instead of
    // creating an orphan customer and failing on the device insert.
    const { data: existingDevice, error: existingDeviceError } = await supabase
      .from("customer_devices")
      .select("*, customers(*)")
      .eq("device_id", device_id)
      .maybeSingle()

    if (existingDeviceError) {
      console.error("[API] Error checking existing customer device:", existingDeviceError)
      return NextResponse.json({ error: "Failed to check device" }, { status: 500 })
    }

    if (existingDevice?.customers) {
      return NextResponse.json({ customer: existingDevice.customers, device: existingDevice })
    }

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
      // Avoid leaving an orphan customer if the device insert fails.
      await supabase.from("customers").delete().eq("id", customer.id)
      return NextResponse.json({ error: "Failed to create device" }, { status: 500 })
    }

    return NextResponse.json({ customer, device })
  } catch (error) {
    console.error("[API] Error in POST /api/customers:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
