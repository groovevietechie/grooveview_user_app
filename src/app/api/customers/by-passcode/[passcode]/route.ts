import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

/**
 * GET /api/customers/by-passcode/[passcode]
 * Get customer by passcode
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ passcode: string }> }
) {
  try {
    // Await params in Next.js 15
    const { passcode } = await params
    
    console.log("[API] Looking up customer by passcode:", passcode)

    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("sync_passcode", passcode)
      .single()

    if (error) {
      console.error("[API] Error fetching customer by passcode:", error)
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    console.log("[API] Found customer:", data.id)
    return NextResponse.json(data)
  } catch (error) {
    console.error("[API] Error in GET /api/customers/by-passcode:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
