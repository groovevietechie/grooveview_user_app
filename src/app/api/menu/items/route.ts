import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.warn('[Menu API] Supabase environment variables not configured, returning empty menu')
      return NextResponse.json({
        success: true,
        items: [],
        summary: {
          total: 0,
          drinks: 0,
          food: 0,
        },
      })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch all menu items from database
    const { data, error } = await supabase
      .from('menus')
      .select('id, name, category, description, image_url')
      .order('name', { ascending: true })

    if (error) {
      console.error('[Menu API] Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch menu items', message: error.message },
        { status: 500 }
      )
    }

    // Filter items into drinks and food
    const items = data || []
    const drinks = items.filter((item: any) =>
      item.category?.toLowerCase().includes('drink') ||
      item.category?.toLowerCase().includes('beverage')
    )

    const food = items.filter((item: any) =>
      !item.category?.toLowerCase().includes('drink') &&
      !item.category?.toLowerCase().includes('beverage')
    )

    return NextResponse.json({
      success: true,
      items: data || [],
      summary: {
        total: items.length,
        drinks: drinks.length,
        food: food.length,
      },
    })
  } catch (err) {
    console.error('[Menu API] Unexpected error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
