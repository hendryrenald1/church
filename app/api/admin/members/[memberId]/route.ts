import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const updateSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  branchId: z.string().uuid().nullable().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  joinedDate: z.string().optional(),
  dateOfBirth: z.string().nullable().optional(),
  baptismDate: z.string().nullable().optional(),
  gender: z.string().optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional()
});

type Props = { params: { memberId: string } };

export async function GET(_: Request, { params }: Props) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN" || !session.churchId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("member")
    .select("*")
    .eq("id", params.memberId)
    .eq("church_id", session.churchId)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(req: Request, { params }: Props) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN" || !session.churchId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const payload = await req.json();
  const parsed = updateSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("member")
    .update({
      first_name: parsed.data.firstName,
      last_name: parsed.data.lastName,
      branch_id: parsed.data.branchId,
      status: parsed.data.status,
      joined_date: parsed.data.joinedDate,
      date_of_birth: parsed.data.dateOfBirth,
      baptism_date: parsed.data.baptismDate,
      gender: parsed.data.gender,
      email: parsed.data.email,
      phone: parsed.data.phone
    })
    .eq("id", params.memberId)
    .eq("church_id", session.churchId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: Request, { params }: Props) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN" || !session.churchId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("member").delete().eq("id", params.memberId).eq("church_id", session.churchId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
