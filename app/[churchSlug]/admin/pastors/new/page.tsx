import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import PastorForm from "./pastor-form";

type MemberOption = { id: string; first_name: string; last_name: string; email: string | null };
type BranchOption = { id: string; name: string };

export default async function AdminCreatePastorPage({ params }: { params: { churchSlug: string } }) {
  const session = await getSessionUser();
  if (!session) redirect("/auth/login");
  if (session.role !== "ADMIN" || !session.churchId) notFound();
  if (session.churchSlug && session.churchSlug !== params.churchSlug) notFound();

  const supabase = createSupabaseAdminClient();
  const [{ data: membersData, error: membersError }, { data: branchesData, error: branchesError }] =
    await Promise.all([
      supabase
        .from("member")
        .select("id, first_name, last_name, email")
        .eq("church_id", session.churchId)
        .order("last_name", { ascending: true }),
      supabase
        .from("branch")
        .select("id, name")
        .eq("church_id", session.churchId)
        .order("name", { ascending: true })
    ]);

  if (membersError || branchesError) {
    console.error("Failed to load pastor form data", membersError || branchesError);
    throw new Error("Failed to load data");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Add pastor</h1>
        <p className="text-sm text-muted-foreground">
          Pastors are created from members, with optional branch assignments.
        </p>
      </div>
      <PastorForm
        churchSlug={params.churchSlug}
        members={(membersData ?? []) as MemberOption[]}
        branches={(branchesData ?? []) as BranchOption[]}
      />
    </div>
  );
}
