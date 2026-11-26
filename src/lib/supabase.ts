import { createClient } from "@supabase/supabase-js"

const NEW_SUPABASE_URL = "https://cmlwqzrzoeiyvwkotqav.supabase.co"
const NEW_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Ok-XHx8Fr_WjUT20NEeZag_KsVJx8fO"
const SUSPENDED_SUPABASE_HOST = "idvrnrvqvdzppvzbbtgj.supabase.co"

// Vercel can retain old project variables even after .env.local is changed.
// Never let a deployment silently connect to the suspended project.
const configuredUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const supabaseUrl = !configuredUrl || configuredUrl.includes(SUSPENDED_SUPABASE_HOST)
  ? NEW_SUPABASE_URL
  : configuredUrl

const configuredPublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
const supabasePublishableKey = !configuredPublishableKey || configuredPublishableKey.startsWith("eyJ")
  ? NEW_SUPABASE_PUBLISHABLE_KEY
  : configuredPublishableKey

// Server routes use the secret key for database writes. It is never selected
// in the browser bundle because window is defined for client-side execution.
const supabaseKey = typeof window === "undefined"
  ? process.env.SUPABASE_SECRET_KEY?.trim() || supabasePublishableKey
  : supabasePublishableKey

export const supabase = createClient(supabaseUrl, supabaseKey)
