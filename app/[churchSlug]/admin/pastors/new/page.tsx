import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { PastorWizard } from "./pastor-wizard";
import { BranchSummary } from "../types";

export default async function AdminCreatePastorPage({ params }: { params: { churchSlug: string } }) {
  const session = await getSessionUser();
  if (!session) redirect("/auth/login");
  if (session.role !== "ADMIN" || !session.churchId) notFound();
  if (session.churchSlug && session.churchSlug !== params.churchSlug) notFound();

  const supabase = createSupabaseAdminClient();
  const { data: branchData, error: branchError } = await supabase
    .from("branch")
    .select("id, name, city, is_active")
    .eq("church_id", session.churchId)
    .order("name", { ascending: true });

  if (branchError) {
    console.error("Failed to load branches", branchError);
    throw new Error("Failed to load branches");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Add pastor</h1>
        <p className="text-sm text-muted-foreground">
          Pastors are created from members, with optional branch assignments.
        </p>
      </div>
      <PastorWizard churchSlug={params.churchSlug} branches={(branchData ?? []) as BranchSummary[]} />
    </div>
  );
}
