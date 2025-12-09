import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { MemberSearchResult } from "@/app/[churchSlug]/admin/pastors/types";

const SEARCH_LIMIT = 20;

export async function GET(request: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN" || !session.churchId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";
  if (!query) {
    return NextResponse.json([], { status: 200 });
  }

  const supabase = createSupabaseAdminClient();
  const pattern = `%${query}%`;
  const { data, error } = await supabase
    .from("member")
    .select("id, first_name, last_name, email, phone, status, branch_id")
    .eq("church_id", session.churchId)
    .or(`first_name.ilike.${pattern},last_name.ilike.${pattern},email.ilike.${pattern},phone.ilike.${pattern}`)
    .order("last_name", { ascending: true })
    .limit(SEARCH_LIMIT);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const members = data ?? [];
  const branchIds = Array.from(new Set(members.map((member) => member.branch_id).filter((id): id is string => Boolean(id))));
  let branchMap = new Map<string, string>();
  if (branchIds.length > 0) {
    const { data: branchData, error: branchError } = await supabase
      .from("branch")
      .select("id, name")
      .in("id", branchIds);
    if (branchError) return NextResponse.json({ error: branchError.message }, { status: 500 });
    branchMap = new Map((branchData ?? []).map((branch) => [branch.id, branch.name]));
  }

  const results: MemberSearchResult[] = members.map((member) => ({
    id: member.id,
    firstName: member.first_name,
    lastName: member.last_name,
    email: member.email,
    phone: member.phone,
    branchId: member.branch_id,
    branchName: member.branch_id ? branchMap.get(member.branch_id) ?? null : null,
    status: member.status as MemberSearchResult["status"]
  }));

  return NextResponse.json(results);
}
