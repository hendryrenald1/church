import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";

export type AppRole = "SUPER_ADMIN" | "ADMIN" | "PASTOR";

export async function getSessionUser() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  const appMetadata = (data.user.app_metadata ?? {}) as Record<string, unknown>;
  const userMetadata = (data.user.user_metadata ?? {}) as Record<string, unknown>;
  const role = ((userMetadata.role ?? appMetadata.role) as AppRole | undefined) ?? undefined;
  const churchId = (userMetadata.church_id ?? appMetadata.church_id) as string | undefined;
  const memberId = (userMetadata.member_id ?? appMetadata.member_id) as string | undefined;

  // Fetch the correct churchSlug from the database using churchId
  let churchSlug: string | undefined;
  if (churchId) {
    const adminSupabase = createSupabaseAdminClient();
    const { data: church } = await adminSupabase
      .from("church")
      .select("slug")
      .eq("id", churchId)
      .single() as { data: { slug: string } | null; error: unknown };
    churchSlug = church?.slug;
  }

  return { user: data.user, role, churchId, churchSlug, memberId };
}
