import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function getGroupForChurch(groupId: string, churchId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("group")
    .select("id, church_id, name, type, description, branch:branch_id (id, name)")
    .eq("id", groupId)
    .single();
  if (error || !data) return { error: error?.message ?? "Group not found" };
  if (data.church_id !== churchId) return { error: "Forbidden" };
  return { data };
}
