import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from("branch").select("*").eq("church_id", session.churchId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const payload = await req.json();
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("branch").insert({
    church_id: session.churchId,
    name: payload.name,
    city: payload.city,
    address: payload.address,
    is_active: payload.isActive ?? true
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
