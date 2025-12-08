import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://idvrnrvqvdzppvzbbtgj.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkdnJucnZxdmR6cHB2emJidGdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MzIzMTksImV4cCI6MjA4MDQwODMxOX0.JNi8HXhzk6UP9e32p1zaFi03NSy4zKdMTyZgHP8Hcuc'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)