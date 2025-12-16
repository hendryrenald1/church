import { cookies, headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

// For user session-based operations (uses cookies)
export function createSupabaseServerClient() {
  const cookieStore = cookies();
  type CookieOptions = Omit<Parameters<(typeof cookieStore)["set"]>[0], "name" | "value">;
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: (name: string, value: string, options?: CookieOptions) =>
          cookieStore.set({ name, value, ...(options ?? {}) }),
        remove: (name: string, options?: CookieOptions) =>
          cookieStore.set({ name, value: "", ...(options ?? {}) })
      },
      global: {
        headers: {
          "x-forwarded-for": headers().get("x-forwarded-for") ?? ""
        }
      }
    }
  );
}

// For admin operations that bypass RLS (uses service role key)
export function createSupabaseAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}
