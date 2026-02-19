import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

/**
 * GET /api/customers/[customerId]
 * Get customer by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("id", params.customerId)
      .single()

    if (error) {
      console.error("[API] Error fetching customer:", error)
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[API] Error in GET /api/customers/[customerId]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
