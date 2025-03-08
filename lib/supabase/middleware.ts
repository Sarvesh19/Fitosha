import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSupabaseClient() {
  const cookieStore = await cookies(); // ✅ Get the cookie store synchronously

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value || "";
        },
        set(name, value, options) {
          cookieStore.set(name, value, options);
        },
        remove(name) {
          cookieStore.set(name, "", { maxAge: -1 });
        },
      },
    }
  );
}
