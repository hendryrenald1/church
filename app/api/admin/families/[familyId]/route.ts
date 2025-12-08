import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Props = { params: { familyId: string } };

export async function GET(_: Request, { params }: Props) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("family")
    .select("*, family_member(*)")
    .eq("id", params.familyId)
    .eq("church_id", session.churchId)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(req: Request, { params }: Props) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const payload = await req.json();
  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("family")
    .update({
      family_name: payload.familyName,
      wedding_anniversary: payload.weddingAnniversary,
      address: payload.address
    })
    .eq("id", params.familyId)
    .eq("church_id", session.churchId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

