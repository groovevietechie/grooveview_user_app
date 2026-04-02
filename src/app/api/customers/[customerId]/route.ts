import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

/**
 * GET /api/customers/[customerId]
 * Get customer by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const { customerId } = await params
    
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("id", customerId)
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

/**
 * PATCH /api/customers/[customerId]
 * Update customer profile fields (full_name, address, profile_picture_url)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const { customerId } = await params
    const body = await request.json()
    const { full_name, address, profile_picture_url } = body

    const updates: Record<string, string | null> = {}
    if (full_name !== undefined) updates.full_name = full_name || null
    if (address !== undefined) updates.address = address || null
    if (profile_picture_url !== undefined) updates.profile_picture_url = profile_picture_url || null

    const { data, error } = await supabase
      .from("customers")
      .update(updates)
      .eq("id", customerId)
      .select()
      .single()

    if (error) {
      console.error("[API] Error updating customer:", error)
      return NextResponse.json({ error: "Failed to update customer" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[API] Error in PATCH /api/customers/[customerId]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
