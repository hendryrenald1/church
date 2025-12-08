import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AppRole = "SUPER_ADMIN" | "ADMIN" | "PASTOR";

export async function getSessionUser() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  const appMetadata = (data.user.app_metadata ?? {}) as Record<string, unknown>;
  const userMetadata = (data.user.user_metadata ?? {}) as Record<string, unknown>;
  const role = ((userMetadata.role ?? appMetadata.role) as AppRole | undefined) ?? undefined;
  const churchId = (userMetadata.church_id ?? appMetadata.church_id) as string | undefined;
  const churchSlug = (userMetadata.church_slug ?? appMetadata.church_slug) as string | undefined;
  const memberId = (userMetadata.member_id ?? appMetadata.member_id) as string | undefined;
  return { user: data.user, role, churchId, churchSlug, memberId };
}
