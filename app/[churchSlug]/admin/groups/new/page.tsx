import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { GroupForm } from "@/components/groups/group-form";
import { BranchOption } from "../types";

export default async function AdminCreateGroupPage({ params }: { params: { churchSlug: string } }) {
  const session = await getSessionUser();
  if (!session) redirect("/auth/login");
  if (session.role !== "ADMIN" || !session.churchId) notFound();
  if (session.churchSlug && session.churchSlug !== params.churchSlug) notFound();

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("branch")
    .select("id, name")
    .eq("church_id", session.churchId)
    .order("name", { ascending: true });
  if (error) {
    console.error("Failed to load branches", error);
    throw new Error("Failed to load branches");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Create group</h1>
        <p className="text-sm text-muted-foreground">Organize ministry teams, volunteers, or interest groups.</p>
      </div>
      <GroupForm churchSlug={params.churchSlug} branches={(data ?? []) as BranchOption[]} />
    </div>
  );
}
