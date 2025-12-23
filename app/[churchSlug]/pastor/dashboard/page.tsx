import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type BranchRow = {
  branch: {
    id: string;
    name: string | null;
    city: string | null;
  } | null;
};

export default async function PastorDashboardPage({ params }: { params: { churchSlug: string } }) {
  const session = await getSessionUser();
  if (!session) redirect("/auth/login");
  if (session.role !== "PASTOR" || !session.churchId || !session.memberId) notFound();
  if (session.churchSlug && session.churchSlug !== params.churchSlug) notFound();

  const supabase = createSupabaseAdminClient();
  const { data: profileData, error: profileError } = await supabase
    .from("pastor_profile")
    .select("id")
    .eq("church_id", session.churchId)
    .eq("member_id", session.memberId)
    .maybeSingle();
  if (profileError || !profileData) {
    console.error("Pastor profile missing", profileError);
    notFound();
  }

  const profile = profileData as { id: string };

  const { data: branchAssignments, error: branchError } = await supabase
    .from("pastor_branch")
    .select("branch:branch_id (id, name, city)")
    .eq("pastor_profile_id", profile.id);
  if (branchError) throw new Error(branchError.message);

  const branches = (branchAssignments ?? []) as unknown as BranchRow[];
  const branchIds = branches
    .map((item) => item.branch?.id)
    .filter((id): id is string => Boolean(id));

  let memberCount = 0;
  if (branchIds.length > 0) {
    const { count, error } = await supabase
      .from("member")
      .select("id", { head: true, count: "exact" })
      .eq("church_id", session.churchId)
      .in("branch_id", branchIds);
    if (error) throw new Error(error.message);
    memberCount = count ?? 0;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Pastor dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Branch assignments and member counts in your branches.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border p-4 space-y-3">
          <h2 className="text-lg font-semibold">Assigned branches</h2>
          {branches.length === 0 ? (
            <p className="text-sm text-muted-foreground">No branches have been assigned to you yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {branches.map((item, index) => (
                <li key={item.branch?.id ?? `${profile.id}-${index}`} className="rounded border px-3 py-2">
                  <p className="font-medium">{item.branch?.name ?? "Unnamed branch"}</p>
                  <p className="text-muted-foreground">{item.branch?.city ?? "City unknown"}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-lg border p-4 space-y-3">
          <h2 className="text-lg font-semibold">Members</h2>
          <p className="text-sm text-muted-foreground">
            Count of members across assigned branches. Create new members from your members tab.
          </p>
          <p className="text-3xl font-semibold">{memberCount.toLocaleString()}</p>
        </div>

        <Card className="sm:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Cell Groups Overview</span>
              <Badge variant="outline">Branches only</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg border bg-muted/50 p-3">
                <p className="text-sm text-muted-foreground">Active Groups</p>
                <p className="text-2xl font-semibold">12</p>
              </div>
              <div className="rounded-lg border bg-muted/50 p-3">
                <p className="text-sm text-muted-foreground">Total Members</p>
                <p className="text-2xl font-semibold">89</p>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>This Week&apos;s Attendance</span>
                <span className="font-medium">73 / 89 (82%)</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded bg-muted">
                <div className="h-2 w-[82%] rounded bg-primary" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-sm text-muted-foreground">New Members (Last 30 days)</p>
                <p className="text-xl font-semibold text-green-600">+7</p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-sm text-muted-foreground">Groups Needing Attention</p>
                <p className="text-xl font-semibold text-amber-600">2</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
