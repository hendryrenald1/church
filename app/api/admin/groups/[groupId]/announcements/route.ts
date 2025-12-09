import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getGroupForChurch } from "@/lib/groups";

type Params = { params: { groupId: string } };

const schema = z.object({
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(2000)
});

export async function GET(_: Request, { params }: Params) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN" || !session.churchId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const group = await getGroupForChurch(params.groupId, session.churchId);
  if (group.error)
    return NextResponse.json({ error: group.error }, { status: group.error === "Forbidden" ? 403 : 404 });

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("group_announcement")
    .select("id, title, body, created_at, created_by")
    .eq("group_id", params.groupId)
    .eq("church_id", session.churchId)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: Request, { params }: Params) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN" || !session.churchId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const group = await getGroupForChurch(params.groupId, session.churchId);
  if (group.error)
    return NextResponse.json({ error: group.error }, { status: group.error === "Forbidden" ? 403 : 404 });

  const payload = await req.json();
  const parsed = schema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("group_announcement")
    .insert({
      church_id: session.churchId,
      group_id: params.groupId,
      title: parsed.data.title,
      body: parsed.data.body,
      created_by: session.user.id
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
