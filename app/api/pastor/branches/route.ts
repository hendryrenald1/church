import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

/**
 * GET /api/pastor/branches
 *
 * Returns the branches assigned to the current pastor.
 */
export async function GET() {
  const session = await getSessionUser();
  if (!session || session.role !== "PASTOR" || !session.memberId || !session.churchId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = createSupabaseAdminClient();

  // Get pastor profile
  const { data: profileData } = await supabase
    .from("pastor_profile")
    .select("id")
    .eq("church_id", session.churchId)
    .eq("member_id", session.memberId)
    .single();

  if (!profileData) {
    return NextResponse.json([]);
  }

  const profile = profileData as { id: string };

  // Get assigned branches with full details
  const { data: assignments, error } = await supabase
    .from("pastor_branch")
    .select("branch:branch_id (id, name, city)")
    .eq("pastor_profile_id", profile.id);

  if (error) {
    console.error("Failed to fetch pastor branches:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  type BranchAssignment = {
    branch: { id: string; name: string; city: string | null } | null;
  };

  const branches = ((assignments ?? []) as unknown as BranchAssignment[])
    .map((a) => a.branch)
    .filter((b): b is { id: string; name: string; city: string | null } => b !== null);

  return NextResponse.json(branches);
}
