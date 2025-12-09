import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getGroupForChurch } from "@/lib/groups";

const schema = z.object({
  memberId: z.string().uuid()
});

type Params = { params: { groupId: string } };

export async function POST(req: Request, { params }: Params) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN" || !session.churchId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const group = await getGroupForChurch(params.groupId, session.churchId);
  if (group.error)
    return NextResponse.json({ error: group.error }, { status: group.error === "Forbidden" ? 403 : 404 });

  const payload = await req.json();
  const parsed = schema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "Invalid member id" }, { status: 400 });

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("group_member")
    .delete()
    .eq("group_id", params.groupId)
    .eq("member_id", parsed.data.memberId)
    .eq("church_id", session.churchId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
