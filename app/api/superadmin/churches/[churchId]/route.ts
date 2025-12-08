import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";

type Props = { params: { churchId: string } };

async function resolveChurch(ref: string) {
  const supabase = createSupabaseAdminClient();
  // Try by id first
  let { data, error } = await supabase.from("church").select("*").eq("id", ref).maybeSingle();
  if (data) return data;
  // Fallback: try slug
  const bySlug = await supabase.from("church").select("*").eq("slug", ref).maybeSingle();
  if (bySlug.data) return bySlug.data;
  if (error) throw error;
  if (bySlug.error) throw bySlug.error;
  return null;
}

export async function GET(_: Request, { params }: Props) {
  const session = await getSessionUser();
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const data = await resolveChurch(params.churchId);
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(req: Request, { params }: Props) {
  const session = await getSessionUser();
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const payload = await req.json();
  const church = await resolveChurch(params.churchId);
  if (!church) return NextResponse.json({ error: "Not found" }, { status: 404 });
  
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("church").update({
    status: payload.status,
    plan: payload.plan,
    primary_contact_name: payload.primaryContactName,
    primary_contact_email: payload.primaryContactEmail
  }).eq("id", church.id);
  
  if (error) {
    console.error("Update error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: Request, { params }: Props) {
  const session = await getSessionUser();
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const church = await resolveChurch(params.churchId);
  if (!church) return NextResponse.json({ error: "Not found" }, { status: 404 });
  
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("church").delete().eq("id", church.id);
  if (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

