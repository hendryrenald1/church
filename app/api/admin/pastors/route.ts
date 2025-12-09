import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const pastorSchema = z.object({
  memberId: z.string().uuid(),
  email: z.string().email(),
  title: z.string().min(1),
  ordinationDate: z.string().nullable(),
  bio: z.string().nullable(),
  branchIds: z.array(z.string().uuid()).optional()
});

export async function GET() {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!session.churchId) return NextResponse.json({ error: "Missing church" }, { status: 400 });
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("pastor_profile")
    .select(
      "*, member:member_id (first_name, last_name), pastor_branch (branch:branch_id (id, name))"
    )
    .eq("church_id", session.churchId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!session.churchId) return NextResponse.json({ error: "Missing church" }, { status: 400 });
  const payload = await req.json();
  const parsed = pastorSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  const supabase = createSupabaseAdminClient();

  const { data: member } = await supabase
    .from("member")
    .select("id, email")
    .eq("id", parsed.data.memberId)
    .eq("church_id", session.churchId)
    .single();
  if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });

  const { data: existingProfile } = await supabase
    .from("pastor_profile")
    .select("id")
    .eq("church_id", session.churchId)
    .eq("member_id", parsed.data.memberId)
    .maybeSingle();
  if (existingProfile) {
    return NextResponse.json({ error: "This member is already a pastor" }, { status: 400 });
  }

  const { data: conflictingEmail } = await supabase
    .from("app_user")
    .select("id")
    .eq("church_id", session.churchId)
    .eq("email", parsed.data.email)
    .maybeSingle();
  if (conflictingEmail) {
    return NextResponse.json({ error: "Login email already in use for this church" }, { status: 400 });
  }

  if (member.email !== parsed.data.email) {
    await supabase
      .from("member")
      .update({ email: parsed.data.email })
      .eq("id", parsed.data.memberId)
      .eq("church_id", session.churchId);
  }

  const { data: profile, error } = await supabase
    .from("pastor_profile")
    .insert({
      church_id: session.churchId,
      member_id: parsed.data.memberId,
      title: parsed.data.title,
      ordination_date: parsed.data.ordinationDate,
      bio: parsed.data.bio
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const uniqueBranchIds = Array.from(new Set(parsed.data.branchIds ?? []));
  if (uniqueBranchIds.length) {
    await supabase.from("pastor_branch").insert(
      uniqueBranchIds.map((branchId) => ({
        church_id: session.churchId,
        pastor_profile_id: profile.id,
        branch_id: branchId
      }))
    );
  }

  let churchSlug = session.churchSlug;
  if (!churchSlug) {
    const { data: church, error: churchError } = await supabase
      .from("church")
      .select("slug")
      .eq("id", session.churchId)
      .single();
    if (churchError) {
      console.error("Failed to resolve church slug", churchError);
    } else {
      churchSlug = church?.slug;
    }
  }
  if (!churchSlug) return NextResponse.json({ error: "Missing church slug" }, { status: 500 });

  const metadata = {
    role: "PASTOR",
    church_id: session.churchId,
    church_slug: churchSlug,
    member_id: parsed.data.memberId
  };

  const { data: createdUser, error: createUserError } = await supabase.auth.admin.createUser({
    email: parsed.data.email,
    password: randomUUID(),
    email_confirm: false,
    user_metadata: metadata
  });
  if (createUserError) return NextResponse.json({ error: createUserError.message }, { status: 500 });
  const authUser = createdUser?.user;
  if (!authUser) return NextResponse.json({ error: "Failed to create pastor user" }, { status: 500 });

  const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(parsed.data.email, { data: metadata });
  if (inviteError) console.error("Pastor invite email failed", inviteError);

  const { error: appUserError } = await supabase.from("app_user").upsert(
    {
      id: authUser.id,
      email: parsed.data.email,
      role: "PASTOR",
      church_id: session.churchId,
      member_id: parsed.data.memberId
    },
    { onConflict: "id" }
  );
  if (appUserError) console.error("Failed to sync app_user", appUserError);

  return NextResponse.json({ ok: true, id: profile.id });
}
