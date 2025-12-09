import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getGroupForChurch } from "@/lib/groups";

const normalizeNullable = (value: string | null | undefined) => (value && value.trim().length ? value : null);

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.union([z.string().max(100), z.literal(""), z.null()]).optional().transform(normalizeNullable),
  branchId: z.union([z.string().uuid(), z.literal(""), z.null()]).optional().transform(normalizeNullable),
  description: z.union([z.string().max(1000), z.literal(""), z.null()]).optional().transform(normalizeNullable)
});

type Params = { params: { groupId: string } };

export async function GET(_: Request, { params }: Params) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN" || !session.churchId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const result = await getGroupForChurch(params.groupId, session.churchId);
  if (result.error) return NextResponse.json({ error: result.error }, { status: result.error === "Forbidden" ? 403 : 404 });

  return NextResponse.json(result.data);
}

export async function PATCH(req: Request, { params }: Params) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN" || !session.churchId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const existing = await getGroupForChurch(params.groupId, session.churchId);
  if (existing.error)
    return NextResponse.json({ error: existing.error }, { status: existing.error === "Forbidden" ? 403 : 404 });

  const payload = await req.json();
  const parsed = updateSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("group")
    .update({
      name: parsed.data.name ?? existing.data?.name,
      type: parsed.data.type ?? existing.data?.type,
      description: parsed.data.description ?? existing.data?.description,
      branch_id: parsed.data.branchId ?? existing.data?.branch?.id ?? null
    })
    .eq("id", params.groupId)
    .eq("church_id", session.churchId)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
