import { NextRequest, NextResponse } from 'next/server'
import { getBusinessBySlug, getFullMenu } from '@/lib/api'

export async function GET(request: NextRequest) {
  try {
    const slug = request.nextUrl.searchParams.get('slug')
    const requestedBusinessId = request.nextUrl.searchParams.get('businessId')
    const business = slug ? await getBusinessBySlug(slug) : null
    const businessId = business?.id || requestedBusinessId

    if (!businessId) {
      return NextResponse.json(
        { error: 'Business or lounge slug is required' },
        { status: 400 }
      )
    }

    // Fetch menu data using existing API function
    const menuData = await getFullMenu(businessId)

    return NextResponse.json({
      success: true,
      ...menuData,
    })
  } catch (error) {
    console.error('[Menu Categories API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch menu categories' },
      { status: 500 }
    )
  }
}
