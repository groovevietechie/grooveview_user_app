import { supabase } from "@/lib/supabase"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    console.log("[Debug API] Testing Supabase connection...")
    console.log("[Debug API] URL:", supabase.supabaseUrl)
    console.log("[Debug API] Auth:", supabase.auth)

    // Test 1: Check auth status
    console.log("[Debug API] Getting auth session...")
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    console.log("[Debug API] Session:", sessionData, sessionError)

    // Test 2: Try listing businesses
    console.log("[Debug API] Attempting to fetch businesses...")
    const { data: businesses, error: businessError } = await supabase
      .from("businesses")
      .select("*")
      .limit(1)

    if (businessError) {
      console.error("[Debug API] Business query error:", {
        message: businessError.message,
        code: businessError.code,
        status: businessError.status,
        hint: businessError.hint,
        details: businessError.details,
      })
    } else {
      console.log("[Debug API] Successfully fetched businesses:", businesses?.length)
    }

    // Test 3: Test with specific filter
    console.log("[Debug API] Testing filtered query...")
    const { data: filtered, error: filterError } = await supabase
      .from("businesses")
      .select("*")
      .eq("slug", "groovevie-serviced-lounge")
      .limit(1)

    if (filterError) {
      console.error("[Debug API] Filtered query error:", {
        message: filterError.message,
        code: filterError.code,
      })
    } else {
      console.log("[Debug API] Filtered query success:", filtered?.[0]?.name)
    }

    return NextResponse.json(
      {
        supabaseUrl: supabase.supabaseUrl,
        keyPrefix: supabase.supabaseKey?.substring(0, 20) + "...",
        session: sessionData?.session ? "Authenticated" : "Anonymous",
        sessionError: sessionError?.message,
        test1_businesses: {
          success: !businessError,
          error: businessError ? { message: businessError.message, code: businessError.code } : null,
          count: businesses?.length,
          sample: businesses?.[0] ? { id: businesses[0].id, name: businesses[0].name, slug: businesses[0].slug } : null,
        },
        test2_filtered: {
          success: !filterError,
          error: filterError ? { message: filterError.message, code: filterError.code } : null,
          found: filtered?.[0] ? { id: filtered[0].id, name: filtered[0].name, slug: filtered[0].slug } : null,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("[Debug API] Exception:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
