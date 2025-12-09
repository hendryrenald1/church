import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { BranchSummary } from "../types";
import { PastorDetailForm } from "../_components/pastor-detail-form";

type Props = { params: { churchSlug: string; pastorId: string } };

export default async function AdminPastorDetailPage({ params }: Props) {
  const session = await getSessionUser();
  if (!session) redirect("/auth/login");
  if (session.role !== "ADMIN" || !session.churchId) notFound();
  if (session.churchSlug && session.churchSlug !== params.churchSlug) notFound();

  const supabase = createSupabaseAdminClient();
  const [pastorRes, branchRes] = await Promise.all([
    supabase
      .from("pastor_profile")
      .select(
        "id, church_id, member_id, title, ordination_date, bio, member:member_id (id, first_name, last_name, email, phone, branch:branch_id (name)), pastor_branch (branch:branch_id (id, name, city, is_active))"
      )
      .eq("church_id", session.churchId)
      .eq("id", params.pastorId)
      .single(),
    supabase
      .from("branch")
      .select("id, name, city, is_active")
      .eq("church_id", session.churchId)
      .order("name", { ascending: true })
  ]);

  if (pastorRes.error || !pastorRes.data) {
    console.error("Failed to load pastor", pastorRes.error);
    notFound();
  }
  if (branchRes.error) {
    console.error("Failed to load branches", branchRes.error);
    throw new Error("Failed to load branches");
  }

  const pastor = pastorRes.data;
  const branchOptions = (branchRes.data ?? []) as BranchSummary[];
  const member = pastor.member;
  const branchAssignments =
    pastor.pastor_branch?.map((pb) => ({
      id: pb.branch?.id ?? "",
      name: pb.branch?.name ?? "Branch",
      city: pb.branch?.city ?? null,
      isActive: pb.branch?.is_active ?? true
    })) ?? [];
  const branchIds = branchAssignments.map((branch) => branch.id).filter(Boolean) as string[];
  const memberName = member ? `${member.first_name} ${member.last_name}` : "Member missing";
  const memberLink = member ? `/${params.churchSlug}/admin/members/${member.id}` : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{memberName}</h1>
          <p className="text-sm text-muted-foreground">View and edit the pastor profile and branch assignments.</p>
        </div>
        <Link href={`/${params.churchSlug}/admin/pastors`} className={cn(buttonVariants({ variant: "outline" }))}>
          Back to list
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Member</CardTitle>
            <CardDescription>Contact information synced from the member record.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <dl className="space-y-2">
              <div>
                <dt className="text-muted-foreground">Full name</dt>
                <dd className="font-medium">{memberName}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Email</dt>
                <dd className="font-medium">{member?.email ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Phone</dt>
                <dd className="font-medium">{member?.phone ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Home branch</dt>
                <dd className="font-medium">{member?.branch?.name ?? "Unassigned"}</dd>
              </div>
            </dl>
            {memberLink && (
              <Link className="text-sm text-primary underline" href={memberLink}>
                View member profile
              </Link>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Current branch assignments</CardTitle>
            <CardDescription>Adjust assignments below and save to update access.</CardDescription>
          </CardHeader>
          <CardContent>
            {branchAssignments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No branches assigned.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {branchAssignments.map((branch) => (
                  <Badge key={branch.id} variant="secondary">
                    {branch.name}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <PastorDetailForm
        pastorId={pastor.id}
        memberId={pastor.member_id}
        defaultTitle={pastor.title}
        defaultBio={pastor.bio}
        defaultEmail={member?.email ?? ""}
        defaultOrdinationDate={pastor.ordination_date}
        defaultBranchIds={branchIds}
        branches={branchOptions}
      />
    </div>
  );
}
