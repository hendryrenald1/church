import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const updateSchema = z.object({
  memberId: z.string().uuid(),
  email: z.string().email(),
  title: z.string().min(1),
  ordinationDate: z.string().nullable(),
  bio: z.string().nullable(),
  branchIds: z.array(z.string().uuid()).optional()
});

type Props = { params: { pastorId: string } };

export async function GET(_: Request, { params }: Props) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN" || !session.churchId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("pastor_profile")
    .select(
      "*, member:member_id (id, first_name, last_name, email), pastor_branch (id, branch_id, branch:branch_id (id, name))"
    )
    .eq("id", params.pastorId)
    .eq("church_id", session.churchId)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(req: Request, { params }: Props) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN" || !session.churchId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const payload = await req.json();
  const parsed = updateSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const supabase = createSupabaseAdminClient();
  const { data: profileData, error: profileError } = await supabase
    .from("pastor_profile")
    .select("id, member_id")
    .eq("id", params.pastorId)
    .eq("church_id", session.churchId)
    .single();
  if (profileError || !profileData) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const profile = profileData as { id: string; member_id: string };
  if (profile.member_id !== parsed.data.memberId)
    return NextResponse.json({ error: "Member cannot be changed" }, { status: 400 });

  const { data: conflictingEmail } = await supabase
    .from("app_user")
    .select("id")
    .eq("church_id", session.churchId)
    .eq("email", parsed.data.email)
    .neq("member_id", parsed.data.memberId)
    .maybeSingle();
  if (conflictingEmail) {
    return NextResponse.json({ error: "Login email already in use for this church" }, { status: 400 });
  }

  const memberQuery = supabase.from("member");
  // @ts-expect-error Supabase type inference issue
  await memberQuery.update({ email: parsed.data.email }).eq("id", parsed.data.memberId).eq("church_id", session.churchId);

  const pastorProfileQuery = supabase.from("pastor_profile");
  // @ts-expect-error Supabase type inference issue
  const { error: updateError } = await pastorProfileQuery.update({
    title: parsed.data.title,
    ordination_date: parsed.data.ordinationDate,
    bio: parsed.data.bio
  }).eq("id", params.pastorId).eq("church_id", session.churchId);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  await supabase.from("pastor_branch").delete().eq("pastor_profile_id", profile.id);
  const uniqueBranchIds = Array.from(new Set(parsed.data.branchIds ?? []));
  if (uniqueBranchIds.length) {
    const pastorBranchQuery = supabase.from("pastor_branch");
    const insertData = uniqueBranchIds.map((branchId) => ({
      church_id: session.churchId,
      pastor_profile_id: profile.id,
      branch_id: branchId
    }));
    // @ts-expect-error Supabase type inference issue
    await pastorBranchQuery.insert(insertData);
  }

  const { data: appUserData } = await supabase
    .from("app_user")
    .select("id")
    .eq("member_id", parsed.data.memberId)
    .eq("role", "PASTOR")
    .maybeSingle();
  const appUser = appUserData as { id: string } | null;

  const ensureSlug = async () => {
    let slug = session.churchSlug;
    if (!slug) {
      const { data: church } = await supabase
        .from("church")
        .select("slug")
        .eq("id", session.churchId!)
        .single();
      const churchData = church as { slug: string } | null;
      slug = churchData?.slug;
    }
    return slug;
  };

  const syncExistingUser = async (userId: string) => {
    const churchSlug = await ensureSlug();
    if (!churchSlug) throw new Error("Missing church slug");
    const metadata = {
      role: "PASTOR",
      church_id: session.churchId,
      church_slug: churchSlug,
      member_id: parsed.data.memberId
    };
    const appUserQuery = supabase.from("app_user");
    // @ts-expect-error Supabase type inference issue
    await appUserQuery.upsert(
      {
        id: userId,
        email: parsed.data.email,
        role: "PASTOR",
        church_id: session.churchId,
        member_id: parsed.data.memberId
      },
      { onConflict: "id" }
    );
    await supabase.auth.admin.updateUserById(userId, {
      email: parsed.data.email,
      user_metadata: metadata
    });
  };

  const createAuthUser = async () => {
    const churchSlug = await ensureSlug();
    if (!churchSlug) throw new Error("Missing church slug");
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
    if (createUserError) throw createUserError;
    const authUser = createdUser?.user;
    if (!authUser) throw new Error("Failed to create pastor auth user");
    await supabase.auth.admin.inviteUserByEmail(parsed.data.email, { data: metadata });
    const appUserQuery2 = supabase.from("app_user");
    // @ts-expect-error Supabase type inference issue
    await appUserQuery2.upsert(
      {
        id: authUser.id,
        email: parsed.data.email,
        role: "PASTOR",
        church_id: session.churchId,
        member_id: parsed.data.memberId
      },
      { onConflict: "id" }
    );
  };

  try {
    if (appUser?.id) {
      await syncExistingUser(appUser.id);
    } else {
      await createAuthUser();
    }
  } catch (err) {
    console.error("Failed to sync pastor auth metadata", err);
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_: Request, { params }: Props) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN" || !session.churchId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("pastor_profile").delete().eq("id", params.pastorId).eq("church_id", session.churchId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
