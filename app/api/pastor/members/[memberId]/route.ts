import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Props = { params: { memberId: string } };

export async function GET(_: Request, { params }: Props) {
  const session = await getSessionUser();
  if (!session || session.role !== "PASTOR") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("member")
    .select("*")
    .eq("id", params.memberId)
    .eq("church_id", session.churchId)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

