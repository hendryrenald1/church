import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

type Props = { params: { churchSlug: string; memberId: string } };

export default async function PastorMemberDetailPage({ params }: Props) {
  const session = await getSessionUser();
  if (!session) redirect("/auth/login");
  if (session.role !== "PASTOR" || !session.churchId || !session.memberId) notFound();
  if (session.churchSlug && session.churchSlug !== params.churchSlug) notFound();

  const supabase = createSupabaseAdminClient();
  const { data: profile, error: profileError } = await supabase
    .from("pastor_profile")
    .select("id")
    .eq("church_id", session.churchId)
    .eq("member_id", session.memberId)
    .maybeSingle();
  if (profileError || !profile) notFound();

  const { data: assignments } = await supabase
    .from("pastor_branch")
    .select("branch_id")
    .eq("pastor_profile_id", profile.id);
  const branchIds = (assignments ?? []).map((row) => row.branch_id).filter((id): id is string => Boolean(id));
  if (branchIds.length === 0) notFound();

  const { data: member, error } = await supabase
    .from("member")
    .select("id, first_name, last_name, email, phone, branch:branch_id (id, name), status, joined_date, date_of_birth, baptism_date")
    .eq("church_id", session.churchId)
    .eq("id", params.memberId)
    .in("branch_id", branchIds)
    .maybeSingle();
  if (error || !member) notFound();

  const displayDate = (value: string | null) => (value ? new Date(value).toLocaleDateString() : "—");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">Member profile</p>
          <h1 className="text-2xl font-semibold">{`${member.first_name} ${member.last_name}`}</h1>
          <p className="text-sm text-muted-foreground">Read-only member and family info.</p>
        </div>
        <Link href={`/${params.churchSlug}/pastor/members`} className="text-sm text-primary underline">
          Back to members
        </Link>
      </div>
      <div className="rounded-lg border p-4 space-y-4">
        <h2 className="text-lg font-semibold">Profile</h2>
        <dl className="grid gap-3 text-sm md:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Branch</dt>
            <dd className="font-medium">{member.branch?.name ?? "Unassigned"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Status</dt>
            <dd className="font-medium">{member.status}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Email</dt>
            <dd className="font-medium">{member.email ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Phone</dt>
            <dd className="font-medium">{member.phone ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Joined</dt>
            <dd className="font-medium">{displayDate(member.joined_date)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Birth date</dt>
            <dd className="font-medium">{displayDate(member.date_of_birth)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Baptism date</dt>
            <dd className="font-medium">{displayDate(member.baptism_date)}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
