import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const normalizeNullable = (value: string | null | undefined) => (value && value.trim().length ? value : null);

const groupSchema = z.object({
  name: z.string().min(1),
  type: z.union([z.string().max(100), z.literal(""), z.null()]).optional().transform(normalizeNullable),
  branchId: z.union([z.string().uuid(), z.literal(""), z.null()]).optional().transform(normalizeNullable),
  description: z.union([z.string().max(1000), z.literal(""), z.null()]).optional().transform(normalizeNullable)
});

export async function GET() {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN" || !session.churchId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("group")
    .select("id, name, type, description, branch:branch_id (id, name)")
    .eq("church_id", session.churchId)
    .order("name", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const memberCounts =
    (
      await supabase
        .from("group_member")
        .select("group_id")
        .eq("church_id", session.churchId)
    ).data ?? [];
  const countMap = memberCounts.reduce<Record<string, number>>((acc, row) => {
    if (!row.group_id) return acc;
    acc[row.group_id] = (acc[row.group_id] ?? 0) + 1;
    return acc;
  }, {});

  const payload = (data ?? []).map((group) => ({
    ...group,
    memberCount: countMap[group.id] ?? 0
  }));

  return NextResponse.json(payload);
}

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN" || !session.churchId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const json = await req.json();
  const parsed = groupSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("group")
    .insert({
      church_id: session.churchId,
      name: parsed.data.name,
      type: parsed.data.type,
      description: parsed.data.description,
      branch_id: parsed.data.branchId
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
