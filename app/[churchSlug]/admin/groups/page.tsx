import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { GroupList } from "@/components/groups/group-list";
import { GroupSummary } from "./types";

export default async function AdminGroupsPage({ params }: { params: { churchSlug: string } }) {
  const session = await getSessionUser();
  if (!session) redirect("/auth/login");
  if (session.role !== "ADMIN" || !session.churchId) notFound();
  if (session.churchSlug && session.churchSlug !== params.churchSlug) notFound();

  const supabase = createSupabaseAdminClient();
  const [{ data: groupsData, error }, { data: membersData }] = await Promise.all([
    supabase
      .from("group")
      .select("id, name, type, description, branch:branch_id (id, name)")
      .eq("church_id", session.churchId)
      .order("name", { ascending: true }),
    supabase
      .from("group_member")
      .select("group_id")
      .eq("church_id", session.churchId)
  ]);
  if (error) {
    console.error("Failed to load groups", error);
    throw new Error("Failed to load groups");
  }
  const counts = membersData?.reduce<Record<string, number>>((acc, row) => {
    if (!row.group_id) return acc;
    acc[row.group_id] = (acc[row.group_id] ?? 0) + 1;
    return acc;
  }, {}) ?? {};

  const groups: GroupSummary[] =
    groupsData?.map((group) => ({
      ...group,
      memberCount: counts[group.id] ?? 0
    })) ?? [];

  return (
    <div className="space-y-6">
      <GroupList churchSlug={params.churchSlug} groups={groups} />
    </div>
  );
}
