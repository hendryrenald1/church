import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import MemberForm from "./member-form";

type Branch = { id: string; name: string };

export default async function AdminCreateMemberPage({ params }: { params: { churchSlug: string } }) {
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

  const branches: Branch[] = data ?? [];

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Add member</h1>
        <p className="text-sm text-muted-foreground">
          Member-first flow. Families are linked after creating the member.
        </p>
      </div>
      <MemberForm churchSlug={params.churchSlug} branches={branches} />
    </div>
  );
}
