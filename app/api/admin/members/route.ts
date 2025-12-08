import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const memberSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  branchId: z.string().uuid().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  joinedDate: z.string(),
  dateOfBirth: z.string().nullable(),
  baptismDate: z.string().nullable(),
  gender: z.string().optional(),
  email: z.string().email().nullable(),
  phone: z.string().nullable()
});

export async function GET() {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("member").select("*").eq("church_id", session.churchId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const payload = await req.json();
  const parsed = memberSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("member").insert({
    church_id: session.churchId,
    branch_id: parsed.data.branchId,
    first_name: parsed.data.firstName,
    last_name: parsed.data.lastName,
    gender: parsed.data.gender ?? null,
    email: parsed.data.email,
    phone: parsed.data.phone,
    status: parsed.data.status,
    joined_date: parsed.data.joinedDate,
    date_of_birth: parsed.data.dateOfBirth,
    baptism_date: parsed.data.baptismDate
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
