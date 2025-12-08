import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

type Props = { params: { churchSlug: string; memberId: string } };

type Member = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  status: "ACTIVE" | "INACTIVE";
  joined_date: string;
  date_of_birth: string | null;
  baptism_date: string | null;
  branch: { id: string; name: string | null } | null;
};

type FamilyMembership = {
  id: string;
  relationship: string;
  family: { id: string; family_name: string | null } | null;
};

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}

export default async function AdminMemberDetailPage({ params }: Props) {
  const session = await getSessionUser();
  if (!session) redirect("/auth/login");
  if (session.role !== "ADMIN" || !session.churchId) notFound();
  if (session.churchSlug && session.churchSlug !== params.churchSlug) notFound();

  const supabase = createSupabaseAdminClient();
  const { data: member, error } = await supabase
    .from("member")
    .select("id, first_name, last_name, email, phone, status, joined_date, date_of_birth, baptism_date, branch:branch_id (id, name)")
    .eq("church_id", session.churchId)
    .eq("id", params.memberId)
    .single();

  if (error || !member) {
    console.error("Failed to load member", error);
    notFound();
  }

  const { data: familyMemberships } = await supabase
    .from("family_member")
    .select("id, relationship, family:family_id (id, family_name)")
    .eq("member_id", params.memberId)
    .eq("church_id", session.churchId);

  const fams = (familyMemberships ?? []) as FamilyMembership[];
  const fullName = `${member.first_name} ${member.last_name}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-primary">Member profile</p>
        <h1 className="text-2xl font-semibold">{fullName}</h1>
        <p className="text-sm text-muted-foreground">Full profile with family section.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border p-4 md:col-span-2">
          <h2 className="text-lg font-semibold">Profile</h2>
          <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Status</dt>
              <dd className="font-medium">{member.status}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Branch</dt>
              <dd className="font-medium">{member.branch?.name ?? "Unassigned"}</dd>
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
              <dd className="font-medium">{formatDate(member.joined_date)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Birth date</dt>
              <dd className="font-medium">{formatDate(member.date_of_birth)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Baptism date</dt>
              <dd className="font-medium">{formatDate(member.baptism_date)}</dd>
            </div>
          </dl>
        </div>
        <div className="rounded-lg border p-4">
          <h2 className="text-lg font-semibold">Family</h2>
          {fams.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No family linked yet.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {fams.map((membership) => (
                <li key={membership.id} className="rounded border px-3 py-2">
                  <p className="font-medium">{membership.family?.family_name ?? "Family"}</p>
                  <p className="text-muted-foreground">Relationship: {membership.relationship}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
