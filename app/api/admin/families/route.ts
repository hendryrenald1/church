import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const newMemberSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  gender: z.string().nullable().optional(),
  dateOfBirth: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional()
});

const memberRefSchema = z.object({
  existing: z.string().uuid().optional(),
  new: newMemberSchema.optional()
});

const familySchema = z.object({
  familyName: z.string().min(1),
  weddingAnniversary: z.string().nullable(),
  address: z.string().nullable(),
  headMemberId: z.string().uuid().nullable().optional(),
  // Enhanced fields
  headMember: memberRefSchema.optional(),
  spouseMember: memberRefSchema.optional(),
  children: z.array(memberRefSchema).optional()
});

export async function GET() {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN" || !session.churchId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("family").select("*").eq("church_id", session.churchId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

async function createMemberIfNew(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  churchId: string,
  memberRef: z.infer<typeof memberRefSchema>
): Promise<string | null> {
  if (memberRef.existing) {
    return memberRef.existing;
  }
  if (memberRef.new) {
    const memberQuery = supabase.from("member");
    const { data, error } = await memberQuery.insert({
      church_id: churchId,
      first_name: memberRef.new.firstName,
      last_name: memberRef.new.lastName,
      gender: memberRef.new.gender || null,
      date_of_birth: memberRef.new.dateOfBirth || null,
      email: memberRef.new.email || null,
      phone: memberRef.new.phone || null,
      status: "ACTIVE",
      joined_date: new Date().toISOString().split("T")[0]
    }).select("id").single();
    if (error || !data) {
      throw new Error(error?.message ?? "Failed to create member");
    }
    return (data as { id: string }).id;
  }
  return null;
}

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN" || !session.churchId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const payload = await req.json();
  const parsed = familySchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "Invalid", details: parsed.error.errors }, { status: 400 });

  const supabase = createSupabaseAdminClient();

  try {
    // 1. Create family
    const familyQuery = supabase.from("family");
    const { data: family, error } = await familyQuery.insert({
      church_id: session.churchId,
      family_name: parsed.data.familyName,
      wedding_anniversary: parsed.data.weddingAnniversary,
      address: parsed.data.address
    }).select("id").single();
    if (error || !family) return NextResponse.json({ error: error?.message ?? "Failed" }, { status: 500 });
    const familyData = family as { id: string };

    // 2. Handle head member (support both old and new format)
    let headMemberId: string | null = null;
    if (parsed.data.headMember) {
      headMemberId = await createMemberIfNew(supabase, session.churchId, parsed.data.headMember);
    } else if (parsed.data.headMemberId) {
      headMemberId = parsed.data.headMemberId;
    }

    if (headMemberId) {
      const familyMemberQuery = supabase.from("family_member");
      const { error: linkError } = await familyMemberQuery.insert({
        church_id: session.churchId,
        family_id: familyData.id,
        member_id: headMemberId,
        relationship: "HEAD",
        is_primary_contact: true
      });
      if (linkError) return NextResponse.json({ error: linkError.message }, { status: 500 });
    }

    // 3. Handle spouse member
    if (parsed.data.spouseMember) {
      const spouseMemberId = await createMemberIfNew(supabase, session.churchId, parsed.data.spouseMember);
      if (spouseMemberId) {
        const familyMemberQuery = supabase.from("family_member");
        const { error: spouseError } = await familyMemberQuery.insert({
          church_id: session.churchId,
          family_id: familyData.id,
          member_id: spouseMemberId,
          relationship: "SPOUSE",
          is_primary_contact: false
        });
        if (spouseError) return NextResponse.json({ error: spouseError.message }, { status: 500 });
      }
    }

    // 4. Handle children
    if (parsed.data.children && parsed.data.children.length > 0) {
      for (const child of parsed.data.children) {
        const childMemberId = await createMemberIfNew(supabase, session.churchId, child);
        if (childMemberId) {
          const familyMemberQuery = supabase.from("family_member");
          const { error: childError } = await familyMemberQuery.insert({
            church_id: session.churchId,
            family_id: familyData.id,
            member_id: childMemberId,
            relationship: "CHILD",
            is_primary_contact: false
          });
          if (childError) return NextResponse.json({ error: childError.message }, { status: 500 });
        }
      }
    }

    return NextResponse.json({ ok: true, familyId: familyData.id });
  } catch (err) {
    console.error("Create family error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to create family" }, { status: 500 });
  }
}
