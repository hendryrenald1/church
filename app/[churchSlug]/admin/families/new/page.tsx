import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import FamilyForm from "./family-form";

type MemberOption = { id: string; first_name: string; last_name: string };

export default async function AdminCreateFamilyPage({ params }: { params: { churchSlug: string } }) {
  const session = await getSessionUser();
  if (!session) redirect("/auth/login");
  if (session.role !== "ADMIN" || !session.churchId) notFound();
  if (session.churchSlug && session.churchSlug !== params.churchSlug) notFound();

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("member")
    .select("id, first_name, last_name")
    .eq("church_id", session.churchId)
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true });

  if (error) {
    console.error("Failed to load members", error);
    throw new Error("Failed to load members");
  }

  const members: MemberOption[] = data ?? [];

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Add family</h1>
        <p className="text-sm text-muted-foreground">
          Families group members together. Start by naming the family and assigning a head member.
        </p>
      </div>
      <FamilyForm churchSlug={params.churchSlug} members={members} />
    </div>
  );
}
