import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import PastorForm from "../../new/pastor-form";

type MemberOption = { id: string; first_name: string; last_name: string; email: string | null };
type BranchOption = { id: string; name: string };
type Pastor = {
  id: string;
  member_id: string;
  title: string;
  ordination_date: string | null;
  bio: string | null;
  member: MemberOption | null;
  pastor_branch: { branch_id: string | null }[] | null;
};

export default async function AdminEditPastorPage({
  params
}: {
  params: { churchSlug: string; pastorId: string };
}) {
  const session = await getSessionUser();
  if (!session) redirect("/auth/login");
  if (session.role !== "ADMIN" || !session.churchId) notFound();
  if (session.churchSlug && session.churchSlug !== params.churchSlug) notFound();

  const supabase = createSupabaseAdminClient();
  const [membersRes, branchesRes, pastorRes] = await Promise.all([
    supabase
      .from("member")
      .select("id, first_name, last_name, email")
      .eq("church_id", session.churchId)
      .order("last_name", { ascending: true }),
    supabase
      .from("branch")
      .select("id, name")
      .eq("church_id", session.churchId)
      .order("name", { ascending: true }),
    supabase
      .from("pastor_profile")
      .select(
        "id, member_id, title, ordination_date, bio, member:member_id (id, first_name, last_name, email), pastor_branch (branch_id)"
      )
      .eq("church_id", session.churchId)
      .eq("id", params.pastorId)
      .single()
  ]);

  if (membersRes.error || branchesRes.error || pastorRes.error || !pastorRes.data) {
    console.error(
      "Failed to load pastor edit data",
      membersRes.error ?? branchesRes.error ?? pastorRes.error
    );
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Edit pastor</h1>
        <p className="text-sm text-muted-foreground">
          Update pastor profile, login email, and branch assignments.
        </p>
      </div>
      <PastorForm
        churchSlug={params.churchSlug}
        members={(membersRes.data ?? []) as MemberOption[]}
        branches={(branchesRes.data ?? []) as BranchOption[]}
        pastor={pastorRes.data as Pastor}
      />
    </div>
  );
}
