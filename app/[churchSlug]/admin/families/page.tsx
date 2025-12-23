import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FamilySearchBar } from "./_components/family-search-bar";

type FamilyRow = {
  id: string;
  family_name: string | null;
  family_member: {
    relationship: "HEAD" | "SPOUSE" | "CHILD" | "OTHER";
    member: { first_name: string; last_name: string } | null;
  }[];
};

export default async function AdminFamiliesPage({
  params,
  searchParams
}: {
  params: { churchSlug: string };
  searchParams?: { search?: string };
}) {
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

  const searchTerm = (searchParams?.search ?? "").trim().toLowerCase();
  const families = ((data ?? []) as unknown as FamilyRow[]).filter((family) => {
    if (!searchTerm) return true;
    const familyName = (family.family_name ?? "").toLowerCase();
    const memberNames = family.family_member
      .map((m) => `${m.member?.first_name ?? ""} ${m.member?.last_name ?? ""}`.toLowerCase())
      .join(" ");
    return familyName.includes(searchTerm) || memberNames.includes(searchTerm);
  });
  const base = `/${params.churchSlug}/admin/families`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-semibold">Church Families</h1>
            <p className="text-sm text-muted-foreground">View families and household relationships within your church community.</p>
          </div>
          <Link href={`${base}/new`} className="rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90">
            Add family
          </Link>
        </div>
        <FamilySearchBar />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="hidden bg-secondary/50 px-4 py-2 text-sm font-medium text-muted-foreground sm:grid sm:grid-cols-[2fr_1.5fr_1fr_auto]">
            <span>Family</span>
            <span>Head</span>
            <span>Members</span>
            <span className="text-right">Actions</span>
          </div>

          <div className="divide-y">
            {families.map((family) => {
              const head = family.family_member.find((m) => m.relationship === "HEAD");
              const headName = head?.member ? `${head.member.first_name} ${head.member.last_name}` : "—";
              const memberCount = family.family_member.length;
              return (
                <div
                  key={family.id}
                  className="grid grid-cols-1 gap-2 px-4 py-3 text-sm transition-colors hover:bg-muted/40 sm:grid-cols-[2fr_1.5fr_1fr_auto] sm:items-center"
                >
                  <div className="flex items-center justify-between sm:block">
                    <div className="font-medium">{family.family_name ?? "Unnamed Family"}</div>
                    <Badge variant="secondary" className="mt-1 text-xs sm:hidden">
                      {memberCount} members
                    </Badge>
                  </div>
                  <div className="text-muted-foreground">{headName}</div>
                  <div className="hidden sm:block text-muted-foreground">{memberCount}</div>
                  <div className="flex justify-end">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`${base}/${family.id}`}>View</Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {families.length === 0 && (
            <div className="p-6 text-sm text-muted-foreground">No families match your search.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
