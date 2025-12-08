import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Props = { params: { branchId: string } };

export async function GET(_: Request, { params }: Props) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("branch")
    .select("*")
    .eq("id", params.branchId)
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
    .from("branch")
    .update({
      name: payload.name,
      city: payload.city,
      address: payload.address,
      is_active: payload.isActive
    })
    .eq("id", params.branchId)
    .eq("church_id", session.churchId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: Request, { params }: Props) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("branch").delete().eq("id", params.branchId).eq("church_id", session.churchId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

