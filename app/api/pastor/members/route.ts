import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function GET() {
  const session = await getSessionUser();
  if (!session || session.role !== "PASTOR" || !session.memberId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const supabase = createSupabaseAdminClient();
  const { data: profile } = await supabase
    .from("pastor_profile")
    .select("id")
    .eq("church_id", session.churchId)
    .eq("member_id", session.memberId)
    .single();
  if (!profile) return NextResponse.json([]);
  const { data: assignments } = await supabase
    .from("pastor_branch")
    .select("branch_id")
    .eq("pastor_profile_id", profile.id);
  const branchIds = (assignments ?? []).map((a) => a.branch_id).filter(Boolean);
  if (branchIds.length === 0) return NextResponse.json([]);
  const { data, error } = await supabase
    .from("member")
    .select("*")
    .eq("church_id", session.churchId)
    .in("branch_id", branchIds);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "PASTOR" || !session.memberId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const payload = await req.json();
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("member").insert({
    church_id: session.churchId,
    branch_id: payload.branchId,
    first_name: payload.firstName,
    last_name: payload.lastName,
    status: payload.status ?? "ACTIVE",
    joined_date: payload.joinedDate
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
