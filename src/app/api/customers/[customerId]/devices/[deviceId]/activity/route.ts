import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

/**
 * PUT /api/customers/[customerId]/devices/[deviceId]/activity
 * Update device last active timestamp
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { customerId: string; deviceId: string } }
) {
  try {
    const { error } = await supabase
      .from("customer_devices")
      .update({ last_active_at: new Date().toISOString() })
      .eq("customer_id", params.customerId)
      .eq("device_id", params.deviceId)

    if (error) {
      console.error("[API] Error updating device activity:", error)
      return NextResponse.json({ error: "Failed to update activity" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[API] Error in PUT /api/customers/[customerId]/devices/[deviceId]/activity:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
