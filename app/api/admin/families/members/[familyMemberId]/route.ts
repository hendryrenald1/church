import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity-logger";

type Props = { params: { familyMemberId: string } };

export async function DELETE(_: Request, { params }: Props) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN" || !session.churchId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const supabase = createSupabaseAdminClient();

  // Get family member details before deleting for the activity log
  const { data: familyMemberData } = await supabase
    .from("family_member")
    .select("family_id, member_id, relationship, member:member_id (first_name, last_name)")
    .eq("id", params.familyMemberId)
    .single();

  type FamilyMemberRow = {
    family_id: string;
    member_id: string;
    relationship: string;
    member: { first_name: string; last_name: string } | null;
  };
  const familyMember = familyMemberData as FamilyMemberRow | null;

  const { error } = await supabase.from("family_member").delete().eq("id", params.familyMemberId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Log the activity
  if (familyMember) {
    const memberName = familyMember.member
      ? `${familyMember.member.first_name} ${familyMember.member.last_name}`
      : "Unknown member";
    await logActivity({
      churchId: session.churchId,
      userId: session.user.id,
      entityType: "family",
      entityId: familyMember.family_id,
      activityType: "member_removed",
      title: "Member removed from family",
      description: `${memberName} was removed from the family`,
      metadata: {
        memberId: familyMember.member_id,
        relationship: familyMember.relationship
      }
    });
  }

  return NextResponse.json({ ok: true });
}

