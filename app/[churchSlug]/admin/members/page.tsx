import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

type MemberRow = {
  id: string;
  first_name: string;
  last_name: string;
  status: "ACTIVE" | "INACTIVE";
  joined_date: string;
  branch: { name: string | null } | null;
};

export default async function AdminMembersPage({ params }: { params: { churchSlug: string } }) {
  const session = await getSessionUser();
  if (!session) redirect("/auth/login");
  if (session.role !== "ADMIN" || !session.churchId) notFound();
  if (session.churchSlug && session.churchSlug !== params.churchSlug) notFound();

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("member")
    .select("id, first_name, last_name, status, joined_date, branch:branch_id (name)")
    .eq("church_id", session.churchId)
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true });

  if (error) {
    console.error("Failed to load members", error);
    throw new Error("Failed to load members");
  }

  const members = (data ?? []) as MemberRow[];
  const base = `/${params.churchSlug}/admin/members`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Members</h1>
          <p className="text-sm text-muted-foreground">Filter by branch or status.</p>
        </div>
        <Link href={`${base}/new`} className="rounded-lg bg-primary px-4 py-2 text-primary-foreground">
          Add member
        </Link>
      </div>
      <div className="overflow-hidden rounded-lg border">
        <table className="min-w-full divide-y text-sm">
          <thead className="bg-secondary/50">
            <tr>
              {["Name", "Branch", "Status", "Joined", "Actions"].map((h) => (
                <th key={h} className="px-4 py-2 text-left font-medium text-muted-foreground">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {members.map((member) => (
              <tr key={member.id} className="hover:bg-muted/40">
                <td className="px-4 py-2">{`${member.first_name} ${member.last_name}`}</td>
                <td className="px-4 py-2">{member.branch?.name ?? "Unassigned"}</td>
                <td className="px-4 py-2">{member.status}</td>
                <td className="px-4 py-2">{member.joined_date}</td>
                <td className="px-4 py-2">
                  <div className="flex gap-3 text-primary text-sm">
                    <Link href={`${base}/${member.id}`} className="underline">
                      View
                    </Link>
                    <Link href={`${base}/${member.id}/edit`} className="underline">
                      Edit
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {members.length === 0 && (
          <div className="p-6 text-sm text-muted-foreground">No members yet.</div>
        )}
      </div>
    </div>
  );
}
