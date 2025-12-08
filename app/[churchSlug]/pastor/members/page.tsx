import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

type MemberRow = {
  id: string;
  first_name: string;
  last_name: string;
  branch: { id: string; name: string | null } | null;
};

export default async function PastorMembersPage({ params }: { params: { churchSlug: string } }) {
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
    .single();
  if (profileError || !profile) {
    console.error("Pastor profile missing", profileError);
    notFound();
  }

  const { data: assignments, error: assignmentError } = await supabase
    .from("pastor_branch")
    .select("branch_id")
    .eq("pastor_profile_id", profile.id);
  if (assignmentError) {
    console.error("Failed to load pastor branches", assignmentError);
    throw new Error("Failed to load branches");
  }

  const branchIds = (assignments ?? []).map((a) => a.branch_id).filter(Boolean);
  let members: MemberRow[] = [];
  if (branchIds.length > 0) {
    const { data, error } = await supabase
      .from("member")
      .select("id, first_name, last_name, branch:branch_id (id, name)")
      .eq("church_id", session.churchId)
      .in("branch_id", branchIds);
    if (error) {
      console.error("Failed to load members", error);
      throw new Error("Failed to load members");
    }
    members = (data ?? []) as MemberRow[];
  }

  const base = `/${params.churchSlug}/pastor/members`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">My members</h1>
          <p className="text-sm text-muted-foreground">
            Members filtered to branches assigned to this pastor.
          </p>
        </div>
        <Link href={`${base}/new`} className="rounded-lg bg-primary px-4 py-2 text-primary-foreground">
          Add member
        </Link>
      </div>
      <div className="overflow-hidden rounded-lg border">
        <table className="min-w-full divide-y text-sm">
          <thead className="bg-secondary/50">
            <tr>
              {["Name", "Branch", "Actions"].map((h) => (
                <th key={h} className="px-4 py-2 text-left font-medium text-muted-foreground">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {members.map((member) => (
              <tr key={member.id} className="hover:bg-muted/40">
                <td className="px-4 py-2">{`${member.first_name} ${member.last_name}`}</td>
                <td className="px-4 py-2">{member.branch?.name ?? "—"}</td>
                <td className="px-4 py-2">
                  <Link href={`${base}/${member.id}`} className="text-primary underline">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {members.length === 0 && (
          <div className="p-6 text-sm text-muted-foreground">
            {branchIds.length === 0
              ? "No branches assigned yet. Ask an admin to assign branches to this pastor."
              : "No members found for your assigned branches."}
          </div>
        )}
      </div>
    </div>
  );
}
