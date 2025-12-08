import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const familySchema = z.object({
  familyName: z.string().min(1),
  weddingAnniversary: z.string().nullable(),
  address: z.string().nullable(),
  headMemberId: z.string().uuid().nullable()
});

export async function GET() {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("family").select("*").eq("church_id", session.churchId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const payload = await req.json();
  const parsed = familySchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  const supabase = createSupabaseAdminClient();
  const { data: family, error } = await supabase
    .from("family")
    .insert({
      church_id: session.churchId,
      family_name: parsed.data.familyName,
      wedding_anniversary: parsed.data.weddingAnniversary,
      address: parsed.data.address
    })
    .select("id")
    .single();
  if (error || !family) return NextResponse.json({ error: error?.message ?? "Failed" }, { status: 500 });

  if (parsed.data.headMemberId) {
    const { error: linkError } = await supabase.from("family_member").insert({
      church_id: session.churchId,
      family_id: family.id,
      member_id: parsed.data.headMemberId,
      relationship: "HEAD",
      is_primary_contact: true
    });
    if (linkError) return NextResponse.json({ error: linkError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, familyId: family.id });
}
