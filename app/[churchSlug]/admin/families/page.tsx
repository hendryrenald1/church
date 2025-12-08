import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

type FamilyRow = {
  id: string;
  family_name: string | null;
  family_member: {
    relationship: "HEAD" | "SPOUSE" | "CHILD" | "OTHER";
    member: { first_name: string; last_name: string } | null;
  }[];
};

export default async function AdminFamiliesPage({ params }: { params: { churchSlug: string } }) {
  const session = await getSessionUser();
  if (!session) redirect("/auth/login");
  if (session.role !== "ADMIN" || !session.churchId) notFound();
  if (session.churchSlug && session.churchSlug !== params.churchSlug) notFound();

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("family")
    .select("id, family_name, family_member (relationship, member:member_id (first_name, last_name))")
    .eq("church_id", session.churchId)
    .order("family_name", { ascending: true });

  if (error) {
    console.error("Failed to load families", error);
    throw new Error("Failed to load families");
  }

  const families = (data ?? []) as FamilyRow[];
  const base = `/${params.churchSlug}/admin/families`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Families</h1>
          <p className="text-sm text-muted-foreground">
            Member-first flow. Families are created from member profiles.
          </p>
        </div>
        <Link href={`${base}/new`} className="rounded-lg bg-primary px-4 py-2 text-primary-foreground">
          Add family
        </Link>
      </div>
      <div className="overflow-hidden rounded-lg border">
        <table className="min-w-full divide-y text-sm">
          <thead className="bg-secondary/50">
            <tr>
              {["Family", "Head", "Children", "Actions"].map((h) => (
                <th key={h} className="px-4 py-2 text-left font-medium text-muted-foreground">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {families.map((family) => {
              const head = family.family_member.find((m) => m.relationship === "HEAD");
              const headName = head?.member
                ? `${head.member.first_name} ${head.member.last_name}`
                : "—";
              const children = family.family_member.filter((m) => m.relationship === "CHILD").length;
              return (
                <tr key={family.id} className="hover:bg-muted/40">
                  <td className="px-4 py-2">{family.family_name ?? "Unnamed Family"}</td>
                  <td className="px-4 py-2">{headName}</td>
                  <td className="px-4 py-2">{children}</td>
                  <td className="px-4 py-2">
                    <Link href={`${base}/${family.id}`} className="text-primary underline">
                      View
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {families.length === 0 && (
          <div className="p-6 text-sm text-muted-foreground">No families yet.</div>
        )}
      </div>
    </div>
  );
}
