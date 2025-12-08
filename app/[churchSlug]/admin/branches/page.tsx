import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

type Branch = {
  id: string;
  name: string;
  city: string;
  is_active: boolean;
};

export default async function AdminBranchesPage({ params }: { params: { churchSlug: string } }) {
  const session = await getSessionUser();
  if (!session) redirect("/auth/login");
  if (session.role !== "ADMIN" || !session.churchId) notFound();
  if (session.churchSlug && session.churchSlug !== params.churchSlug) notFound();

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("branch")
    .select("id, name, city, is_active")
    .eq("church_id", session.churchId)
    .order("name", { ascending: true });

  if (error) {
    console.error("Failed to load branches", error);
    throw new Error("Failed to load branches");
  }

  const branches: Branch[] = data ?? [];
  const base = `/${params.churchSlug}/admin/branches`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Branches</h1>
          <p className="text-sm text-muted-foreground">Manage campuses for this church.</p>
        </div>
        <Link
          href={`${base}/new`}
          className="rounded-lg bg-primary px-4 py-2 text-primary-foreground"
        >
          Add branch
        </Link>
      </div>
      <div className="overflow-hidden rounded-lg border">
        <table className="min-w-full divide-y text-sm">
          <thead className="bg-secondary/50">
            <tr>
              {["Name", "City", "Active", "Actions"].map((h) => (
                <th key={h} className="px-4 py-2 text-left font-medium text-muted-foreground">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {branches.map((branch) => (
              <tr key={branch.id} className="hover:bg-muted/40">
                <td className="px-4 py-2">{branch.name}</td>
                <td className="px-4 py-2">{branch.city}</td>
                <td className="px-4 py-2">{branch.is_active ? "Yes" : "No"}</td>
                <td className="px-4 py-2">
                  <Link href={`${base}/${branch.id}`} className="text-primary underline">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {branches.length === 0 && (
          <div className="p-6 text-sm text-muted-foreground">No branches yet.</div>
        )}
      </div>
    </div>
  );
}
