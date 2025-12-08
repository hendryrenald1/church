import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import MemberForm from "../../new/member-form";

type Branch = { id: string; name: string };
type Member = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  branch_id: string | null;
  status: "ACTIVE" | "INACTIVE";
  joined_date: string;
  date_of_birth: string | null;
  baptism_date: string | null;
};

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
  const [branchesRes, memberRes] = await Promise.all([
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

  if (branchesRes.error || memberRes.error || !memberRes.data) {
    console.error("Failed to load edit member data", branchesRes.error ?? memberRes.error);
    notFound();
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Edit member</h1>
        <p className="text-sm text-muted-foreground">Update personal info and church details.</p>
      </div>
      <MemberForm
        churchSlug={params.churchSlug}
        branches={(branchesRes.data ?? []) as Branch[]}
        member={memberRes.data as Member}
      />
    </div>
  );
}
