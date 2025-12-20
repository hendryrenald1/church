import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

type Props = { params: { familyId: string } };

interface FamilyMemberRow {
  id: string;
  member_id: string;
  relationship: string;
  is_primary_contact: boolean;
  member: {
    id: string;
    first_name: string;
    last_name: string;
    gender: string | null;
    email: string | null;
    phone: string | null;
    date_of_birth: string | null;
    status: string;
  };
}

interface FamilyRow {
  id: string;
  church_id: string;
  family_name: string;
  wedding_anniversary: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
  family_member: FamilyMemberRow[];
}

export async function GET(_: Request, { params }: Props) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN" || !session.churchId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("family")
    .select(`
      *,
      family_member(
        id,
        member_id,
        relationship,
        is_primary_contact,
        member(
          id,
          first_name,
          last_name,
          gender,
          email,
          phone,
          date_of_birth,
          status
        )
      )
    `)
    .eq("id", params.familyId)
    .eq("church_id", session.churchId)
    .single() as { data: FamilyRow | null; error: unknown };
  if (error || !data) return NextResponse.json({ error: "Family not found" }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(req: Request, { params }: Props) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN" || !session.churchId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const payload = await req.json();
  const supabase = createSupabaseAdminClient();
  const familyQuery = supabase.from("family");
  // @ts-expect-error Supabase type inference issue
  const { error } = await familyQuery.update({
    family_name: payload.familyName,
    wedding_anniversary: payload.weddingAnniversary,
    address: payload.address,
    updated_at: new Date().toISOString()
  }).eq("id", params.familyId).eq("church_id", session.churchId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: Request, { params }: Props) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN" || !session.churchId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const supabase = createSupabaseAdminClient();

  // First delete all family_member entries
  const { error: memberError } = await supabase
    .from("family_member")
    .delete()
    .eq("family_id", params.familyId);

  if (memberError) return NextResponse.json({ error: memberError.message }, { status: 500 });

  // Then delete the family
  const { error } = await supabase
    .from("family")
    .delete()
    .eq("id", params.familyId)
    .eq("church_id", session.churchId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

