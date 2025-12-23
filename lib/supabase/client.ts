import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true, // keep the session in localStorage for PWA/offline
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  );
}
