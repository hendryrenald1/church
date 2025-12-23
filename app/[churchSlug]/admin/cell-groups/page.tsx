import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";

type CellGroupRow = {
  id: string;
  name: string;
  status: "ACTIVE" | "INACTIVE";
  branch: { id: string; name: string } | null;
  cell_group_member: { count: number }[];
};

export default async function AdminCellGroupsPage({ params }: { params: { churchSlug: string } }) {
  const session = await getSessionUser();
  if (!session) redirect("/auth/login");
  if (session.role !== "ADMIN" || !session.churchId) notFound();
  if (session.churchSlug && session.churchSlug !== params.churchSlug) notFound();

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("cell_group")
    .select("id, name, status, branch:branch_id (id, name), cell_group_member(count)")
    .eq("church_id", session.churchId)
    .order("name", { ascending: true });

  if (error) {
    console.error("Failed to load cell groups", error);
    throw new Error("Failed to load cell groups");
  }

  const groups = (data ?? []) as unknown as CellGroupRow[];
  const basePath = `/${params.churchSlug}/admin/cell-groups`;

  return (
    <div className="space-y-6 px-4 pb-6 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Cell Groups</h1>
          <p className="text-sm text-muted-foreground">Manage weekly meetings and attendance.</p>
        </div>
        <Button asChild>
          <Link href={`${basePath}/new`}>Create group</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Groups</CardTitle>
        </CardHeader>
        <CardContent className="divide-y p-0">
          {groups.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">No cell groups yet. Create your first group.</div>
          ) : (
            groups.map((group) => (
              <div key={group.id} className="grid grid-cols-1 gap-2 px-4 py-3 sm:grid-cols-[2fr_1fr_auto] sm:items-center hover:bg-muted/40">
                <div className="flex items-center gap-2">
                  <div>
                    <p className="font-medium">{group.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {group.branch?.name ? `Branch: ${group.branch.name}` : "Church-wide"}
                    </p>
                  </div>
                  <Badge variant={group.status === "ACTIVE" ? "default" : "secondary"} className="text-xs">
                    {group.status}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  Members: {group.cell_group_member?.[0]?.count ?? 0}
                </div>
                <div className="flex justify-start sm:justify-end">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`${basePath}/${group.id}`}>Open</Link>
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
