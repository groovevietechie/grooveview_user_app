import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

/**
 * DELETE /api/customers/[customerId]/devices/[deviceId]
 * Unlink a device from customer
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { customerId: string; deviceId: string } }
) {
  try {
    const { error } = await supabase
      .from("customer_devices")
      .delete()
      .eq("customer_id", params.customerId)
      .eq("device_id", params.deviceId)

    if (error) {
      console.error("[API] Error deleting device:", error)
      return NextResponse.json({ error: "Failed to delete device" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[API] Error in DELETE /api/customers/[customerId]/devices/[deviceId]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
