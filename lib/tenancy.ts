import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function resolveChurchBySlug(slug: string) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("church")
    .select("id, slug, name, status")
    .eq("slug", slug)
    .single();
  if (error || !data) {
    const err = new Error("Church not found");
    (err as any).status = 404;
    throw err;
  }
  return data;
}

