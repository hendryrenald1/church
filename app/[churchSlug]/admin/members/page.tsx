import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { MembersList } from "@/components/members/members-list";
import { Users, UserCheck, UserX, UserPlus } from "lucide-react";

export default async function AdminMembersPage({ params }: { params: { churchSlug: string } }) {
  const session = await getSessionUser();
  if (!session) redirect("/auth/login");
  if (session.role !== "ADMIN" || !session.churchId) notFound();
  if (session.churchSlug && session.churchSlug !== params.churchSlug) notFound();

  const basePath = `/${params.churchSlug}/admin/members`;

  // Fetch member counts for stat cards
  const supabase = createSupabaseAdminClient();
  const [{ count: totalCount }, { count: activeCount }, { count: inactiveCount }] = await Promise.all([
    supabase
      .from("member")
      .select("*", { count: "exact", head: true })
      .eq("church_id", session.churchId),
    supabase
      .from("member")
      .select("*", { count: "exact", head: true })
      .eq("church_id", session.churchId)
      .eq("status", "ACTIVE"),
    supabase
      .from("member")
      .select("*", { count: "exact", head: true })
      .eq("church_id", session.churchId)
      .eq("status", "INACTIVE"),
  ]);

  return (
    <div className="flex flex-col gap-6 p-0">
      {/* Page Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
            <span>Admin</span>
            <span>/</span>
            <span className="text-foreground font-medium">Members</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Church Members</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage and connect with your congregation.
          </p>
        </div>
        <Link
          href={`${basePath}/new`}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shrink-0"
        >
          <UserPlus className="h-4 w-4" />
          Add Member
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border bg-card p-4 flex items-center gap-3 shadow-sm">
          <div className="rounded-md bg-primary/10 p-2.5">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground leading-none mb-1">Total Members</p>
            <p className="text-2xl font-bold leading-none">{totalCount ?? "—"}</p>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4 flex items-center gap-3 shadow-sm">
          <div className="rounded-md bg-emerald-500/10 p-2.5">
            <UserCheck className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground leading-none mb-1">Active</p>
            <p className="text-2xl font-bold leading-none">{activeCount ?? "—"}</p>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4 flex items-center gap-3 shadow-sm">
          <div className="rounded-md bg-muted p-2.5">
            <UserX className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground leading-none mb-1">Inactive</p>
            <p className="text-2xl font-bold leading-none">{inactiveCount ?? "—"}</p>
          </div>
        </div>
      </div>

      <MembersList churchSlug={params.churchSlug} basePath={basePath} />
    </div>
  );
}
