import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  // Get the current key from environment or fallback
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_Ok-XHx8Fr_WjUT20NEeZag_KsVJx8fO"
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://cmlwqzrzoeiyvwkotqav.supabase.co"

  // Parse the key
  function validateJWT(token: string) {
    try {
      const parts = token.split(".")
      if (parts.length !== 3) {
        return {
          isValid: false,
          reason: `Invalid JWT format - expected 3 parts separated by '.', got ${parts.length}`,
          format: token.substring(0, 50) + "...",
        }
      }

      const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"))
      return {
        isValid: true,
        format: "JWT (Correct Format ✅)",
        payload: {
          iss: payload.iss,
          role: payload.role,
          aud: payload.aud,
          exp: payload.exp ? new Date(payload.exp * 1000).toISOString() : "Not set",
        },
      }
    } catch (err) {
      return {
        isValid: false,
        reason: `Not a valid JWT: ${err instanceof Error ? err.message : String(err)}`,
        format: token.substring(0, 50) + "...",
      }
    }
  }

  const keyValidation = validateJWT(anonKey)

  return NextResponse.json(
    {
      message: "Supabase Key Validation",
      configuration: {
        url: supabaseUrl,
        keyPrefix: anonKey.substring(0, 20),
        keyLength: anonKey.length,
      },
      validation: keyValidation,
      recommendation: !keyValidation.isValid
        ? "⚠️  The anon key is NOT in the correct JWT format. Get the 'anon public' key from Supabase Settings > API"
        : "✅ The anon key looks correct!",
      steps:
        !keyValidation.isValid
          ? [
              "1. Go to Supabase Dashboard > Settings > API",
              "2. Find the 'anon public' key (long JWT starting with eyJhbGc...)",
              "3. Update src/lib/supabase.ts with the correct key",
              "4. Rebuild with: npm run build",
            ]
          : ["✅ Configuration looks correct. Test the app!"],
    },
    { status: 200 }
  )
}
