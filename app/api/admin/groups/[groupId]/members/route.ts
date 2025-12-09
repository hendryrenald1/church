import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getGroupForChurch } from "@/lib/groups";

type Params = { params: { groupId: string } };

export async function GET(req: Request, { params }: Params) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN" || !session.churchId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const group = await getGroupForChurch(params.groupId, session.churchId);
  if (group.error)
    return NextResponse.json({ error: group.error }, { status: group.error === "Forbidden" ? 403 : 404 });

  const supabase = createSupabaseAdminClient();
  const { searchParams } = new URL(req.url);
  const scope = searchParams.get("scope");

  if (scope === "candidates") {
    const search = searchParams.get("search")?.trim();
    const branchId = searchParams.get("branchId");
    const status = searchParams.get("status");
    let query = supabase
      .from("member")
      .select("id, first_name, last_name, email, phone, date_of_birth, status, branch:branch_id (id, name)")
      .eq("church_id", session.churchId)
      .order("last_name", { ascending: true })
      .limit(50);
    if (search) {
      const pattern = `%${search}%`;
      query = query.or(
        `first_name.ilike.${pattern},last_name.ilike.${pattern},email.ilike.${pattern},phone.ilike.${pattern}`
      );
    }
    if (branchId) query = query.eq("branch_id", branchId);
    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const memberIdsInGroup =
      (
        await supabase
          .from("group_member")
          .select("member_id")
          .eq("group_id", params.groupId)
          .eq("church_id", session.churchId)
      ).data?.map((row) => row.member_id) ?? [];

    const filtered = (data ?? []).filter((member) => !memberIdsInGroup.includes(member.id));
    return NextResponse.json(filtered);
  }

  const { data, error } = await supabase
    .from("group_member")
    .select(
      "id, member:member_id (id, first_name, last_name, email, phone, date_of_birth, status, branch:branch_id (id, name))"
    )
    .eq("group_id", params.groupId)
    .eq("church_id", session.churchId)
    .order("joined_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
