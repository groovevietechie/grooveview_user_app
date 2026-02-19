import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

/**
 * GET /api/customers/by-passcode/[passcode]
 * Get customer by passcode
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { passcode: string } }
) {
  try {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("sync_passcode", params.passcode)
      .single()

    if (error) {
      console.error("[API] Error fetching customer by passcode:", error)
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[API] Error in GET /api/customers/by-passcode:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
