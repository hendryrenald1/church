import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { GroupForm } from "@/components/groups/group-form";
import { GroupMembersPanel } from "@/components/groups/group-members-panel";
import { GroupAnnouncementsPanel } from "@/components/groups/group-announcements-panel";
import { Card } from "@/components/ui/card";
import { GroupDetail, BranchOption } from "../../groups/types";

type Props = {
  params: { churchSlug: string; groupId: string };
};

export default async function AdminGroupDetailPage({ params }: Props) {
  const session = await getSessionUser();
  if (!session) redirect("/auth/login");
  if (session.role !== "ADMIN" || !session.churchId) notFound();
  if (session.churchSlug && session.churchSlug !== params.churchSlug) notFound();

  const supabase = createSupabaseAdminClient();
  const [{ data: group, error }, { data: branchesData, error: branchError }] = await Promise.all([
    supabase
      .from("group")
      .select("id, name, type, description, branch:branch_id (id, name)")
      .eq("id", params.groupId)
      .eq("church_id", session.churchId)
      .single(),
    supabase
      .from("branch")
      .select("id, name")
      .eq("church_id", session.churchId)
      .order("name", { ascending: true })
  ]);

  if (error || branchError || !group) {
    console.error("Failed to load group detail", error ?? branchError);
    notFound();
  }

  const branches = (branchesData ?? []) as BranchOption[];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Group</p>
          <h1 className="text-3xl font-bold">{group.name}</h1>
          <p className="text-sm text-muted-foreground">
            {group.branch?.name ? `${group.branch.name} branch` : "All branches"}
          </p>
        </div>
      </div>
      {group.description && <Card className="p-4 text-sm text-muted-foreground">{group.description}</Card>}
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <GroupMembersPanel groupId={group.id} branches={branches} />
        <GroupAnnouncementsPanel groupId={group.id} />
      </div>
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Edit group</h2>
        <GroupForm churchSlug={params.churchSlug} branches={branches} group={group as GroupDetail} />
      </div>
    </div>
  );
}
