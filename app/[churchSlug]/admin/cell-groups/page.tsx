import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { Users, Plus, ChevronRight, MapPin, UserCircle2 } from "lucide-react";
import { CellGroupsMobileView } from "./cell-groups-mobile";

export type CellGroupRow = {
  id: string;
  name: string;
  status: "ACTIVE" | "INACTIVE";
  branch: { id: string; name: string } | null;
  cell_group_member: { count: number }[];
  leader?: {
    id: string;
    first_name: string;
    last_name: string;
    phone?: string;
    avatar_url?: string;
  } | null;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const avatarColors = [
  "bg-blue-600",
  "bg-violet-600",
  "bg-emerald-600",
  "bg-amber-600",
  "bg-rose-600",
  "bg-teal-600",
  "bg-indigo-600",
  "bg-pink-600",
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

export default async function AdminCellGroupsPage({ params }: { params: { churchSlug: string } }) {
  const session = await getSessionUser();
  if (!session) redirect("/auth/login");
  if (session.role !== "ADMIN" || !session.churchId) notFound();
  if (session.churchSlug && session.churchSlug !== params.churchSlug) notFound();

  const supabase = createSupabaseAdminClient();

  const [
    { data, error },
    { count: totalCount },
    { count: activeCount },
    { count: inactiveCount },
  ] = await Promise.all([
    supabase
      .from("cell_group")
      .select(`
        id,
        name,
        status,
        branch:branch_id (id, name),
        cell_group_member(count)
      `)
      .eq("church_id", session.churchId)
      .order("name", { ascending: true }),
    supabase
      .from("cell_group")
      .select("*", { count: "exact", head: true })
      .eq("church_id", session.churchId),
    supabase
      .from("cell_group")
      .select("*", { count: "exact", head: true })
      .eq("church_id", session.churchId)
      .eq("status", "ACTIVE"),
    supabase
      .from("cell_group")
      .select("*", { count: "exact", head: true })
      .eq("church_id", session.churchId)
      .eq("status", "INACTIVE"),
  ]);

  if (error) {
    console.error("Failed to load cell groups", error);
    return (
      <div className="mx-auto max-w-4xl px-4 pb-8 pt-4 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-destructive">
          Failed to load cell groups. Please try again.
        </div>
      </div>
    );
  }

  const groups = (data ?? []) as unknown as CellGroupRow[];
  const basePath = `/${params.churchSlug}/admin/cell-groups`;

  return (
    <>
      {/* Mobile layout */}
      <CellGroupsMobileView
        initialGroups={groups}
        basePath={basePath}
        churchId={session.churchId}
      />

      {/* Desktop layout */}
      <div className="hidden md:flex flex-col gap-6">
        {/* Page Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <span>Admin</span>
              <span>/</span>
              <span className="text-foreground font-medium">Cell Groups</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Cell Groups</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage weekly meetings and attendance for all groups.
            </p>
          </div>
          <Link
            href={`${basePath}/new`}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shrink-0"
          >
            <Plus className="h-4 w-4" />
            Create Group
          </Link>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg border bg-card p-4 flex items-center gap-3 shadow-sm">
            <div className="rounded-md bg-primary/10 p-2.5">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground leading-none mb-1">Total Groups</p>
              <p className="text-2xl font-bold leading-none">{totalCount ?? "—"}</p>
            </div>
          </div>
          <div className="rounded-lg border bg-card p-4 flex items-center gap-3 shadow-sm">
            <div className="rounded-md bg-emerald-500/10 p-2.5">
              <Users className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground leading-none mb-1">Active</p>
              <p className="text-2xl font-bold leading-none">{activeCount ?? "—"}</p>
            </div>
          </div>
          <div className="rounded-lg border bg-card p-4 flex items-center gap-3 shadow-sm">
            <div className="rounded-md bg-muted p-2.5">
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground leading-none mb-1">Inactive</p>
              <p className="text-2xl font-bold leading-none">{inactiveCount ?? "—"}</p>
            </div>
          </div>
        </div>

        {/* Groups Table */}
        <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-[1fr_180px_80px_100px_40px] items-center gap-4 px-4 py-2.5 border-b bg-muted/40">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Group</span>
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Branch</span>
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Members</span>
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Status</span>
            <span />
          </div>

          {groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Users className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="font-medium text-sm">No cell groups yet</p>
              <p className="text-xs text-muted-foreground mt-1 mb-4">Create your first group to get started.</p>
              <Link
                href={`${basePath}/new`}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Create Group
              </Link>
            </div>
          ) : (
            groups.map((group) => {
              const memberCount = group.cell_group_member?.[0]?.count ?? 0;
              const isActive = group.status === "ACTIVE";
              const initials = getInitials(group.name);
              const color = getAvatarColor(group.name);

              return (
                <Link
                  key={group.id}
                  href={`${basePath}/${group.id}`}
                  className="group grid grid-cols-[1fr_180px_80px_100px_40px] items-center gap-4 px-4 py-3 border-b last:border-b-0 hover:bg-muted/40 transition-colors"
                >
                  {/* Group name + avatar */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`h-8 w-8 rounded-full ${color} text-white flex items-center justify-center text-xs font-bold shrink-0`}>
                      {initials}
                    </div>
                    <p className="font-medium text-sm truncate leading-tight group-hover:text-primary transition-colors">
                      {group.name}
                    </p>
                  </div>

                  {/* Branch */}
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground min-w-0">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{group.branch?.name ?? "Church-wide"}</span>
                  </div>

                  {/* Member count */}
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <UserCircle2 className="h-3.5 w-3.5 shrink-0" />
                    <span>{memberCount}</span>
                  </div>

                  {/* Status */}
                  <div>
                    {isActive ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                        Inactive
                      </span>
                    )}
                  </div>

                  {/* Arrow */}
                  <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors justify-self-end" />
                </Link>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
