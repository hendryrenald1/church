import { createSupabaseAdminClient } from "@/lib/supabase/server";

type GroupData = {
  id: string;
  church_id: string;
  name: string;
  type: string | null;
  description: string | null;
  branch: { id: string; name: string } | null;
};

export async function getGroupForChurch(groupId: string, churchId: string): Promise<{ error: string; data?: undefined } | { error?: undefined; data: GroupData }> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("group")
    .select("id, church_id, name, type, description, branch:branch_id (id, name)")
    .eq("id", groupId)
    .single();
  if (error || !data) return { error: error?.message ?? "Group not found" };
  const groupData = data as GroupData;
  if (groupData.church_id !== churchId) return { error: "Forbidden" };
  return { data: groupData };
}
