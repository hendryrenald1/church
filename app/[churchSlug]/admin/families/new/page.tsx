import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import FamilyForm from "./family-form";

type MemberOption = { id: string; first_name: string; last_name: string; email?: string; phone?: string };

export default async function AdminCreateFamilyPage({ params }: { params: { churchSlug: string } }) {
  const session = await getSessionUser();
  if (!session) redirect("/auth/login");
  if (session.role !== "ADMIN" || !session.churchId) notFound();
  if (session.churchSlug && session.churchSlug !== params.churchSlug) notFound();

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("member")
    .select("id, first_name, last_name, email, phone")
    .eq("church_id", session.churchId)
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true }) as { data: MemberOption[] | null; error: unknown };

  if (error) {
    console.error("Failed to load members", error);
    throw new Error("Failed to load members");
  }

  const members: MemberOption[] = data ?? [];

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Add family</h1>
        <p className="text-sm text-muted-foreground">
          Create a complete family with head, spouse, and children in one workflow.
        </p>
      </div>
      <FamilyForm churchSlug={params.churchSlug} members={members} />
    </div>
  );
}
