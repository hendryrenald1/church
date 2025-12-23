import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type BranchRow = { branch: { id: string; name: string | null } | null };

type CellGroupRow = {
  id: string;
  name: string;
  status: "ACTIVE" | "INACTIVE";
  branch: { id: string; name: string } | null;
  cell_group_member: { count: number }[];
};

export default async function PastorCellGroupsPage({ params }: { params: { churchSlug: string } }) {
  const session = await getSessionUser();
  if (!session) redirect("/auth/login");
  if (session.role !== "PASTOR" || !session.churchId || !session.memberId) notFound();
  if (session.churchSlug && session.churchSlug !== params.churchSlug) notFound();

  const supabase = createSupabaseAdminClient();

  // Find branches assigned to this pastor
  const { data: profileData, error: profileError } = await supabase
    .from("pastor_profile")
    .select("id")
    .eq("church_id", session.churchId)
    .eq("member_id", session.memberId)
    .maybeSingle();
  if (profileError || !profileData) notFound();

  const { data: branchAssignments, error: branchError } = await supabase
    .from("pastor_branch")
    .select("branch:branch_id (id, name)")
    .eq("pastor_profile_id", profileData.id);
  if (branchError) throw new Error(branchError.message);

  const branches = (branchAssignments ?? []) as unknown as BranchRow[];
  const branchIds = branches.map((b) => b.branch?.id).filter(Boolean) as string[];

  // Fetch cell groups limited to assigned branches
  let groups: CellGroupRow[] = [];
  if (branchIds.length > 0) {
    const { data, error } = await supabase
      .from("cell_group")
      .select("id, name, status, branch:branch_id (id, name), cell_group_member(count)")
      .eq("church_id", session.churchId)
      .in("branch_id", branchIds)
      .order("name", { ascending: true });
    if (error) throw new Error(error.message);
    groups = (data ?? []) as unknown as CellGroupRow[];
  }

  return (
    <div className="space-y-6 px-4 pb-6 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold">Cell Groups</h1>
        <p className="text-sm text-muted-foreground">Groups within your assigned branches.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Groups ({groups.length})</CardTitle>
        </CardHeader>
        <CardContent className="divide-y p-0">
          {groups.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">
              No groups available for your branch assignments.
            </div>
          ) : (
            groups.map((group) => (
              <div key={group.id} className="grid grid-cols-1 gap-2 px-4 py-3 text-sm sm:grid-cols-[2fr_1fr_auto] sm:items-center">
                <div className="flex items-center gap-2">
                  <div>
                    <p className="font-medium">{group.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {group.branch?.name ? `Branch: ${group.branch.name}` : "Branch not set"}
                    </p>
                  </div>
                  <Badge variant={group.status === "ACTIVE" ? "default" : "secondary"} className="text-xs">
                    {group.status}
                  </Badge>
                </div>
                <div className="text-muted-foreground">Members: {group.cell_group_member?.[0]?.count ?? 0}</div>
                <div className="flex justify-start sm:justify-end">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/${params.churchSlug}/pastor/cell-groups/${group.id}`}>Open</Link>
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
