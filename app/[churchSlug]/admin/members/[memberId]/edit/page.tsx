import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";
import MemberForm from "../../new/member-form";

export default async function AdminEditMemberPage({
  params
}: {
  params: { churchSlug: string; memberId: string };
}) {
  const session = await getSessionUser();
  if (!session) redirect("/auth/login");
  if (session.role !== "ADMIN" || !session.churchId) notFound();
  if (session.churchSlug && session.churchSlug !== params.churchSlug) notFound();

  const supabase = createSupabaseAdminClient();
  const [
    { data: branchesData, error: branchesError },
    { data: memberData, error: memberError }
  ] = await Promise.all([
    supabase
      .from("branch")
      .select("id, name")
      .eq("church_id", session.churchId)
      .order("name", { ascending: true }),
    supabase
      .from("member")
      .select("id, first_name, last_name, email, phone, branch_id, status, joined_date, date_of_birth, baptism_date")
      .eq("church_id", session.churchId)
      .eq("id", params.memberId)
      .single()
  ]);

  if (branchesError || memberError || !memberData) {
    console.error("Failed to load edit member data", branchesError ?? memberError);
    notFound();
  }
  type BranchRow = Pick<Database["public"]["Tables"]["branch"]["Row"], "id" | "name">;
  type MemberRow = Pick<
    Database["public"]["Tables"]["member"]["Row"],
    | "id"
    | "first_name"
    | "last_name"
    | "email"
    | "phone"
    | "branch_id"
    | "status"
    | "joined_date"
    | "date_of_birth"
    | "baptism_date"
  >;
  const branches = (branchesData ?? []) as BranchRow[];
  const member = memberData as MemberRow;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Edit member</h1>
        <p className="text-sm text-muted-foreground">Update personal info and church details.</p>
      </div>
      <MemberForm churchSlug={params.churchSlug} branches={branches} member={member} />
    </div>
  );
}
