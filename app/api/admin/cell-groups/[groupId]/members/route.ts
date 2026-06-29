import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { assertRole } from "@/lib/permissions";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const AddMemberSchema = z.object({
  memberId: z.string().uuid(),
  role: z.enum(["LEADER", "ASSISTANT", "MEMBER"]).default("MEMBER"),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { groupId: string } }
) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  assertRole(session.role, ["ADMIN"]);

  const body = await req.json().catch(() => null);
  const parsed = AddMemberSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  // Verify group belongs to this church
  const { data: group } = await supabase
    .from("cell_group")
    .select("id")
    .eq("id", params.groupId)
    .eq("church_id", session.churchId!)
    .maybeSingle();

  if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

  const { error } = await supabase.from("cell_group_member").insert({
    church_id: session.churchId!,
    group_id: params.groupId,
    member_id: parsed.data.memberId,
    role: parsed.data.role,
    joined_at: new Date().toISOString(),
  });

  if (error) {
    // Duplicate key = already a member
    if (error.code === "23505") {
      return NextResponse.json({ error: "Member is already in this group" }, { status: 409 });
    }
    console.error("Failed to add member", error);
    return NextResponse.json({ error: "Failed to add member" }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
