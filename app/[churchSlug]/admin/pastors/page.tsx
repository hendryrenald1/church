import Link from "next/link";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { PastorFilters } from "./_components/pastor-filters";
import { PastorRowActions } from "./_components/pastor-row-actions";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { BranchSummary, PastorListRow } from "./types";

type SearchParams = { query?: string; branchId?: string };

export default async function AdminPastorsPage({
  params,
  searchParams
}: {
  params: { churchSlug: string };
  searchParams?: SearchParams;
}) {
  const session = await getSessionUser();
  if (!session) redirect("/auth/login");
  if (session.role !== "ADMIN" || !session.churchId) notFound();
  if (session.churchSlug && session.churchSlug !== params.churchSlug) notFound();

  const supabase = createSupabaseAdminClient();
  const { data: branchData, error: branchError } = await supabase
    .from("branch")
    .select("id, name, city, is_active")
    .eq("church_id", session.churchId)
    .order("name", { ascending: true });
  if (branchError) {
    console.error("Failed to load branches", branchError);
    throw new Error("Failed to load branches");
  }

  const basePath = `/${params.churchSlug}/admin/pastors`;
  const query = searchParams?.query?.trim() ?? "";
  const branchId = searchParams?.branchId?.trim() ?? "";

  const pastorsPromise = getPastors(session.churchId, { query, branchId });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Pastors</h1>
          <p className="text-sm text-muted-foreground">
            Find and manage the pastors serving across your branches.
          </p>
        </div>
        <Link href={`${basePath}/new`} className={cn(buttonVariants({ variant: "default", size: "lg" }))}>
          Add pastor
        </Link>
      </div>
      <PastorFilters
        initialQuery={query}
        initialBranchId={branchId}
        branches={(branchData ?? []) as BranchSummary[]}
        basePath={basePath}
      />
      <Suspense fallback={<PastorTableSkeleton />}>
        <PastorTable promise={pastorsPromise} basePath={basePath} />
      </Suspense>
    </div>
  );
}

async function getPastors(churchId: string, filters: SearchParams) {
  const supabase = createSupabaseAdminClient();
  const searchTerm = filters.query?.trim();
  let query = supabase
    .from("pastor_profile")
    .select(
      "id, title, ordination_date, member:member_id (id, first_name, last_name, email, phone, status), pastor_branch (branch:branch_id (id, name, city, is_active))"
    )
    .eq("church_id", churchId)
    .order("updated_at", { ascending: false });

  if (searchTerm) {
    const pattern = `%${searchTerm}%`;
    query = query.or(
      `member.first_name.ilike.${pattern},member.last_name.ilike.${pattern},member.email.ilike.${pattern}`,
      { referencedTable: "member" }
    );
  }

  const { data, error } = await query;
  if (error) {
    console.error("Failed to load pastors", error);
    throw new Error("Failed to load pastors");
  }

  const rows = (data ?? []).map((row) => {
    const member = row.member;
    const branches =
      row.pastor_branch?.map((pb) => ({
        id: pb.branch?.id ?? "",
        name: pb.branch?.name ?? "Branch",
        city: pb.branch?.city ?? null,
        isActive: pb.branch?.is_active ?? true
      })) ?? [];
    return {
      id: row.id,
      title: row.title,
      ordinationDate: row.ordination_date,
      member: member
        ? {
            id: member.id,
            firstName: member.first_name,
            lastName: member.last_name,
            email: member.email,
            phone: member.phone,
            branchId: null,
            branchName: null,
            status: (member.status as "ACTIVE" | "INACTIVE") ?? "ACTIVE"
          }
        : null,
      branches
    } satisfies PastorListRow;
  });

  if (filters.branchId) {
    return rows.filter((row) => row.branches.some((b) => b.id === filters.branchId));
  }

  return rows;
}

async function PastorTable({ promise, basePath }: { promise: Promise<PastorListRow[]>; basePath: string }) {
  const pastors = await promise;

  if (pastors.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
        No pastors match the current filters.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Branches</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pastors.map((pastor) => {
            const member = pastor.member;
            const fullName = member ? `${member.firstName} ${member.lastName}` : "Member missing";
            return (
              <TableRow key={pastor.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{fullName}</span>
                    <span className="text-xs text-muted-foreground">
                      {pastor.ordinationDate ? `Ordained ${new Date(pastor.ordinationDate).toLocaleDateString()}` : "Ordination date unknown"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{pastor.title}</TableCell>
                <TableCell>{member?.email ?? "—"}</TableCell>
                <TableCell>
                  {pastor.branches.length === 0 ? (
                    <span className="text-sm text-muted-foreground">No branches</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {pastor.branches.map((branch) => (
                        <Badge key={branch.id} variant="secondary">
                          {branch.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <PastorRowActions basePath={basePath} pastorId={pastor.id} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function PastorTableSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="space-y-4">
        {[0, 1, 2].map((idx) => (
          <div key={idx} className="grid gap-4 md:grid-cols-[2fr_1fr_1fr_1fr_auto]">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        ))}
      </div>
    </div>
  );
}
