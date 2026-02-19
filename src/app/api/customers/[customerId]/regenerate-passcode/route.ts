import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

/**
 * POST /api/customers/[customerId]/regenerate-passcode
 * Generate a new passcode for customer
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const { customerId } = await params
    
    // Generate new 6-digit passcode
    const newPasscode = Math.floor(100000 + Math.random() * 900000).toString()

    const { data, error } = await supabase
      .from("customers")
      .update({ sync_passcode: newPasscode })
      .eq("id", customerId)
      .select()
      .single()

    if (error) {
      console.error("[API] Error regenerating passcode:", error)
      return NextResponse.json({ error: "Failed to regenerate passcode" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[API] Error in POST /api/customers/[customerId]/regenerate-passcode:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
