import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity-logger";

type Props = { params: { familyId: string } };

const relationshipLabels: Record<string, string> = {
  HEAD: "Head of Family",
  SPOUSE: "Spouse",
  CHILD: "Child",
  OTHER: "Other"
};

export async function POST(req: Request, { params }: Props) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN" || !session.churchId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const payload = await req.json();
  const supabase = createSupabaseAdminClient();

  // Get member name for the activity log
  const { data: memberData } = await supabase
    .from("member")
    .select("first_name, last_name")
    .eq("id", payload.memberId)
    .single();
  const member = memberData as { first_name: string; last_name: string } | null;

  const familyMemberQuery = supabase.from("family_member");
  const { error } = await familyMemberQuery.insert({
    family_id: params.familyId,
    member_id: payload.memberId,
    relationship: payload.relationship,
    is_primary_contact: payload.isPrimaryContact ?? false,
    church_id: session.churchId
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Log the activity
  const memberName = member ? `${member.first_name} ${member.last_name}` : "Unknown member";
  await logActivity({
    churchId: session.churchId,
    userId: session.user.id,
    entityType: "family",
    entityId: params.familyId,
    activityType: "member_added",
    title: "Member added to family",
    description: `${memberName} was added as ${relationshipLabels[payload.relationship] ?? payload.relationship}`,
    metadata: {
      memberId: payload.memberId,
      relationship: payload.relationship,
      isPrimaryContact: payload.isPrimaryContact ?? false
    }
  });

  return NextResponse.json({ ok: true });
}

