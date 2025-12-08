import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

type Props = { params: { churchSlug: string; pastorId: string } };

export default async function AdminPastorDetailPage({ params }: Props) {
  const session = await getSessionUser();
  if (!session) redirect("/auth/login");
  if (session.role !== "ADMIN" || !session.churchId) notFound();
  if (session.churchSlug && session.churchSlug !== params.churchSlug) notFound();

  const supabase = createSupabaseAdminClient();
  const { data: pastor, error } = await supabase
    .from("pastor_profile")
    .select(
      "id, title, ordination_date, bio, member:member_id (id, first_name, last_name, email, phone), pastor_branch (branch:branch_id (id, name, city))"
    )
    .eq("church_id", session.churchId)
    .eq("id", params.pastorId)
    .single();
  if (error || !pastor) {
    console.error("Failed to load pastor", error);
    notFound();
  }

  const member = pastor.member;
  const branches = pastor.pastor_branch ?? [];
  const name = member ? `${member.first_name} ${member.last_name}` : "Member missing";
  const displayDate = (value: string | null) => (value ? new Date(value).toLocaleDateString() : "—");
  const editHref = `/${params.churchSlug}/admin/pastors/${pastor.id}/edit`;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{name}</h1>
          <p className="text-sm text-muted-foreground">View pastor profile and branch assignments.</p>
        </div>
        <Link href={editHref} className="text-sm text-primary underline">
          Edit
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border p-4 space-y-4">
          <h2 className="text-lg font-semibold">Profile</h2>
          <dl className="grid gap-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Title</dt>
              <dd className="font-medium">{pastor.title}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Ordination date</dt>
              <dd className="font-medium">{displayDate(pastor.ordination_date)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Email</dt>
              <dd className="font-medium">{member?.email ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Phone</dt>
              <dd className="font-medium">{member?.phone ?? "—"}</dd>
            </div>
          </dl>
          {member && (
            <Link href={`/${params.churchSlug}/admin/members/${member.id}`} className="text-sm text-primary underline">
              View member profile
            </Link>
          )}
        </div>
        <div className="rounded-lg border p-4">
          <h2 className="text-lg font-semibold">Assigned branches</h2>
          {branches.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No branches assigned.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {branches.map((assignment) => (
                <li key={assignment.branch?.id ?? assignment.branch?.name} className="rounded border px-3 py-2">
                  <p className="font-medium">{assignment.branch?.name ?? "Branch"}</p>
                  <p className="text-muted-foreground">{assignment.branch?.city ?? "City unknown"}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      {pastor.bio && (
        <div className="rounded-lg border p-4">
          <h2 className="text-lg font-semibold">Bio</h2>
          <p className="text-sm text-muted-foreground">{pastor.bio}</p>
        </div>
      )}
    </div>
  );
}
