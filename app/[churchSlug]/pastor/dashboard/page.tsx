import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

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
  const { data: profile, error: profileError } = await supabase
    .from("pastor_profile")
    .select("id")
    .eq("church_id", session.churchId)
    .eq("member_id", session.memberId)
    .maybeSingle();
  if (profileError || !profile) {
    console.error("Pastor profile missing", profileError);
    notFound();
  }

  const { data: branchAssignments, error: branchError } = await supabase
    .from("pastor_branch")
    .select("branch:branch_id (id, name, city)")
    .eq("pastor_profile_id", profile.id);
  if (branchError) throw new Error(branchError.message);

  const branches = (branchAssignments ?? []) as BranchRow[];
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
      </div>
    </div>
  );
}
