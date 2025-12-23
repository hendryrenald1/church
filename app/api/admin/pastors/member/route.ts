import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { MemberSearchResult } from "@/app/[churchSlug]/admin/pastors/types";

const createMemberSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().nullable(),
  phone: z.string().min(3).nullable().optional(),
  branchId: z.string().uuid().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE"])
});

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN" || !session.churchId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const payload = await request.json();
  const parsed = createMemberSchema.safeParse({
    ...payload,
    email: payload.email ?? null,
    phone: payload.phone ?? null
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  const memberQuery = supabase.from("member");
  const { data, error } = await memberQuery.insert({
    church_id: session.churchId,
    branch_id: parsed.data.branchId,
    first_name: parsed.data.firstName,
    last_name: parsed.data.lastName,
    email: parsed.data.email,
    phone: parsed.data.phone,
    status: parsed.data.status,
    joined_date: new Date().toISOString(),
    date_of_birth: null,
    baptism_date: null
  }).select("id, first_name, last_name, email, phone, status, branch:branch_id (id, name)").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  type MemberRow = { id: string; first_name: string; last_name: string; email: string | null; phone: string | null; status: string; branch: { id: string; name: string } | null };
  const member = data as unknown as MemberRow;
  const response: MemberSearchResult = {
    id: member.id,
    firstName: member.first_name,
    lastName: member.last_name,
    email: member.email,
    phone: member.phone,
    branchId: member.branch?.id ?? null,
    branchName: member.branch?.name ?? null,
    status: member.status as MemberSearchResult["status"]
  };

  return NextResponse.json(response, { status: 201 });
}
