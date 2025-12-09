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

  const { data, error } = await supabase
    .from("member")
    .insert({
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
    })
    .select("id, first_name, last_name, email, phone, status, branch:branch_id (id, name)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const response: MemberSearchResult = {
    id: data.id,
    firstName: data.first_name,
    lastName: data.last_name,
    email: data.email,
    phone: data.phone,
    branchId: data.branch?.id ?? null,
    branchName: data.branch?.name ?? null,
    status: data.status as MemberSearchResult["status"]
  };

  return NextResponse.json(response, { status: 201 });
}
