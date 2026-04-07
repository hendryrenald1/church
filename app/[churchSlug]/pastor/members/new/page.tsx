import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import MemberForm from "@/app/[churchSlug]/admin/members/new/member-form";

type Props = { params: { churchSlug: string } };

export default async function PastorCreateMemberPage({ params }: Props) {
  const session = await getSessionUser();
  if (!session) redirect("/auth/login");
  if (session.role !== "PASTOR" || !session.churchId || !session.memberId) notFound();
  if (session.churchSlug && session.churchSlug !== params.churchSlug) notFound();

  const supabase = createSupabaseAdminClient();

  // Get pastor profile
  const { data: profileData, error: profileError } = await supabase
    .from("pastor_profile")
    .select("id")
    .eq("church_id", session.churchId)
    .eq("member_id", session.memberId)
    .maybeSingle();

  if (profileError || !profileData) notFound();

  const profile = profileData as { id: string };

  // Get pastor's assigned branches
  const { data: assignments } = await supabase
    .from("pastor_branch")
    .select("branch_id")
    .eq("pastor_profile_id", profile.id);

  const branchIds = ((assignments ?? []) as { branch_id: string }[])
    .map((row) => row.branch_id)
    .filter((id): id is string => Boolean(id));

  if (branchIds.length === 0) {
    return (
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Add member</h1>
          <p className="text-sm text-muted-foreground">
            You don&apos;t have any assigned branches. Contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  // Fetch branch details for assigned branches
  const { data: branchesData, error: branchesError } = await supabase
    .from("branch")
    .select("id, name")
    .eq("church_id", session.churchId)
    .in("id", branchIds)
    .order("name", { ascending: true });

  if (branchesError) {
    console.error("Failed to load branches", branchesError);
    notFound();
  }

  const branches = (branchesData ?? []) as Array<{ id: string; name: string }>;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Add member</h1>
        <p className="text-sm text-muted-foreground">
          Add a new member to one of your assigned branches.
        </p>
      </div>
      <MemberForm
        churchSlug={params.churchSlug}
        branches={branches}
        apiBasePath="pastor"
      />
    </div>
  );
}
