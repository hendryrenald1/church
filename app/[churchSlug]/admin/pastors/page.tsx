import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

type PastorRow = {
  id: string;
  title: string;
  ordination_date: string | null;
  member: { first_name: string; last_name: string } | null;
  pastor_branch: { branch: { id: string; name: string } | null }[];
};

export default async function AdminPastorsPage({ params }: { params: { churchSlug: string } }) {
  const session = await getSessionUser();
  if (!session) redirect("/auth/login");
  if (session.role !== "ADMIN" || !session.churchId) notFound();
  if (session.churchSlug && session.churchSlug !== params.churchSlug) notFound();

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("pastor_profile")
    .select(
      "id, title, ordination_date, member:member_id (first_name, last_name), pastor_branch (branch:branch_id (id, name))"
    )
    .eq("church_id", session.churchId)
    .order("title", { ascending: true });

  if (error) {
    console.error("Failed to load pastors", error);
    throw new Error("Failed to load pastors");
  }

  const pastors = (data ?? []) as PastorRow[];
  const base = `/${params.churchSlug}/admin/pastors`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Pastors</h1>
          <p className="text-sm text-muted-foreground">
            Pastors are members with pastor profiles and branch assignments.
          </p>
        </div>
        <Link href={`${base}/new`} className="rounded-lg bg-primary px-4 py-2 text-primary-foreground">
          Add pastor
        </Link>
      </div>
      <div className="overflow-hidden rounded-lg border">
        <table className="min-w-full divide-y text-sm">
          <thead className="bg-secondary/50">
            <tr>
              {["Name", "Title", "Branches", "Actions"].map((h) => (
                <th key={h} className="px-4 py-2 text-left font-medium text-muted-foreground">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {pastors.map((pastor) => {
              const name = pastor.member
                ? `${pastor.member.first_name} ${pastor.member.last_name}`
                : "Member missing";
              const branches = pastor.pastor_branch
                .map((pb) => pb.branch?.name)
                .filter(Boolean)
                .join(", ");
              return (
                <tr key={pastor.id} className="hover:bg-muted/40">
                  <td className="px-4 py-2">{name}</td>
                  <td className="px-4 py-2">{pastor.title}</td>
                  <td className="px-4 py-2">{branches || "—"}</td>
                <td className="px-4 py-2">
                  <div className="flex gap-3 text-sm text-primary">
                    <Link href={`${base}/${pastor.id}`} className="underline">
                      View
                    </Link>
                    <Link href={`${base}/${pastor.id}/edit`} className="underline">
                      Edit
                    </Link>
                  </div>
                </td>
              </tr>
            );
          })}
          </tbody>
        </table>
        {pastors.length === 0 && (
          <div className="p-6 text-sm text-muted-foreground">No pastors yet.</div>
        )}
      </div>
    </div>
  );
}
