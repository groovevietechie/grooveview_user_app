import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

/**
 * GET /api/system/settings
 * Fetch all system settings or specific setting by key
 * Query params: ?key=cashback_token_percentage
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get("key")

    if (key) {
      // Fetch specific setting
      const { data, error } = await supabase
        .from("system_settings")
        .select("*")
        .eq("setting_key", key)
        .single()

      if (error) {
        console.error(`[SystemSettings] Error fetching setting '${key}':`, error)
        return NextResponse.json(
          { error: `Setting '${key}' not found` },
          { status: 404 }
        )
      }

      return NextResponse.json({ setting: data })
    } else {
      // Fetch all settings
      const { data, error } = await supabase
        .from("system_settings")
        .select("*")
        .order("created_at", { ascending: true })

      if (error) {
        console.error("[SystemSettings] Error fetching settings:", error)
        return NextResponse.json(
          { error: "Failed to fetch settings" },
          { status: 500 }
        )
      }

      return NextResponse.json({ settings: data })
    }
  } catch (error) {
    console.error("[SystemSettings] Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/system/settings
 * Update a system setting
 * Body: { setting_key: string, setting_value: string }
 * 
 * This endpoint broadcasts the change via Supabase real-time,
 * which is automatically picked up by useSystemSetting hooks
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { setting_key, setting_value } = body

    if (!setting_key || setting_value === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: setting_key, setting_value" },
        { status: 400 }
      )
    }

    // Update or insert the setting
    const { data, error } = await supabase
      .from("system_settings")
      .upsert(
        {
          setting_key,
          setting_value,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "setting_key" }
      )
      .select()
      .single()

    if (error) {
      console.error("[SystemSettings] Error updating setting:", error)
      return NextResponse.json(
        { error: "Failed to update setting" },
        { status: 500 }
      )
    }

    console.log(
      `[SystemSettings] Updated '${setting_key}' to '${setting_value}' - Broadcasting to all clients via Realtime`
    )

    return NextResponse.json({
      success: true,
      setting: data,
      message: `Setting updated and will be reflected in real-time across all connected clients`,
    })
  } catch (error) {
    console.error("[SystemSettings] Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
