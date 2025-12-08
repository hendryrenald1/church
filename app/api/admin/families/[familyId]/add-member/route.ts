import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Props = { params: { familyId: string } };

export async function POST(req: Request, { params }: Props) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const payload = await req.json();
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("family_member").insert({
    family_id: params.familyId,
    member_id: payload.memberId,
    relationship: payload.relationship,
    is_primary_contact: payload.isPrimaryContact ?? false
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

