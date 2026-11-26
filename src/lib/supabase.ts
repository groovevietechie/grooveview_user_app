import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://cmlwqzrzoeiyvwkotqav.supabase.co"
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_Ok-XHx8Fr_WjUT20NEeZag_KsVJx8fO"

// Server routes use the secret key for database writes. It is never selected
// in the browser bundle because window is defined for client-side execution.
const supabaseKey = typeof window === "undefined"
  ? process.env.SUPABASE_SECRET_KEY || supabasePublishableKey
  : supabasePublishableKey

export const supabase = createClient(supabaseUrl, supabaseKey)
