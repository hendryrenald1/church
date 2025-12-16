import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";

export async function GET() {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from("church").select("*").eq("id", session.churchId).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(req: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const payload = await req.json();
  const supabase = createSupabaseServerClient();
  const adminSupabase = createSupabaseAdminClient();
  const { data: currentChurch, error: fetchError } = await supabase
    .from("church")
    .select("id, name, primary_contact_name, primary_contact_email")
    .eq("id", session.churchId)
    .single();
  if (fetchError || !currentChurch) {
    return NextResponse.json({ error: fetchError?.message ?? "Church not found" }, { status: 404 });
  }
  const previousEmail = currentChurch.primary_contact_email;
  const requestedEmail = payload.primaryContactEmail;
  const emailChanged = Boolean(requestedEmail && requestedEmail !== previousEmail);
  let linkedAppUser: { id: string; email: string } | null = null;

  if (requestedEmail) {
    if (emailChanged) {
      const { data: directMatch, error: directMatchError } = await adminSupabase
        .from("app_user")
        .select("id, email")
        .eq("church_id", session.churchId)
        .eq("email", previousEmail)
        .maybeSingle();
      if (directMatchError) {
        console.error("Failed to load linked admin user:", directMatchError);
        return NextResponse.json({ error: "Unable to load linked admin user" }, { status: 500 });
      }
      if (directMatch) {
        linkedAppUser = directMatch;
      } else {
        const { data: fallbackUsers, error: fallbackError } = await adminSupabase
          .from("app_user")
          .select("id, email")
          .eq("church_id", session.churchId)
          .eq("role", "ADMIN")
          .order("created_at", { ascending: true })
          .limit(1);
        if (fallbackError) {
          console.error("Failed to load fallback admin user:", fallbackError);
          return NextResponse.json({ error: "Unable to load linked admin user" }, { status: 500 });
        }
        linkedAppUser = fallbackUsers?.[0] ?? null;
      }
      if (!linkedAppUser) {
        return NextResponse.json({ error: "Linked admin user not found" }, { status: 404 });
      }
      const { error: appUserUpdateError } = await adminSupabase
        .from("app_user")
        .update({ email: requestedEmail })
        .eq("id", linkedAppUser.id);
      if (appUserUpdateError) {
        console.error("Failed to sync app_user email:", appUserUpdateError);
        return NextResponse.json({ error: "Unable to update linked admin user" }, { status: 500 });
      }
    }
  }

  const updates: Record<string, string | undefined> = {
    name: payload.name,
    primary_contact_name: payload.primaryContactName
  };
  if (requestedEmail) {
    updates.primary_contact_email = requestedEmail;
  }

  const { error } = await supabase
    .from("church")
    .update(updates)
    .eq("id", session.churchId);
  if (error) {
    if (emailChanged && linkedAppUser) {
      await adminSupabase
        .from("app_user")
        .update({ email: linkedAppUser.email })
        .eq("id", linkedAppUser.id)
        .catch((revertAppUserError) => console.error("Failed to revert app_user email:", revertAppUserError));
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
