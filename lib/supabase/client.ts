// lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/lib/database.types"

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        // Optionally, you can specify the redirect URL here if needed
        // redirectTo: process.env.NEXT_PUBLIC_REDIRECT_URL || 'http://localhost:3001/login',
      },
    }
  )
}