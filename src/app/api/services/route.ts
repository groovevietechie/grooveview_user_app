import { NextRequest, NextResponse } from "next/server"
import { getBusinessBySlug, getServiceConfigurations } from "@/lib/api"

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug")
  const requestedBusinessId = request.nextUrl.searchParams.get("businessId")
  const business = slug ? await getBusinessBySlug(slug) : null
  const businessId = business?.id || requestedBusinessId

  if (!businessId) {
    return NextResponse.json({ error: "Business or lounge slug is required" }, { status: 400 })
  }

  try {
    const services = await getServiceConfigurations(businessId)
    return NextResponse.json({ success: true, services })
  } catch (error) {
    console.error("[Services API] Error fetching services:", error)
    return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 })
  }
}
