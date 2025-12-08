import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from("church").select("*").eq("id", session.churchId).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(req: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const payload = await req.json();
  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("church")
    .update({
      name: payload.name,
      primary_contact_name: payload.primaryContactName,
      primary_contact_email: payload.primaryContactEmail
    })
    .eq("id", session.churchId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

